const express = require("express");
const { hashPassword, generateSalt } = require("../utils/hash");
const { generateProof, verifyProof } = require("../utils/zkp");
const { ethers } = require("ethers");
const cors = require('cors');
const router = express.Router();

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true
};

// MongoDB User Model (Assuming we have a User schema)
const User = require("../models/User");


router.post('/register', cors(corsOptions), async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const salt = generateSalt();
    const hashedPassword = await hashPassword(password);
    
    const newUser = new User({
      username,
      passwordHash: hashedPassword,
      salt
    });

    await newUser.save();

    res.status(201).json({
      message: "✅ Registration successful!",
      userId: newUser._id
    });
  } catch (error) {
    console.error("❌ Error in registration:", error);
    res.status(500).json({
      error: "Server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 

router.post('/login', cors(corsOptions), async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('Login attempt for user:', username);

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    try {
      // Generate proof
      console.log('Generating proof...');
      const proofData = await generateProof(user.passwordHash, password, user.salt);
      
      console.log('Verifying proof...');
      // Verify the proof
      const isValid = await verifyProof(proofData.proof, proofData.publicSignals);

      if (!isValid) {
        return res.status(401).json({ message: "Authentication failed" });
      }

      const token = Buffer.from(`${username}-${Date.now()}`).toString('base64');
      
      res.json({
        message: "✅ Authentication successful!",
        token,
        username,
        userId: user._id
      });

    } catch (proofError) {
      console.error('Proof verification error:', proofError);
      return res.status(500).json({
        message: "Error during proof verification",
        debug: proofError.message
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: "Server error",
      debug: error.message
    });
  }
});




/**
 * 2️⃣ Generate Zero-Knowledge Proof for Login
 */
router.post("/generate-proof", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Fetch user from DB
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: "User not found!" });

        // Generate proof
        const proofData = await generateProof(user.passwordHash, password, user.salt);

        return res.json({ proof: proofData.proof, publicSignals: proofData.publicSignals });
    } catch (err) {
        console.error("❌ Error generating proof:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * 3️⃣ Verify the Zero-Knowledge Proof
 */
router.post("/verify-proof", cors(corsOptions), async (req, res) => {
    try {
        const { proof, publicSignals } = req.body;

        // Verify proof
        const isValid = await verifyProof(proof, publicSignals);

        if (isValid) {
            return res.json({ message: "✅ Authentication successful!" });
        } else {
            return res.status(400).json({ error: "❌ Authentication failed!" });
        }
    } catch (err) {
        console.error("❌ Error verifying proof:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;


