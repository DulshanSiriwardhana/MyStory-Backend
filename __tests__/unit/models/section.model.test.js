const mongoose = require('mongoose');
const Section = require('../../../models/section.model');
const Book = require('../../../models/book.model');
const User = require('../../../models/user.model');

describe('Section Model', () => {
  let testUser, testBook;

  beforeEach(async () => {
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
  });

  describe('Schema Validation', () => {
    it('should create a section with valid data', async () => {
      const sectionData = {
        title: 'Test Section',
        story: 'This is a test story content.',
        book: testBook._id,
        order: 1
      };

      const section = new Section(sectionData);
      const savedSection = await section.save();

      expect(savedSection.title).toBe(sectionData.title);
      expect(savedSection.story).toBe(sectionData.story);
      expect(savedSection.book.toString()).toBe(testBook._id.toString());
      expect(savedSection.order).toBe(sectionData.order);
      expect(savedSection.wordCount).toBe(6); // "This is a test story content."
    });

    it('should require title field', async () => {
      const sectionData = {
        story: 'Test story',
        book: testBook._id
      };

      const section = new Section(sectionData);
      let error;

      try {
        await section.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
    });

    it('should require story field', async () => {
      const sectionData = {
        title: 'Test Section',
        book: testBook._id
      };

      const section = new Section(sectionData);
      let error;

      try {
        await section.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.story).toBeDefined();
    });

    it('should require book field', async () => {
      const sectionData = {
        title: 'Test Section',
        story: 'Test story'
      };

      const section = new Section(sectionData);
      let error;

      try {
        await section.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.book).toBeDefined();
    });

    it('should enforce title length limit', async () => {
      const longTitle = 'a'.repeat(201);
      const sectionData = {
        title: longTitle,
        story: 'Test story',
        book: testBook._id
      };

      const section = new Section(sectionData);
      let error;

      try {
        await section.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
    });

    it('should trim title and story', async () => {
      const sectionData = {
        title: '  Test Section  ',
        story: '  Test story content  ',
        book: testBook._id
      };

      const section = new Section(sectionData);
      const savedSection = await section.save();

      expect(savedSection.title).toBe('Test Section');
      expect(savedSection.story).toBe('Test story content');
    });

    it('should set default values correctly', async () => {
      const sectionData = {
        title: 'Test Section',
        story: 'Test story',
        book: testBook._id
      };

      const section = new Section(sectionData);
      const savedSection = await section.save();

      expect(savedSection.order).toBe(0);
      expect(savedSection.wordCount).toBe(2); // "Test story"
      expect(savedSection.createdAt).toBeDefined();
      expect(savedSection.updatedAt).toBeDefined();
    });
  });

  describe('Book Reference', () => {
    it('should populate book reference', async () => {
      const section = new Section({
        title: 'Test Section',
        story: 'Test story',
        book: testBook._id
      });
      await section.save();

      const populatedSection = await Section.findById(section._id).populate('book');
      
      expect(populatedSection.book).toBeDefined();
      expect(populatedSection.book.title).toBe('Test Book');
    });
  });

  describe('Word Count Calculation', () => {
    it('should calculate word count correctly', async () => {
      const section = new Section({
        title: 'Test Section',
        story: 'This is a test story with multiple words.',
        book: testBook._id
      });
      const savedSection = await section.save();

      expect(savedSection.wordCount).toBe(8); // "This is a test story with multiple words."
    });

    it('should calculate word count for empty story', async () => {
      const section = new Section({
        title: 'Test Section',
        story: '',
        book: testBook._id
      });
      const savedSection = await section.save();

      expect(savedSection.wordCount).toBe(0);
    });

    it('should calculate word count for story with multiple spaces', async () => {
      const section = new Section({
        title: 'Test Section',
        story: '  word1   word2  word3  ',
        book: testBook._id
      });
      const savedSection = await section.save();

      expect(savedSection.wordCount).toBe(3); // "word1 word2 word3"
    });

    it('should update word count when story is modified', async () => {
      const section = new Section({
        title: 'Test Section',
        story: 'Original story',
        book: testBook._id
      });
      await section.save();

      expect(section.wordCount).toBe(2); // "Original story"

      section.story = 'Updated story with more words';
      await section.save();

      expect(section.wordCount).toBe(6); // "Updated story with more words"
    });
  });

  describe('Order Management', () => {
    it('should set default order to 0', async () => {
      const section = new Section({
        title: 'Test Section',
        story: 'Test story',
        book: testBook._id
      });
      const savedSection = await section.save();

      expect(savedSection.order).toBe(0);
    });

    it('should accept custom order', async () => {
      const section = new Section({
        title: 'Test Section',
        story: 'Test story',
        book: testBook._id,
        order: 5
      });
      const savedSection = await section.save();

      expect(savedSection.order).toBe(5);
    });
  });

  describe('Timestamps', () => {
    it('should set createdAt and updatedAt on creation', async () => {
      const section = new Section({
        title: 'Test Section',
        story: 'Test story',
        book: testBook._id
      });
      const savedSection = await section.save();

      expect(savedSection.createdAt).toBeDefined();
      expect(savedSection.updatedAt).toBeDefined();
      expect(savedSection.createdAt).toEqual(savedSection.updatedAt);
    });

    it('should update updatedAt on modification', async () => {
      const section = new Section({
        title: 'Test Section',
        story: 'Test story',
        book: testBook._id
      });
      await section.save();

      const originalUpdatedAt = section.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      section.title = 'Updated Title';
      await section.save();

      expect(section.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Indexes', () => {
    it('should have compound index on book and order', async () => {
      const indexes = await Section.collection.indexes();
      const hasBookOrderIndex = indexes.some(index => 
        index.key && 
        index.key.book === 1 && 
        index.key.order === 1
      );
      
      expect(hasBookOrderIndex).toBe(true);
    });
  });

  describe('Section Operations', () => {
    it('should find sections by book', async () => {
      const section1 = new Section({
        title: 'Section 1',
        story: 'Story 1',
        book: testBook._id,
        order: 1
      });
      const section2 = new Section({
        title: 'Section 2',
        story: 'Story 2',
        book: testBook._id,
        order: 2
      });
      await section1.save();
      await section2.save();

      const sections = await Section.find({ book: testBook._id });
      expect(sections).toHaveLength(2);
      expect(sections.map(s => s.title)).toContain('Section 1');
      expect(sections.map(s => s.title)).toContain('Section 2');
    });

    it('should sort sections by order and createdAt', async () => {
      const section1 = new Section({
        title: 'Section 1',
        story: 'Story 1',
        book: testBook._id,
        order: 2
      });
      const section2 = new Section({
        title: 'Section 2',
        story: 'Story 2',
        book: testBook._id,
        order: 1
      });
      await section1.save();
      await section2.save();

      const sections = await Section.find({ book: testBook._id })
        .sort({ order: 1, createdAt: 1 });

      expect(sections[0].title).toBe('Section 2'); // order: 1
      expect(sections[1].title).toBe('Section 1'); // order: 2
    });
  });
}); 