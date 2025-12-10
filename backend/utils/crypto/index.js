const CryptoService = require('./CryptoService');
const KeyRotationService = require('./KeyRotationService');

const cryptoService = new CryptoService();
const keyRotationService = new KeyRotationService(cryptoService);

module.exports = { cryptoService, keyRotationService };