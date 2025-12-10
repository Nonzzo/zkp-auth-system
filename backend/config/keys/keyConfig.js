const path = require('path');

const KEY_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyDirectory: path.join(__dirname, '../../../.keys'),
  keyLength: 32,
  ivLength: 16,
  saltLength: 32,
  iterations: 100000,
  digest: 'sha512'
};

const ROTATION_CONFIG = {
  interval: '7d',
  backupCount: 3
};

module.exports = { KEY_CONFIG, ROTATION_CONFIG };