const bookController = require('../../../controllers/book.controller');
const Book = require('../../../models/book.model');
const Section = require('../../../models/section.model');
const User = require('../../../models/user.model');
const { mockRequest, mockResponse } = require('../../helpers/testHelpers');

// Mock dependencies
jest.mock('../../../services/encryption.service');

const encryptionService = require('../../../services/encryption.service');

describe('Book Controller', () => {
  let req, res, testUser, testBook;

  beforeEach(async () => {
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();

    // Create test user
    testUser = new User({
      email: 'test@example.com',
      password: 'TestPass123'
    });
    await testUser.save();

    // Create test book
    testBook = new Book({
      title: 'Test Book',
      description: 'Test Description',
      user: testUser._id
    });
    await testBook.save();

    req.user = testUser.toJSON();
  });

  describe('getBooks', () => {
    it('should get all books for authenticated user', async () => {
      // Create additional book
      const book2 = new Book({
        title: 'Book 2',
        description: 'Description 2',
        user: testUser._id
      });
      await book2.save();

      await bookController.getBooks(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: expect.arrayContaining([
          expect.objectContaining({ title: 'Test Book' }),
          expect.objectContaining({ title: 'Book 2' })
        ])
      });
    });

    it('should return empty array when user has no books', async () => {
      // Delete the test book
      await Book.deleteMany({ user: testUser._id });

      await bookController.getBooks(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 0,
        data: []
      });
    });

    it('should handle getBooks errors', async () => {
      // Mock Book.find to throw error
      const originalFind = Book.find;
      Book.find = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      await bookController.getBooks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch books',
        error: 'Database error'
      });

      // Restore original method
      Book.find = originalFind;
    });
  });

  describe('createBook', () => {
    it('should create a new book successfully', async () => {
      const bookData = {
        title: 'New Book',
        description: 'New book description'
      };

      req.body = bookData;

      await bookController.createBook(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Book created successfully',
        data: expect.objectContaining({
          title: bookData.title,
          description: bookData.description,
          user: testUser._id.toString()
        })
      });

      // Verify book was created in database
      const savedBook = await Book.findOne({ title: bookData.title });
      expect(savedBook).toBeDefined();
      expect(savedBook.title).toBe(bookData.title);
    });

    it('should create book without description', async () => {
      req.body = { title: 'Book Without Description' };

      await bookController.createBook(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Book created successfully',
        data: expect.objectContaining({
          title: 'Book Without Description'
        })
      });
    });

    it('should handle createBook errors', async () => {
      req.body = { title: 'New Book' };

      // Mock Book constructor to throw error
      const originalBook = Book;
      const mockBook = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });
      Book = mockBook;

      await bookController.createBook(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create book',
        error: 'Database error'
      });

      // Restore original constructor
      Book = originalBook;
    });
  });

  describe('getBookSections', () => {
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

      req.params = { bookId: testBook._id.toString() };

      // Mock encryption service
      encryptionService.decrypt
        .mockReturnValueOnce('Decrypted story 1')
        .mockReturnValueOnce('Decrypted story 2');

      await bookController.getBookSections(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: {
          book: expect.objectContaining({ title: 'Test Book' }),
          sections: expect.arrayContaining([
            expect.objectContaining({
              title: 'Section 1',
              story: 'Decrypted story 1'
            }),
            expect.objectContaining({
              title: 'Section 2',
              story: 'Decrypted story 2'
            })
          ])
        }
      });

      expect(encryptionService.decrypt).toHaveBeenCalledTimes(2);
    });

    it('should return 404 for non-existent book', async () => {
      const nonExistentBookId = '507f1f77bcf86cd799439011';
      req.params = { bookId: nonExistentBookId };

      await bookController.getBookSections(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Book not found'
      });
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

      req.params = { bookId: otherBook._id.toString() };

      await bookController.getBookSections(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Book not found'
      });
    });

    it('should handle decryption errors gracefully', async () => {
      const section = new Section({
        title: 'Section 1',
        story: 'encrypted-story',
        book: testBook._id,
        order: 1
      });
      await section.save();

      req.params = { bookId: testBook._id.toString() };

      // Mock encryption service to throw error
      encryptionService.decrypt.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      await bookController.getBookSections(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: {
          book: expect.objectContaining({ title: 'Test Book' }),
          sections: expect.arrayContaining([
            expect.objectContaining({
              title: 'Section 1',
              story: '[Encryption Error]'
            })
          ])
        }
      });
    });

    it('should handle getBookSections errors', async () => {
      req.params = { bookId: testBook._id.toString() };

      // Mock Book.findOne to throw error
      const originalFindOne = Book.findOne;
      Book.findOne = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      await bookController.getBookSections(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch book sections',
        error: 'Database error'
      });

      // Restore original method
      Book.findOne = originalFindOne;
    });
  });

  describe('addSection', () => {
    it('should add a new section to a book successfully', async () => {
      const sectionData = {
        title: 'New Section',
        story: 'This is a new story content.'
      };

      req.body = sectionData;
      req.params = { bookId: testBook._id.toString() };

      // Mock encryption service
      encryptionService.encrypt.mockReturnValue('encrypted-story-content');

      await bookController.addSection(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Section added successfully',
        data: expect.objectContaining({
          title: sectionData.title,
          story: sectionData.story, // Should return original story, not encrypted
          book: testBook._id.toString(),
          order: 1
        })
      });

      // Verify section was created in database
      const savedSection = await Section.findOne({ title: sectionData.title });
      expect(savedSection).toBeDefined();
      expect(savedSection.title).toBe(sectionData.title);
      expect(savedSection.story).not.toBe(sectionData.story); // Should be encrypted in DB

      expect(encryptionService.encrypt).toHaveBeenCalledWith(sectionData.story);
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

      req.body = {
        title: 'New Section',
        story: 'New story'
      };
      req.params = { bookId: testBook._id.toString() };

      encryptionService.encrypt.mockReturnValue('encrypted-story');

      await bookController.addSection(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Section added successfully',
        data: expect.objectContaining({
          order: 2 // Should be next order number
        })
      });
    });

    it('should return 404 for non-existent book', async () => {
      const nonExistentBookId = '507f1f77bcf86cd799439011';
      req.params = { bookId: nonExistentBookId };
      req.body = {
        title: 'New Section',
        story: 'New story'
      };

      await bookController.addSection(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Book not found'
      });
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

      req.params = { bookId: otherBook._id.toString() };
      req.body = {
        title: 'New Section',
        story: 'New story'
      };

      await bookController.addSection(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Book not found'
      });
    });

    it('should handle addSection errors', async () => {
      req.params = { bookId: testBook._id.toString() };
      req.body = {
        title: 'New Section',
        story: 'New story'
      };

      // Mock Section constructor to throw error
      const originalSection = Section;
      const mockSection = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });
      Section = mockSection;

      await bookController.addSection(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to add section',
        error: 'Database error'
      });

      // Restore original constructor
      Section = originalSection;
    });
  });
}); 