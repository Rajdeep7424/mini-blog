import mongoose from 'mongoose';

// Create Blog Schema definition
const blogSchema = mongoose.Schema(
  {
    // Title field
    title: {
      type: String,
      required: [true, 'Please add a blog title'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    // Content field
    content: {
      type: String,
      required: [true, 'Please add blog content'],
      minlength: [10, 'Content must be at least 10 characters'],
    },
    // Tags array field
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true, // Store tags in lowercase for consistency
      }
    ],
    // Author field - references the User model
    author: {
      type: mongoose.Schema.Types.ObjectId, // Stores MongoDB ObjectId
      ref: 'User', // References the User model
      required: true,
    },
    // Featured image URL (optional)
    featuredImage: {
      type: String,
      default: '', // Optional field for blog cover image
    },
    // Read time estimation (optional, could be calculated automatically)
    readTime: {
      type: Number,
      default: 0, // Estimated reading time in minutes
    },
    // Published status
    isPublished: {
      type: Boolean,
      default: false, // Draft by default, can be published later
    },
  },
  {
    // Schema options
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Index for better query performance
blogSchema.index({ author: 1, createdAt: -1 }); // Compound index for user's blogs
blogSchema.index({ tags: 1 }); // Index for tag-based queries

// Virtual for estimated read time (optional enhancement)
blogSchema.virtual('estimatedReadTime').get(function() {
  const wordsPerMinute = 200; // Average reading speed
  const wordCount = this.content.split(' ').length;
  return Math.ceil(wordCount / wordsPerMinute);
});

// Middleware to automatically set readTime before saving
blogSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.readTime = this.estimatedReadTime;
  }
  next();
});

// Method to return blog data without sensitive information
blogSchema.methods.toJSON = function() {
  const blog = this.toObject();
  delete blog.__v; // Remove version key
  return blog;
};

// Create Blog model from the schema
const Blog = mongoose.model('Blog', blogSchema);

// Export Blog model to use in other files
export default Blog;