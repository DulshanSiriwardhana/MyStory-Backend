const jwtService = require('../services/jwt.service');
const User = require('../models/user.model');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = jwtService.extractTokenFromHeader(authHeader);
    const decoded = jwtService.verifyToken(token);
    
    // Find user and attach to request
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = {
  authenticateToken
}; 