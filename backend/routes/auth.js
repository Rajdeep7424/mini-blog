import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getMe, 
  updateUsername, 
  updateEmail, 
  updatePassword, 
  resetPassword, 
  requestPasswordReset 
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

// Create router object
const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginUser);

// @route   GET /api/auth/me
// @desc    Get current user data
// @access  Private (requires authentication)
router.get('/me', protect, getMe);

// @route   PUT /api/auth/profile/username
// @desc    Update username
// @access  Private
router.put("/profile/username", protect, updateUsername);

// @route   PUT /api/auth/profile/email
// @desc    Update email
// @access  Private
router.put("/profile/email", protect, updateEmail);

// @route   PUT /api/auth/profile/password
// @desc    Update password
// @access  Private
router.put("/profile/password", protect, updatePassword);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post("/forgot-password", requestPasswordReset);

// @route   PUT /api/auth/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.put("/reset-password/:token", resetPassword);

// Export router to use in server.js
export default router;