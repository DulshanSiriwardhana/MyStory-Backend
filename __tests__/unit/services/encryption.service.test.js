const encryptionService = require('../../../services/encryption.service');

describe('EncryptionService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should throw error if AES_SECRET_KEY is not 32 characters', () => {
      process.env.AES_SECRET_KEY = 'short';
      process.env.AES_IV = '1234567890123456';
      
      expect(() => {
        require('../../../services/encryption.service');
      }).toThrow('AES_SECRET_KEY must be exactly 32 characters long');
    });

    it('should throw error if AES_IV is not 16 characters', () => {
      process.env.AES_SECRET_KEY = '12345678901234567890123456789012';
      process.env.AES_IV = 'short';
      
      expect(() => {
        require('../../../services/encryption.service');
      }).toThrow('AES_IV must be exactly 16 characters long');
    });
  });

  describe('encrypt', () => {
    it('should encrypt text successfully', () => {
      const originalText = 'This is a secret message';
      const encrypted = encryptionService.encrypt(originalText);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(originalText);
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should encrypt empty string', () => {
      const encrypted = encryptionService.encrypt('');
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });

    it('should encrypt special characters', () => {
      const textWithSpecialChars = 'Hello! @#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encryptionService.encrypt(textWithSpecialChars);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(textWithSpecialChars);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted text successfully', () => {
      const originalText = 'This is a secret message';
      const encrypted = encryptionService.encrypt(originalText);
      const decrypted = encryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(originalText);
    });

    it('should decrypt empty string', () => {
      const encrypted = encryptionService.encrypt('');
      const decrypted = encryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe('');
    });

    it('should decrypt special characters', () => {
      const textWithSpecialChars = 'Hello! @#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encryptionService.encrypt(textWithSpecialChars);
      const decrypted = encryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(textWithSpecialChars);
    });

    it('should throw error for invalid encrypted text', () => {
      expect(() => {
        encryptionService.decrypt('invalid-encrypted-text');
      }).toThrow('Decryption failed');
    });

    it('should throw error for empty encrypted text', () => {
      expect(() => {
        encryptionService.decrypt('');
      }).toThrow('Decryption failed');
    });
  });

  describe('encrypt and decrypt cycle', () => {
    it('should maintain data integrity through encrypt-decrypt cycle', () => {
      const testCases = [
        'Simple text',
        'Text with numbers 12345',
        'Text with symbols !@#$%^&*()',
        'Text with spaces and tabs',
        'Unicode text: ñáéíóú',
        'Very long text '.repeat(100),
        ''
      ];

      testCases.forEach(text => {
        const encrypted = encryptionService.encrypt(text);
        const decrypted = encryptionService.decrypt(encrypted);
        expect(decrypted).toBe(text);
      });
    });
  });
}); 