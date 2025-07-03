const authMiddleware = require('../../../middleware/auth.middleware');
const jwtService = require('../../../services/jwt.service');
const User = require('../../../models/user.model');
const { mockRequest, mockResponse } = require('../../helpers/testHelpers');

// Mock dependencies
jest.mock('../../../services/jwt.service');
jest.mock('../../../models/user.model');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token and attach user to request', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        toJSON: jest.fn().mockReturnValue({
          _id: '507f1f77bcf86cd799439011',
          email: 'test@example.com'
        })
      };

      req.headers.authorization = 'Bearer valid-token';

      jwtService.extractTokenFromHeader.mockReturnValue('valid-token');
      jwtService.verifyToken.mockReturnValue({ userId: '507f1f77bcf86cd799439011' });
      User.findById.mockResolvedValue(mockUser);

      await authMiddleware.authenticateToken(req, res, next);

      expect(jwtService.extractTokenFromHeader).toHaveBeenCalledWith('Bearer valid-token');
      expect(jwtService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(User.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(req.user).toEqual({
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com'
      });
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 when Authorization header is missing', async () => {
      await authMiddleware.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header is empty', async () => {
      req.headers.authorization = '';

      await authMiddleware.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle JWT extraction errors', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      jwtService.extractTokenFromHeader.mockImplementation(() => {
        throw new Error('Invalid token format');
      });

      await authMiddleware.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle JWT verification errors', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      jwtService.extractTokenFromHeader.mockReturnValue('invalid-token');
      jwtService.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authMiddleware.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not found', async () => {
      req.headers.authorization = 'Bearer valid-token';

      jwtService.extractTokenFromHeader.mockReturnValue('valid-token');
      jwtService.verifyToken.mockReturnValue({ userId: '507f1f77bcf86cd799439011' });
      User.findById.mockResolvedValue(null);

      await authMiddleware.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      req.headers.authorization = 'Bearer valid-token';

      jwtService.extractTokenFromHeader.mockReturnValue('valid-token');
      jwtService.verifyToken.mockReturnValue({ userId: '507f1f77bcf86cd799439011' });
      User.findById.mockRejectedValue(new Error('Database error'));

      await authMiddleware.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication failed'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle malformed Authorization header', async () => {
      req.headers.authorization = 'InvalidFormat token';

      await authMiddleware.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token required'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
}); 