const rateLimit = require('express-rate-limit');

const cryptoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many encryption requests',
    message: 'Please try again later'
  }
});

module.exports = { cryptoLimiter };