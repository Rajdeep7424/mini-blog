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
import rateLimit from 'express-rate-limit';

// Rate limiting for password reset
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 reset requests per windowMs
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

// Existing routes...
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put("/profile/username", protect, updateUsername);
router.put("/profile/email", protect, updateEmail);
router.put("/profile/password", protect, updatePassword);

// Updated password reset routes with rate limiting
router.post("/forgot-password", resetPasswordLimiter, requestPasswordReset);
router.put("/reset-password/:token", resetPassword);

export default router;