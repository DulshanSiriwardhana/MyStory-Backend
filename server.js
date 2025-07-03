require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const expressSanitizer = require('express-sanitizer');
const rateLimit = require('express-rate-limit');
const errorMiddleware = require('./middleware/error.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const bookRoutes = require('./routes/book.routes');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize inputs
app.use(expressSanitizer());

// Request logging middleware
// app.use((req, res, next) => {
//   logger.info(`${req.method} ${req.url}`, {
//     ip: req.ip,
//     userAgent: req.get('User-Agent')
//   });
//   next();
// });

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to auth routes
app.use('/api/auth', authLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);

// 404 handler
app.use(errorMiddleware.notFound);

// Global error handler
app.use(errorMiddleware.errorHandler);

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    // logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB();
  
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    // logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    // logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      // logger.info('Process terminated');
      mongoose.connection.close();
    });
  });
}

module.exports = app; 