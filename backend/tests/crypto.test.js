const { cryptoService, keyRotationService } = require('../utils/crypto');

describe('Crypto Service', () => {
  beforeAll(async () => {
    await cryptoService.initialize();
  });

  test('should encrypt and decrypt data', async () => {
    const testData = 'sensitive information';
    const encrypted = await cryptoService.encrypt(testData);
    const decrypted = await cryptoService.decrypt(encrypted);
    expect(decrypted).toBe(testData);
  });
});