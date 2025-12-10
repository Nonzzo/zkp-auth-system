const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { KEY_CONFIG } = require('../../config/keys/keyConfig');

class CryptoService {
  constructor() {
    this.currentKey = null;
    this.keyPath = KEY_CONFIG.keyDirectory;
  }

  async initialize() {
    try {
      await fs.mkdir(this.keyPath, { recursive: true });
      await this.loadOrGenerateKey();
    } catch (error) {
      console.error('Failed to initialize CryptoService:', error);
      throw error;
    }
  }

  async loadOrGenerateKey() {
    const keyFile = path.join(this.keyPath, 'current.key');
    try {
      this.currentKey = await fs.readFile(keyFile);
    } catch {
      this.currentKey = crypto.randomBytes(KEY_CONFIG.keyLength);
      await fs.writeFile(keyFile, this.currentKey);
    }
  }

  async encrypt(data) {
    if (!this.currentKey) throw new Error('CryptoService not initialized');

    const iv = crypto.randomBytes(KEY_CONFIG.ivLength);
    const cipher = crypto.createCipheriv(KEY_CONFIG.algorithm, this.currentKey, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  async decrypt(data) {
    if (!this.currentKey) throw new Error('CryptoService not initialized');

    const decipher = crypto.createDecipheriv(
      KEY_CONFIG.algorithm,
      this.currentKey,
      Buffer.from(data.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

module.exports = CryptoService;