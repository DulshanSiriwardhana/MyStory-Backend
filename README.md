# Book Writing App Backend

A secure, modular Node.js backend for a book writing application with user authentication, book management, and encrypted story content.

## Features

- **Authentication**: JWT-based user registration and login
- **Book Management**: Create and manage books with sections
- **Story Encryption**: AES encryption for sensitive story content
- **Security**: Input validation, rate limiting, and security headers
- **Logging**: Comprehensive logging with Winston
- **Testing**: Complete test suite with Jest

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Encryption**: Node.js crypto (AES-256-CBC)
- **Validation**: express-validator
- **Security**: helmet, cors, express-sanitizer
- **Rate Limiting**: express-rate-limit
- **Logging**: Winston
- **Testing**: Jest, Supertest

## Project Structure

```
project-root/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── auth.controller.js     # Handles user logic
│   └── book.controller.js     # Handles books & sections
├── middleware/
│   ├── auth.middleware.js     # Verifies JWT
│   └── error.middleware.js    # Global error handler
├── models/
│   ├── user.model.js
│   ├── book.model.js
│   └── section.model.js
├── routes/
│   ├── auth.routes.js
│   └── book.routes.js
├── services/
│   ├── encryption.service.js  # AES encrypt/decrypt story
│   └── jwt.service.js         # JWT creation/verification
├── utils/
│   ├── logger.js              # Winston logger
│   └── validator.js           # Input validation
├── __tests__/
│   ├── setup.js               # Test setup
│   ├── helpers/
│   │   └── testHelpers.js     # Test utilities
│   ├── unit/                  # Unit tests
│   └── integration/           # Integration tests
├── .env                       # Environment variables
├── env.example               # Example environment config
├── env.test                  # Test environment config
├── jest.config.js            # Jest configuration
├── server.js                 # App entry point
├── package.json
└── README.md
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd book-writing-app-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/book-writing-app
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   AES_SECRET_KEY=your-32-character-aes-secret-key-here
   AES_IV=your-16-character-iv-here
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user details (protected)

### Books

- `GET /api/books` - Get all books for authenticated user (protected)
- `POST /api/books` - Create a new book (protected)

### Sections

- `GET /api/books/:bookId/sections` - Get all sections of a book (protected)
- `POST /api/books/:bookId/sections` - Add a new section to a book (protected)

## Testing

### Prerequisites

1. **Set up test environment**
   ```bash
   cp env.test .env.test
   ```

2. **Ensure test database is available**
   - MongoDB should be running
   - Test database will be created automatically

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test files
npm test -- auth.integration.test.js
```

### Test Structure

- **Unit Tests**: Test individual functions and modules
  - Services (encryption, JWT)
  - Models (User, Book, Section)
  - Controllers (auth, book)
  - Middleware (auth, error)

- **Integration Tests**: Test API endpoints
  - Authentication flow
  - Book and section management
  - Error handling
  - Rate limiting

### Test Coverage

The test suite covers:
- ✅ User registration and login
- ✅ JWT token generation and verification
- ✅ Password hashing and comparison
- ✅ Book creation and retrieval
- ✅ Section creation with encryption
- ✅ Input validation
- ✅ Error handling
- ✅ Authentication middleware
- ✅ Rate limiting
- ✅ Database operations

## Security Features

- **Password Security**: bcrypt hashing with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Story Encryption**: AES-256-CBC encryption for sensitive content
- **Input Validation**: Comprehensive validation with express-validator
- **Security Headers**: Helmet for security headers
- **CORS Protection**: Configurable CORS settings
- **Rate Limiting**: Protection against brute force attacks
- **Input Sanitization**: XSS protection with express-sanitizer

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `AES_SECRET_KEY` | AES encryption key (32 chars) | - |
| `AES_IV` | AES initialization vector (16 chars) | - |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `LOG_LEVEL` | Logging level | info |

## Development

### Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
npm run test:watch # Run tests in watch mode
```

### Code Style

- Use ES6+ features
- Follow async/await patterns
- Implement proper error handling
- Add comprehensive logging
- Write tests for new features

## Deployment

1. **Set production environment variables**
2. **Ensure MongoDB is accessible**
3. **Set up proper logging**
4. **Configure CORS for production domains**
5. **Use PM2 or similar for process management**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details 