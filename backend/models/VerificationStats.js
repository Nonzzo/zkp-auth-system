const mongoose = require('mongoose');

const verificationStatsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalVerifications: {
    type: Number,
    default: 0
  },
  successfulVerifications: {
    type: Number,
    default: 0
  },
  lastVerified: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('VerificationStats', verificationStatsSchema);