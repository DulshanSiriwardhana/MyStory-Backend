const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../models/user.model');
const Book = require('../../models/book.model');
const Section = require('../../models/section.model');
const jwtService = require('../../services/jwt.service');

// Import app without starting server
const app = require('../../server');

describe('Book Integration Tests', () => {
  let testUser, authToken, testBook;

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});
    await Book.deleteMany({});
    await Section.deleteMany({});
    
    // Create test user
    testUser = new User({
      email: 'test@example.com',
      password: 'TestPass123'
    });
    await testUser.save();

    // Create auth token using the JWT service
    authToken = jwtService.generateToken(testUser._id.toString());

    // Create test book
    testBook = new Book({
      title: 'Test Book',
      description: 'Test Description',
      user: testUser._id
    });
    await testBook.save();
  });

  describe('GET /api/books', () => {
    it('should get all books for authenticated user', async () => {
      // Create additional book
      const book2 = new Book({
        title: 'Book 2',
        description: 'Description 2',
        user: testUser._id
      });
      await book2.save();

      const response = await request(app)
        .get('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map(book => book.title)).toContain('Test Book');
      expect(response.body.data.map(book => book.title)).toContain('Book 2');
    });

    it('should return empty array when user has no books', async () => {
      // Delete the test book
      await Book.deleteMany({ user: testUser._id });

      const response = await request(app)
        .get('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toHaveLength(0);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/books')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });
  });

  describe('POST /api/books', () => {
    it('should create a new book successfully', async () => {
      const bookData = {
        title: 'New Book',
        description: 'New book description'
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Book created successfully');
      expect(response.body.data.title).toBe(bookData.title);
      expect(response.body.data.description).toBe(bookData.description);
      expect(response.body.data.user).toBe(testUser._id.toString());

      // Verify book was created in database
      const savedBook = await Book.findOne({ title: bookData.title });
      expect(savedBook).toBeDefined();
      expect(savedBook.title).toBe(bookData.title);
    });

    it('should create book without description', async () => {
      const bookData = {
        title: 'Book Without Description'
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(bookData.title);
      expect(response.body.data.description).toBeUndefined();
    });

    it('should return 400 for missing title', async () => {
      const bookData = {
        description: 'Description without title'
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 400 for title too long', async () => {
      const bookData = {
        title: 'a'.repeat(201), // 201 characters
        description: 'Description'
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 401 without authentication', async () => {
      const bookData = {
        title: 'New Book',
        description: 'Description'
      };

      const response = await request(app)
        .post('/api/books')
        .send(bookData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });
  });

  describe('GET /api/books/:bookId/sections', () => {
    it('should get all sections of a book with decrypted stories', async () => {
      // Create test sections
      const section1 = new Section({
        title: 'Section 1',
        story: 'encrypted-story-1',
        book: testBook._id,
        order: 1
      });
      const section2 = new Section({
        title: 'Section 2',
        story: 'encrypted-story-2',
        book: testBook._id,
        order: 2
      });
      await section1.save();
      await section2.save();

      const response = await request(app)
        .get(`/api/books/${testBook._id}/sections`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data.book.title).toBe('Test Book');
      expect(response.body.data.sections).toHaveLength(2);
      expect(response.body.data.sections.map(s => s.title)).toContain('Section 1');
      expect(response.body.data.sections.map(s => s.title)).toContain('Section 2');
    });

    it('should return 404 for non-existent book', async () => {
      const nonExistentBookId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/books/${nonExistentBookId}/sections`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Book not found');
    });

    it('should return 404 for book not owned by user', async () => {
      // Create another user and book
      const otherUser = new User({
        email: 'other@example.com',
        password: 'TestPass123'
      });
      await otherUser.save();

      const otherBook = new Book({
        title: 'Other Book',
        user: otherUser._id
      });
      await otherBook.save();

      const response = await request(app)
        .get(`/api/books/${otherBook._id}/sections`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Book not found');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/books/${testBook._id}/sections`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });
  });

  describe('POST /api/books/:bookId/sections', () => {
    it('should add a new section to a book successfully', async () => {
      const sectionData = {
        title: 'New Section',
        story: 'This is a new story content.'
      };

      const response = await request(app)
        .post(`/api/books/${testBook._id}/sections`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(sectionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Section added successfully');
      expect(response.body.data.title).toBe(sectionData.title);
      expect(response.body.data.story).toBe(sectionData.story);
      expect(response.body.data.book).toBe(testBook._id.toString());
      expect(response.body.data.order).toBe(1);

      // Verify section was created in database
      const savedSection = await Section.findOne({ title: sectionData.title });
      expect(savedSection).toBeDefined();
      expect(savedSection.title).toBe(sectionData.title);
    });

    it('should assign correct order number for new section', async () => {
      // Create existing section
      const existingSection = new Section({
        title: 'Existing Section',
        story: 'Existing story',
        book: testBook._id,
        order: 1
      });
      await existingSection.save();

      const sectionData = {
        title: 'New Section',
        story: 'New story'
      };

      const response = await request(app)
        .post(`/api/books/${testBook._id}/sections`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(sectionData)
        .expect(201);

      expect(response.body.data.order).toBe(2); // Should be next order number
    });

    it('should return 400 for missing title', async () => {
      const sectionData = {
        story: 'Story without title'
      };

      const response = await request(app)
        .post(`/api/books/${testBook._id}/sections`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(sectionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 400 for missing story', async () => {
      const sectionData = {
        title: 'Section without story'
      };

      const response = await request(app)
        .post(`/api/books/${testBook._id}/sections`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(sectionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 400 for title too long', async () => {
      const sectionData = {
        title: 'a'.repeat(201), // 201 characters
        story: 'Story content'
      };

      const response = await request(app)
        .post(`/api/books/${testBook._id}/sections`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(sectionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 404 for non-existent book', async () => {
      const nonExistentBookId = '507f1f77bcf86cd799439011';
      const sectionData = {
        title: 'New Section',
        story: 'New story'
      };

      const response = await request(app)
        .post(`/api/books/${nonExistentBookId}/sections`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(sectionData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Book not found');
    });

    it('should return 404 for book not owned by user', async () => {
      // Create another user and book
      const otherUser = new User({
        email: 'other@example.com',
        password: 'TestPass123'
      });
      await otherUser.save();

      const otherBook = new Book({
        title: 'Other Book',
        user: otherUser._id
      });
      await otherBook.save();

      const sectionData = {
        title: 'New Section',
        story: 'New story'
      };

      const response = await request(app)
        .post(`/api/books/${otherBook._id}/sections`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(sectionData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Book not found');
    });

    it('should return 401 without authentication', async () => {
      const sectionData = {
        title: 'New Section',
        story: 'New story'
      };

      const response = await request(app)
        .post(`/api/books/${testBook._id}/sections`)
        .send(sectionData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });
  });
}); 