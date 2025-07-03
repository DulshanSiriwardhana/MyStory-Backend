const jwt = require('jsonwebtoken');
const User = require('../../models/user.model');
const Book = require('../../models/book.model');
const Section = require('../../models/section.model');

// Create a test user
const createTestUser = async (email = 'test@example.com', password = 'TestPass123') => {
  const user = new User({
    email,
    password
  });
  await user.save();
  return user;
};

// Generate JWT token for a user
const generateTestToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

// Create a test book
const createTestBook = async (userId, title = 'Test Book', description = 'Test Description') => {
  const book = new Book({
    title,
    description,
    user: userId
  });
  await book.save();
  return book;
};

// Create a test section
const createTestSection = async (bookId, title = 'Test Section', story = 'Test story content') => {
  const section = new Section({
    title,
    story,
    book: bookId,
    order: 1
  });
  await section.save();
  return section;
};

// Mock request object
const mockRequest = (body = {}, params = {}, query = {}, headers = {}) => ({
  body,
  params,
  query,
  headers,
  user: null,
  ip: '127.0.0.1',
  method: 'GET',
  url: '/test',
  get: jest.fn((name) => headers[name])
});

// Mock response object
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// Mock next function
const mockNext = jest.fn();

module.exports = {
  createTestUser,
  generateTestToken,
  createTestBook,
  createTestSection,
  mockRequest,
  mockResponse,
  mockNext
}; 