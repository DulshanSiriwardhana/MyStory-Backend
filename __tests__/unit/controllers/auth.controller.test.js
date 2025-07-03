const authController = require('../../../controllers/auth.controller');
const User = require('../../../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { mockRequest, mockResponse } = require('../../helpers/testHelpers');

// Mock dependencies
jest.mock('../../../services/jwt.service');
jest.mock('../../../utils/logger');

const jwtService = require('../../../services/jwt.service');
const logger = require('../../../utils/logger');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'NewPass123'
      };

      req.body = userData;

      // Mock JWT service
      jwtService.generateToken.mockReturnValue('mock-jwt-token');

      // Mock logger
      logger.info.mockImplementation(() => {});

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: expect.objectContaining({
          email: userData.email,
          token: 'mock-jwt-token'
        })
      });

      expect(jwtService.generateToken).toHaveBeenCalledWith(
        expect.objectContaining({ userId: expect.any(String) })
      );
      expect(logger.info).toHaveBeenCalledWith(
        `New user registered: ${userData.email}`
      );

      // Verify user was created in database
      const savedUser = await User.findOne({ email: userData.email });
      expect(savedUser).toBeDefined();
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
    });

    it('should return error if user already exists', async () => {
      // Create existing user
      const existingUser = new User({
        email: 'existing@example.com',
        password: 'TestPass123'
      });
      await existingUser.save();

      req.body = {
        email: 'existing@example.com',
        password: 'TestPass123'
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User already exists'
      });
    });

    it('should handle registration errors', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'TestPass123'
      };

      // Mock User constructor to throw error
      const originalUser = User;
      const mockUser = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });
      User = mockUser;

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to register user',
        error: 'Database error'
      });

      expect(logger.error).toHaveBeenCalledWith('Register error:', expect.any(Error));
      
      // Restore original constructor
      User = originalUser;
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      // Create test user
      const testUser = new User({
        email: 'test@example.com',
        password: 'TestPass123'
      });
      await testUser.save();

      req.body = {
        email: 'test@example.com',
        password: 'TestPass123'
      };

      // Mock JWT service
      jwtService.generateToken.mockReturnValue('mock-jwt-token');

      // Mock logger
      logger.info.mockImplementation(() => {});

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: expect.objectContaining({
          email: 'test@example.com',
          token: 'mock-jwt-token'
        })
      });

      expect(jwtService.generateToken).toHaveBeenCalledWith(
        expect.objectContaining({ userId: testUser._id.toString() })
      );
      expect(logger.info).toHaveBeenCalledWith(
        `User logged in: ${testUser.email}`
      );
    });

    it('should return error for non-existent user', async () => {
      req.body = {
        email: 'nonexistent@example.com',
        password: 'TestPass123'
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials'
      });
    });

    it('should return error for incorrect password', async () => {
      // Create test user
      const testUser = new User({
        email: 'test@example.com',
        password: 'TestPass123'
      });
      await testUser.save();

      req.body = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials'
      });
    });

    it('should handle login errors', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'TestPass123'
      };

      // Mock User.findOne to throw error
      const originalFindOne = User.findOne;
      User.findOne = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to login user',
        error: 'Database error'
      });

      expect(logger.error).toHaveBeenCalledWith('Login error:', expect.any(Error));
      
      // Restore original method
      User.findOne = originalFindOne;
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user details', async () => {
      // Create test user
      const testUser = new User({
        email: 'test@example.com',
        password: 'TestPass123'
      });
      await testUser.save();

      req.user = testUser.toJSON();

      await authController.getCurrentUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          email: 'test@example.com'
        })
      });
    });

    it('should handle getCurrentUser errors', async () => {
      req.user = { email: 'test@example.com' };

      // Mock response.json to throw error
      res.json.mockImplementation(() => {
        throw new Error('Response error');
      });

      await authController.getCurrentUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to get current user',
        error: 'Response error'
      });

      expect(logger.error).toHaveBeenCalledWith('Get current user error:', expect.any(Error));
    });
  });
}); 