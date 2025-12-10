const express = require("express");
const { hashPassword, generateSalt } = require("../utils/hash");
const { generateProof, verifyProof } = require("../utils/zkp");
const { ethers } = require("ethers");
const router = express.Router();
const { cryptoService } = require('../utils/crypto');
const auditLogger = require('../utils/crypto/AuditLogger');
const logger = require('../utils/monitoring/logger');
 const VerificationStats = require("../models/VerificationStats"); 
const {
  proofGenerationDuration,
  proofVerificationDuration,
  authAttempts,
  proofGenerated,
  proofVerified,
  activeVerifications,
  usersRegistered
} = require('../utils/monitoring/zkpMetrics');

const User = require("../models/User");

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const salt = generateSalt();
    const hashedPassword = await hashPassword(password, salt);  // ← FIX: Add salt parameter
    
    const newUser = new User({
      username,
      passwordHash: hashedPassword,
      salt
    });

    await newUser.save();
    usersRegistered.inc();

    logger.info({ userId: newUser._id, username }, 'User registered successfully');
    res.status(201).json({
      message: "✅ Registration successful!",
      userId: newUser._id
    });
  } catch (error) {
    authAttempts.labels('registration_error').inc();
    logger.error({ error: error.message, stack: error.stack }, 'Registration error');  // ← FIX: Add stack trace
    res.status(500).json({
      error: "Server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/login', async (req, res) => {
  const proofTimer = proofGenerationDuration.startTimer({ status: 'attempt' });

  try {
    const { username, password } = req.body;
    
    logger.info({ username }, 'Login attempt started');

    if (!username || !password) {
      authAttempts.labels('invalid_input').inc();
      proofTimer({ status: 'failed' });
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      authAttempts.labels('user_not_found').inc();
      proofTimer({ status: 'failed' });
      return res.status(401).json({ message: "Invalid credentials" });
    }
    logger.info({ userId: user._id, username }, 'User found, generating proof...');

    if (global.broadcastVerificationStatus) global.broadcastVerificationStatus(user._id, 'verifying');

    
    try {
      const proofData = await generateProof(user.passwordHash, password, user.salt);
      proofGenerated.labels('success').inc();
      proofTimer({ status: 'success' });
      
      const verifyTimer = proofVerificationDuration.startTimer({ status: 'attempt' });
      activeVerifications.inc();

      try {
        const isValid = await verifyProof(proofData.proof, proofData.publicSignals);

        if (!isValid) {
          proofVerified.labels('invalid').inc();
          verifyTimer({ status: 'invalid' });
          authAttempts.labels('invalid_proof').inc();

          await VerificationStats.findOneAndUpdate(
            { userId: user._id },
            { 
              $inc: { totalVerifications: 1 },
              $set: { lastVerified: new Date() }
            },
            { upsert: true }
          );
          
          await auditLogger.log('authentication_failed', {
            userId: user._id,
            reason: 'Invalid proof'
          });
          if (global.broadcastVerificationStatus) global.broadcastVerificationStatus(user._id, 'failed');
          return res.status(401).json({ message: "Authentication failed" });
        }

        proofVerified.labels('valid').inc();
        verifyTimer({ status: 'success' });
        authAttempts.labels('success').inc();

        await VerificationStats.findOneAndUpdate(
            { userId: user._id },
            { 
              $inc: { totalVerifications: 1, successfulVerifications: 1 },
              $set: { lastVerified: new Date() }
            },
            { upsert: true, new: true }
        );

        const sessionData = {
          userId: user._id,
          timestamp: Date.now()
        };
        
        const encryptedSession = await cryptoService.encrypt(
          JSON.stringify(sessionData)
        );

        await auditLogger.log('session_encrypted', {
          userId: user._id,
          success: true
        });

        const token = Buffer.from(`${username}-${Date.now()}`).toString('base64');
        
        logger.info({ userId: user._id, username }, 'User logged in successfully');

        if (global.broadcastVerificationStatus) global.broadcastVerificationStatus(user._id, 'verified');
        
        res.json({
          message: "✅ Authentication successful!",
          token,
          username,
          userId: user._id,
          session: encryptedSession
        });

      } catch (verifyError) {
        proofVerified.labels('error').inc();
        verifyTimer({ status: 'error' });
        authAttempts.labels('verification_error').inc();
        
        await auditLogger.log('proof_verification_failed', {
          userId: user._id,
          error: verifyError.message
        });
        logger.error({ error: verifyError.message, stack: verifyError.stack }, 'Proof verification error');  // ← FIX: Add stack trace
        return res.status(500).json({
          message: "Error during proof verification",
          debug: verifyError.message
        });
      } finally {
        activeVerifications.dec();
      }

    } catch (proofError) {
      proofGenerated.labels('error').inc();
      proofTimer({ status: 'error' });
      authAttempts.labels('proof_generation_error').inc();
      
      await auditLogger.log('proof_generation_failed', {
        userId: user._id,
        error: proofError.message
      });
      logger.error({ error: proofError.message, stack: proofError.stack }, 'Proof generation error');  // ← FIX: Add stack trace
      return res.status(500).json({
        message: "Error generating proof",
        debug: proofError.message
      });
    }

  } catch (error) {
    authAttempts.labels('login_error').inc();
    proofTimer({ status: 'error' });
    logger.error({ error: error.message, stack: error.stack }, 'Login error');  // ← FIX: Add stack trace
    
    await auditLogger.log('login_failed', {
      error: error.message
    });
    res.status(500).json({
      message: "Server error",
      debug: error.message
    });
  }
});

router.post("/generate-proof", async (req, res) => {
  const proofTimer = proofGenerationDuration.startTimer({ status: 'attempt' });

  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      proofTimer({ status: 'failed' });
      return res.status(404).json({ error: "User not found!" });
    }

    const proofData = await generateProof(user.passwordHash, password, user.salt);
    proofGenerated.labels('success').inc();
    proofTimer({ status: 'success' });

    return res.json({ proof: proofData.proof, publicSignals: proofData.publicSignals });
  } catch (err) {
    proofGenerated.labels('error').inc();
    proofTimer({ status: 'error' });
    logger.error({ error: err.message, stack: err.stack }, 'Proof generation error');  // ← FIX: Add stack trace
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/verify-proof", async (req, res) => {
  const verifyTimer = proofVerificationDuration.startTimer({ status: 'attempt' });
  activeVerifications.inc();

  try {
    const { proof, publicSignals } = req.body;

    const isValid = await verifyProof(proof, publicSignals);

    if (isValid) {
      proofVerified.labels('valid').inc();
      verifyTimer({ status: 'success' });
      return res.json({ message: "✅ Authentication successful!" });
    } else {
      proofVerified.labels('invalid').inc();
      verifyTimer({ status: 'invalid' });
      return res.status(400).json({ error: "❌ Authentication failed!" });
    }
  } catch (err) {
    proofVerified.labels('error').inc();
    verifyTimer({ status: 'error' });
    logger.error({ error: err.message, stack: err.stack }, 'Proof verification error');  // ← FIX: Add stack trace
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    activeVerifications.dec();
  }
});

module.exports = router;