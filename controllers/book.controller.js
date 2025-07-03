const Book = require('../models/book.model');
const Section = require('../models/section.model');
const encryptionService = require('../services/encryption.service');
const logger = require('../utils/logger');

// @desc    Get all books for authenticated user
// @route   GET /api/books
// @access  Private
const getBooks = async (req, res) => {
  try {
    const books = await Book.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (error) {
    logger.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books',
      error: error.message
    });
  }
};

// @desc    Get a single book by ID
// @route   GET /api/books/:bookId
// @access  Private
const getBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    const book = await Book.findOne({ _id: bookId, user: req.user._id });
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      data: book
    });
  } catch (error) {
    logger.error('Get book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book',
      error: error.message
    });
  }
};

// @desc    Create a new book
// @route   POST /api/books
// @access  Private
const createBook = async (req, res) => {
  try {
    const { title, description } = req.body;

    const book = new Book({
      title,
      description,
      user: req.user._id
    });

    await book.save();

    logger.info(`New book created: ${title} by user ${req.user._id}`);

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: book
    });
  } catch (error) {
    logger.error('Create book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create book',
      error: error.message
    });
  }
};

// @desc    Update a book
// @route   PUT /api/books/:bookId
// @access  Private
const updateBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, description, isPublished } = req.body;

    // Verify book belongs to user
    const book = await Book.findOne({ _id: bookId, user: req.user._id });
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Update fields
    if (title !== undefined) book.title = title;
    if (description !== undefined) book.description = description;
    if (isPublished !== undefined) book.isPublished = isPublished;

    await book.save();

    logger.info(`Book updated: ${bookId} by user ${req.user._id}`);

    res.json({
      success: true,
      message: 'Book updated successfully',
      data: book
    });
  } catch (error) {
    logger.error('Update book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update book',
      error: error.message
    });
  }
};

// @desc    Delete a book
// @route   DELETE /api/books/:bookId
// @access  Private
const deleteBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    // Verify book belongs to user
    const book = await Book.findOne({ _id: bookId, user: req.user._id });
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Delete all sections of the book first
    await Section.deleteMany({ book: bookId });
    
    // Delete the book
    await Book.findByIdAndDelete(bookId);

    logger.info(`Book deleted: ${bookId} by user ${req.user._id}`);

    res.json({
      success: true,
      message: 'Book and all its sections deleted successfully'
    });
  } catch (error) {
    logger.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
      error: error.message
    });
  }
};

// @desc    Get all sections of a book with decrypted stories
// @route   GET /api/books/:bookId/sections
// @access  Private
const getBookSections = async (req, res) => {
  try {
    const { bookId } = req.params;

    // Verify book belongs to user
    const book = await Book.findOne({ _id: bookId, user: req.user._id });
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Get sections with encrypted stories
    const sections = await Section.find({ book: bookId })
      .sort({ order: 1, createdAt: 1 });

    // Decrypt stories
    const decryptedSections = sections.map(section => {
      const sectionObj = section.toObject();
      try {
        sectionObj.story = encryptionService.decrypt(section.story);
      } catch (error) {
        logger.error(`Failed to decrypt story for section ${section._id}:`, error);
        sectionObj.story = '[Encryption Error]';
      }
      return sectionObj;
    });

    res.json({
      success: true,
      count: decryptedSections.length,
      data: {
        book,
        sections: decryptedSections
      }
    });
  } catch (error) {
    logger.error('Get book sections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book sections',
      error: error.message
    });
  }
};

// @desc    Get a single section by ID
// @route   GET /api/books/:bookId/sections/:sectionId
// @access  Private
const getSection = async (req, res) => {
  try {
    const { bookId, sectionId } = req.params;

    // Verify book belongs to user
    const book = await Book.findOne({ _id: bookId, user: req.user._id });
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Get section
    const section = await Section.findOne({ _id: sectionId, book: bookId });
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    // Decrypt story
    const sectionResponse = section.toObject();
    try {
      sectionResponse.story = encryptionService.decrypt(section.story);
    } catch (error) {
      logger.error(`Failed to decrypt story for section ${sectionId}:`, error);
      sectionResponse.story = '[Encryption Error]';
    }

    res.json({
      success: true,
      data: sectionResponse
    });
  } catch (error) {
    logger.error('Get section error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch section',
      error: error.message
    });
  }
};

// @desc    Add a new section to a book
// @route   POST /api/books/:bookId/sections
// @access  Private
const addSection = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, story } = req.body;

    // Verify book belongs to user
    const book = await Book.findOne({ _id: bookId, user: req.user._id });
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Get the next order number
    const lastSection = await Section.findOne({ book: bookId })
      .sort({ order: -1 });
    const order = lastSection ? lastSection.order + 1 : 1;

    // Encrypt the story before saving
    const encryptedStory = encryptionService.encrypt(story);

    const section = new Section({
      title,
      story: encryptedStory,
      book: bookId,
      order
    });

    await section.save();

    logger.info(`New section added to book ${bookId}: ${title}`);

    // Return the section with decrypted story for immediate use
    const sectionResponse = section.toObject();
    sectionResponse.story = story; // Return original story, not encrypted

    res.status(201).json({
      success: true,
      message: 'Section added successfully',
      data: sectionResponse
    });
  } catch (error) {
    logger.error('Add section error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add section',
      error: error.message
    });
  }
};

// @desc    Update a section
// @route   PUT /api/books/:bookId/sections/:sectionId
// @access  Private
const updateSection = async (req, res) => {
  try {
    const { bookId, sectionId } = req.params;
    const { title, story, order } = req.body;

    // Verify book belongs to user
    const book = await Book.findOne({ _id: bookId, user: req.user._id });
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Get section
    const section = await Section.findOne({ _id: sectionId, book: bookId });
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    // Update fields
    if (title !== undefined) section.title = title;
    if (story !== undefined) {
      section.story = encryptionService.encrypt(story);
    }
    if (order !== undefined) section.order = order;

    await section.save();

    logger.info(`Section updated: ${sectionId} in book ${bookId}`);

    // Return the section with decrypted story
    const sectionResponse = section.toObject();
    if (story !== undefined) {
      sectionResponse.story = story; // Return original story, not encrypted
    } else {
      try {
        sectionResponse.story = encryptionService.decrypt(section.story);
      } catch (error) {
        sectionResponse.story = '[Encryption Error]';
      }
    }

    res.json({
      success: true,
      message: 'Section updated successfully',
      data: sectionResponse
    });
  } catch (error) {
    logger.error('Update section error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update section',
      error: error.message
    });
  }
};

// @desc    Delete a section
// @route   DELETE /api/books/:bookId/sections/:sectionId
// @access  Private
const deleteSection = async (req, res) => {
  try {
    const { bookId, sectionId } = req.params;

    // Verify book belongs to user
    const book = await Book.findOne({ _id: bookId, user: req.user._id });
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Get section
    const section = await Section.findOne({ _id: sectionId, book: bookId });
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    // Delete the section
    await Section.findByIdAndDelete(sectionId);

    logger.info(`Section deleted: ${sectionId} from book ${bookId}`);

    res.json({
      success: true,
      message: 'Section deleted successfully'
    });
  } catch (error) {
    logger.error('Delete section error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete section',
      error: error.message
    });
  }
};

module.exports = {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  getBookSections,
  getSection,
  addSection,
  updateSection,
  deleteSection
}; 