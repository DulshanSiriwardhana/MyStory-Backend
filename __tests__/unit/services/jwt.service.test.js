const jwtService = require('../../../services/jwt.service');

describe('JWTService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = 'test-secret-key-for-jwt-service';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = jwtService.generateToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different users', () => {
      const userId1 = '507f1f77bcf86cd799439011';
      const userId2 = '507f1f77bcf86cd799439012';
      
      const token1 = jwtService.generateToken(userId1);
      const token2 = jwtService.generateToken(userId2);
      
      expect(token1).not.toBe(token2);
    });

    it('should use default expiration when JWT_EXPIRES_IN is not set', () => {
      delete process.env.JWT_EXPIRES_IN;
      const userId = '507f1f77bcf86cd799439011';
      
      expect(() => {
        jwtService.generateToken(userId);
      }).not.toThrow();
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token successfully', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = jwtService.generateToken(userId);
      const decoded = jwtService.verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(userId);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        jwtService.verifyToken('invalid-token');
      }).toThrow('Invalid or expired token');
    });

    it('should throw error for empty token', () => {
      expect(() => {
        jwtService.verifyToken('');
      }).toThrow('Invalid or expired token');
    });

    it('should throw error for malformed token', () => {
      expect(() => {
        jwtService.verifyToken('not.a.valid.jwt');
      }).toThrow('Invalid or expired token');
    });

    it('should throw error for token with wrong secret', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = jwtService.generateToken(userId);
      
      // Change the secret
      process.env.JWT_SECRET = 'different-secret';
      
      expect(() => {
        jwtService.verifyToken(token);
      }).toThrow('Invalid or expired token');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Authorization header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
      const authHeader = `Bearer ${token}`;
      
      const extractedToken = jwtService.extractTokenFromHeader(authHeader);
      expect(extractedToken).toBe(token);
    });

    it('should throw error for missing Authorization header', () => {
      expect(() => {
        jwtService.extractTokenFromHeader();
      }).toThrow('Authorization header must start with Bearer');
    });

    it('should throw error for Authorization header without Bearer', () => {
      expect(() => {
        jwtService.extractTokenFromHeader('Token some-token');
      }).toThrow('Authorization header must start with Bearer');
    });

    it('should throw error for Authorization header with wrong format', () => {
      expect(() => {
        jwtService.extractTokenFromHeader('Bearer');
      }).toThrow('Authorization header must start with Bearer');
    });

    it('should throw error for empty Authorization header', () => {
      expect(() => {
        jwtService.extractTokenFromHeader('');
      }).toThrow('Authorization header must start with Bearer');
    });
  });

  describe('token lifecycle', () => {
    it('should generate and verify token successfully', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = jwtService.generateToken(userId);
      const decoded = jwtService.verifyToken(token);
      
      expect(decoded.userId).toBe(userId);
    });

    it('should extract token from header and verify it', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = jwtService.generateToken(userId);
      const authHeader = `Bearer ${token}`;
      
      const extractedToken = jwtService.extractTokenFromHeader(authHeader);
      const decoded = jwtService.verifyToken(extractedToken);
      
      expect(decoded.userId).toBe(userId);
    });
  });
}); 