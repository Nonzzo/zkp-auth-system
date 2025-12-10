const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { KEY_CONFIG, ROTATION_CONFIG } = require('../../config/keys/keyConfig');

class KeyRotationService {
  constructor(cryptoService) {
    this.cryptoService = cryptoService;
  }

  async rotateKeys() {
    const timestamp = Date.now();
    const backupPath = path.join(
      KEY_CONFIG.keyDirectory,
      `key-${timestamp}.backup`
    );

    // Backup current key
    const currentKey = await fs.readFile(
      path.join(KEY_CONFIG.keyDirectory, 'current.key')
    );
    await fs.writeFile(backupPath, currentKey);

    // Generate and save new key
    const newKey = crypto.randomBytes(KEY_CONFIG.keyLength);
    await fs.writeFile(
      path.join(KEY_CONFIG.keyDirectory, 'current.key'),
      newKey
    );

    // Clean up old backups
    await this.cleanupOldBackups();
  }

  async cleanupOldBackups() {
    const files = await fs.readdir(KEY_CONFIG.keyDirectory);
    const backups = files
      .filter(f => f.endsWith('.backup'))
      .sort()
      .reverse()
      .slice(ROTATION_CONFIG.backupCount);

    for (const backup of backups) {
      await fs.unlink(path.join(KEY_CONFIG.keyDirectory, backup));
    }
  }
}

module.exports = KeyRotationService;