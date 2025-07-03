const User = require('../../../models/user.model');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  describe('Schema Validation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Should be hashed
      expect(user._id).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should require email field', async () => {
      const user = new User({ password: 'TestPass123' });
      
      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });

    it('should require password field', async () => {
      const user = new User({ email: 'test@example.com' });
      
      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });

    it('should validate email format', async () => {
      const user = new User({
        email: 'invalid-email',
        password: 'TestPass123'
      });
      
      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });

    it('should enforce minimum password length', async () => {
      const user = new User({
        email: 'test@example.com',
        password: '123'
      });
      
      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'TestPass123'
      };

      // Create first user
      await new User(userData).save();

      // Try to create second user with same email
      const duplicateUser = new User(userData);
      
      let error;
      try {
        await duplicateUser.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // MongoDB duplicate key error
    });

    it('should convert email to lowercase', async () => {
      const user = new User({
        email: 'TEST@EXAMPLE.COM',
        password: 'TestPass123'
      });
      
      await user.save();
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const plainPassword = 'TestPass123';
      const user = new User({
        email: 'test@example.com',
        password: plainPassword
      });

      await user.save();
      
      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toMatch(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/); // bcrypt pattern
    });

    it('should not rehash password on update if password not changed', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'TestPass123'
      });
      
      await user.save();
      const originalHash = user.password;
      
      // Update email but not password
      user.email = 'updated@example.com';
      await user.save();
      
      expect(user.password).toBe(originalHash);
    });

    it('should rehash password on update if password changed', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'TestPass123'
      });
      
      await user.save();
      const originalHash = user.password;
      
      // Update password
      user.password = 'NewPass123';
      await user.save();
      
      expect(user.password).not.toBe(originalHash);
      expect(user.password).toMatch(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/);
    });
  });

  describe('Password Comparison', () => {
    it('should compare password correctly', async () => {
      const plainPassword = 'TestPass123';
      const user = new User({
        email: 'test@example.com',
        password: plainPassword
      });

      await user.save();
      
      const isMatch = await user.comparePassword(plainPassword);
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'TestPass123'
      });

      await user.save();
      
      const isMatch = await user.comparePassword('WrongPassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('toJSON Method', () => {
    it('should exclude password from JSON output', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'TestPass123'
      });

      await user.save();
      
      const userJson = user.toJSON();
      
      expect(userJson.email).toBe('test@example.com');
      expect(userJson.password).toBeUndefined();
      expect(userJson._id).toBeDefined();
      expect(userJson.createdAt).toBeDefined();
      expect(userJson.updatedAt).toBeDefined();
    });
  });

  describe('Timestamps', () => {
    it('should set createdAt and updatedAt on creation', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'TestPass123'
      });

      await user.save();
      
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'TestPass123'
      });

      await user.save();
      const originalUpdatedAt = user.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      user.email = 'updated@example.com';
      await user.save();
      
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
}); 