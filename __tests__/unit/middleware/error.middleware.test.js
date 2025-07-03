const errorMiddleware = require('../../../middleware/error.middleware');
const { mockRequest, mockResponse } = require('../../helpers/testHelpers');

describe('Error Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle generic errors', () => {
      const error = new Error('Test error');
      error.statusCode = 500;

      errorMiddleware.errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Test error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });

    it('should handle Mongoose CastError (bad ObjectId)', () => {
      const error = new Error('Cast to ObjectId failed');
      error.name = 'CastError';
      error.kind = 'ObjectId';
      error.value = 'invalid-id';

      errorMiddleware.errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid ID format'
      });
    });

    it('should handle Mongoose duplicate key errors', () => {
      const error = new Error('Duplicate key error');
      error.code = 11000;
      error.keyValue = { email: 'test@example.com' };

      errorMiddleware.errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Duplicate field value entered'
      });
    });

    it('should handle Mongoose validation errors', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      error.errors = {
        email: { message: 'Email is required' },
        password: { message: 'Password is required' }
      };

      errorMiddleware.errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: ['Email is required', 'Password is required']
      });
    });

    it('should handle JWT JsonWebTokenError', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';

      errorMiddleware.errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token'
      });
    });

    it('should handle JWT TokenExpiredError', () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';

      errorMiddleware.errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token'
      });
    });

    it('should include stack trace in development environment', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');
      error.statusCode = 500;

      errorMiddleware.errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Test error',
        stack: error.stack
      });
    });

    it('should not include stack trace in production environment', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');
      error.statusCode = 500;

      errorMiddleware.errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Test error'
      });
    });

    it('should use default status code when not provided', () => {
      const error = new Error('Test error');

      errorMiddleware.errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should use default message when error message is empty', () => {
      const error = new Error('');
      error.statusCode = 400;

      errorMiddleware.errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Something went wrong'
      });
    });
  });

  describe('notFound', () => {
    it('should create 404 error and pass to next', () => {
      req.originalUrl = '/nonexistent-route';

      errorMiddleware.notFound(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not Found - /nonexistent-route',
          statusCode: 404
        })
      );
    });

    it('should handle different URLs', () => {
      req.originalUrl = '/api/books/123';

      errorMiddleware.notFound(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not Found - /api/books/123',
          statusCode: 404
        })
      );
    });
  });
}); 