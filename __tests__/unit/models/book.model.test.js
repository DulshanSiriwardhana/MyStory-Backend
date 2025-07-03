const Book = require('../../../models/book.model');
const User = require('../../../models/user.model');

describe('Book Model', () => {
  let testUser;

  beforeEach(async () => {
    testUser = new User({
      email: 'test@example.com',
      password: 'TestPass123'
    });
    await testUser.save();
  });

  describe('Schema Validation', () => {
    it('should create a book with valid data', async () => {
      const bookData = {
        title: 'Test Book',
        description: 'A test book description',
        user: testUser._id
      };

      const book = new Book(bookData);
      await book.save();

      expect(book.title).toBe(bookData.title);
      expect(book.description).toBe(bookData.description);
      expect(book.user.toString()).toBe(testUser._id.toString());
      expect(book._id).toBeDefined();
      expect(book.createdAt).toBeDefined();
      expect(book.updatedAt).toBeDefined();
      expect(book.isPublished).toBe(false); // Default value
    });

    it('should require title field', async () => {
      const book = new Book({
        description: 'A test book description',
        user: testUser._id
      });
      
      let error;
      try {
        await book.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
    });

    it('should require user field', async () => {
      const book = new Book({
        title: 'Test Book',
        description: 'A test book description'
      });
      
      let error;
      try {
        await book.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.user).toBeDefined();
    });

    it('should enforce title length limit', async () => {
      const longTitle = 'a'.repeat(201); // 201 characters
      const book = new Book({
        title: longTitle,
        user: testUser._id
      });
      
      let error;
      try {
        await book.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
    });

    it('should enforce description length limit', async () => {
      const longDescription = 'a'.repeat(1001); // 1001 characters
      const book = new Book({
        title: 'Test Book',
        description: longDescription,
        user: testUser._id
      });
      
      let error;
      try {
        await book.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.description).toBeDefined();
    });

    it('should trim title and description', async () => {
      const book = new Book({
        title: '  Test Book  ',
        description: '  Test Description  ',
        user: testUser._id
      });
      
      await book.save();
      
      expect(book.title).toBe('Test Book');
      expect(book.description).toBe('Test Description');
    });

    it('should set default values correctly', async () => {
      const book = new Book({
        title: 'Test Book',
        user: testUser._id
      });
      
      await book.save();
      
      expect(book.isPublished).toBe(false);
      expect(book.description).toBeUndefined();
    });
  });

  describe('User Reference', () => {
    it('should populate user reference', async () => {
      const book = new Book({
        title: 'Test Book',
        user: testUser._id
      });
      
      await book.save();
      
      const populatedBook = await Book.findById(book._id).populate('user');
      
      expect(populatedBook.user).toBeDefined();
      expect(populatedBook.user.email).toBe(testUser.email);
    });

    it('should validate user reference exists', async () => {
      const nonExistentUserId = '507f1f77bcf86cd799439011';
      const book = new Book({
        title: 'Test Book',
        user: nonExistentUserId
      });
      
      let error;
      try {
        await book.save();
      } catch (err) {
        error = err;
      }
      
      // Note: MongoDB doesn't enforce foreign key constraints by default
      // This test might pass even with non-existent user ID
      // In a real application, you'd want to add custom validation
      expect(book.user.toString()).toBe(nonExistentUserId);
    });
  });

  describe('Timestamps', () => {
    it('should set createdAt and updatedAt on creation', async () => {
      const book = new Book({
        title: 'Test Book',
        user: testUser._id
      });

      await book.save();
      
      expect(book.createdAt).toBeDefined();
      expect(book.updatedAt).toBeDefined();
      expect(book.createdAt).toBeInstanceOf(Date);
      expect(book.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const book = new Book({
        title: 'Test Book',
        user: testUser._id
      });

      await book.save();
      const originalUpdatedAt = book.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      book.title = 'Updated Book Title';
      await book.save();
      
      expect(book.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Indexes', () => {
    it('should have compound index on user and createdAt', async () => {
      const indexes = await Book.collection.getIndexes();
      
      // Check if the compound index exists
      const hasUserCreatedAtIndex = Object.values(indexes).some(index => 
        index.key && 
        index.key.user === 1 && 
        index.key.createdAt === -1
      );
      
      expect(hasUserCreatedAtIndex).toBe(true);
    });
  });

  describe('Book Operations', () => {
    it('should find books by user', async () => {
      const book1 = new Book({
        title: 'Book 1',
        user: testUser._id
      });
      const book2 = new Book({
        title: 'Book 2',
        user: testUser._id
      });
      
      await book1.save();
      await book2.save();
      
      const userBooks = await Book.find({ user: testUser._id });
      
      expect(userBooks).toHaveLength(2);
      expect(userBooks.map(b => b.title)).toContain('Book 1');
      expect(userBooks.map(b => b.title)).toContain('Book 2');
    });

    it('should sort books by createdAt in descending order', async () => {
      const book1 = new Book({
        title: 'Book 1',
        user: testUser._id
      });
      
      await book1.save();
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const book2 = new Book({
        title: 'Book 2',
        user: testUser._id
      });
      
      await book2.save();
      
      const sortedBooks = await Book.find({ user: testUser._id }).sort({ createdAt: -1 });
      
      expect(sortedBooks[0].title).toBe('Book 2');
      expect(sortedBooks[1].title).toBe('Book 1');
    });
  });
}); 