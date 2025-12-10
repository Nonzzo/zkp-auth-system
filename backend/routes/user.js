const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Verification stats schema
const VerificationStats = require('../models/VerificationStats');

router.get('/verification-stats/:userId', verifyToken, async (req, res) => {
  try {
    const stats = await VerificationStats.findOne({ userId: req.params.userId });
    
    if (!stats) {
      return res.json({
        totalVerifications: 0,
        successfulVerifications: 0,
        lastVerified: null
      });
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching verification stats' });
  }
});

module.exports = router;