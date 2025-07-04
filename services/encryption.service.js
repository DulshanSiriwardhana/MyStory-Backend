const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-cbc';
    this.secretKey = process.env.AES_SECRET_KEY;
    this.iv = process.env.AES_IV;
    
    if (!this.secretKey || this.secretKey.length !== 32) {
      throw new Error('AES_SECRET_KEY must be exactly 32 characters long');
    }
    
    if (!this.iv || this.iv.length !== 16) {
      throw new Error('AES_IV must be exactly 16 characters long');
    }
  }

  encrypt(text) {
    try {
      const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.secretKey), Buffer.from(this.iv));
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  decrypt(encryptedText) {
    try {
      const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.secretKey), Buffer.from(this.iv));
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }
}

module.exports = new EncryptionService(); 