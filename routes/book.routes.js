const express = require('express');
const { bookValidation, sectionValidation } = require('../utils/validator');
const { 
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
} = require('../controllers/book.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// All book routes require authentication
router.use(authenticateToken);

// Book routes
router.get('/', getBooks);
router.get('/:bookId', getBook);
router.post('/', bookValidation, createBook);
router.put('/:bookId', bookValidation, updateBook);
router.delete('/:bookId', deleteBook);

// Section routes
router.get('/:bookId/sections', getBookSections);
router.get('/:bookId/sections/:sectionId', getSection);
router.post('/:bookId/sections', sectionValidation, addSection);
router.put('/:bookId/sections/:sectionId', sectionValidation, updateSection);
router.delete('/:bookId/sections/:sectionId', deleteSection);

module.exports = router; 