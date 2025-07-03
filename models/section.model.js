const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Section title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  story: {
    type: String,
    trim: true,
    default: ''
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book reference is required']
  },
  order: {
    type: Number,
    default: 0,
    min: [0, 'Order cannot be negative']
  },
  wordCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate word count before saving
sectionSchema.pre('save', function(next) {
  if (this.isModified('story')) {
    const trimmedStory = this.story.trim();
    this.wordCount = trimmedStory === '' ? 0 : trimmedStory.split(/\s+/).filter(word => word.length > 0).length;
  }
  next();
});

// Create compound index for efficient querying
sectionSchema.index({ book: 1, order: 1 });

module.exports = mongoose.model('Section', sectionSchema); 