const express = require('express');
const router = express.Router();
const { cryptoService } = require('../utils/crypto');
const { validateCryptoRequest } = require('../middleware/cryptoValidation');
const { cryptoLimiter } = require('../middleware/rateLimit');
const auditLogger = require('../utils/crypto/AuditLogger');

router.post('/secure-data', 
  cryptoLimiter,
  validateCryptoRequest,
  async (req, res) => {
    try {
      const { sensitiveData } = req.body;
      const requestId = Date.now().toString();
      
      // Log encryption attempt
      await auditLogger.log('encryption_attempt', {
        requestId,
        timestamp: new Date().toISOString()
      });

      const encrypted = await cryptoService.encrypt(sensitiveData);
      const decrypted = await cryptoService.decrypt(encrypted);

      // Log successful encryption
      await auditLogger.log('encryption_success', {
        requestId,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        requestId,
        encrypted,
        decrypted,
        message: 'Encryption/Decryption test successful'
      });
    } catch (error) {
      console.error('Crypto test error:', error);
      
      // Log encryption failure
      await auditLogger.log('encryption_failure', {
        error: error.message,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        error: 'Encryption/Decryption test failed',
        message: error.message
      });
    }
});

module.exports = router;