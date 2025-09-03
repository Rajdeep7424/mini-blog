import express from 'express';
import {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog
} from '../controllers/blogController.js';
import { protect } from '../middleware/authMiddleware.js';

// Create router object
const router = express.Router();

// All routes are protected (require authentication)
router.use(protect);

// @route   GET /api/blogs
// @desc    Get all blogs for logged-in user
// @access  Private
router.get('/', getBlogs);

// @route   GET /api/blogs/:id
// @desc    Get single blog by ID
// @access  Private
router.get('/:id', getBlog);

// @route   POST /api/blogs
// @desc    Create a new blog
// @access  Private
router.post('/', createBlog);

// @route   PUT /api/blogs/:id
// @desc    Update a blog
// @access  Private
router.put('/:id', updateBlog);

// @route   DELETE /api/blogs/:id
// @desc    Delete a blog
// @access  Private
router.delete('/:id', deleteBlog);

// Export router to use in server.js
export default router;