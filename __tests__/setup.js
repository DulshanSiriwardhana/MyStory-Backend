require('dotenv').config({ path: '.env.test' });
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Book = require('../models/book.model');
const Section = require('../models/section.model');

process.env.NODE_ENV = 'test';

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  const testDbUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/book-writing-app-test';
  await mongoose.connect(testDbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

beforeEach(async () => {
  await User.deleteMany({});
  await Book.deleteMany({});
  await Section.deleteMany({});
  jest.clearAllMocks();
});

afterAll(async () => {
  await mongoose.connection.close();
});

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};