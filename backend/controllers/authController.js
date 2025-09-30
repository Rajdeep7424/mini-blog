import User from '../models/User.js';
import crypto from "crypto";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from "nodemailer";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation: Check if all required fields are provided
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    // Check if user already exists by username or email
    const userExists = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (userExists) {
      if (userExists.email === email) {
        return res.status(400).json({ message: 'Email already exists' });
      } else {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }

    // Hash password before saving to database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in database
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // If user created successfully, return user data with token
    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user email - include password field for comparison
    const user = await User.findOne({ email }).select('+password');

    // If user not found
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare provided password with hashed password in database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get current user data
// @route   GET /api/auth/me
// @access  Private (requires token)
const getMe = async (req, res) => {
  try {
    // req.user is set by the authMiddleware after verifying token
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller: update username
const updateUsername = async (req, res) => {
  try {
    const { username } = req.body;

    // Validate username
    if (!username || username.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }

    // Use the authenticated user's ID from the token
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if username already exists (excluding current user)
    const userExists = await User.findOne({ 
      username, 
      _id: { $ne: req.user.id } 
    });
    
    if (userExists) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Update username
    user.username = username;
    await user.save();

    res.status(200).json({
      message: "Username updated successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const updateEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email" });
    }

    // Use the authenticated user's ID from the token
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if email already exists (excluding current user)
    const emailExists = await User.findOne({ 
      email, 
      _id: { $ne: req.user.id } 
    });
    
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Update email
    user.email = email;
    await user.save();

    res.status(200).json({
      message: "Email updated successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide current and new password" });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.id).select("+password"); // include password for verification

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // ✅ Prevent same password reuse
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({ message: "New password cannot be the same as old password" });
    }

    // ✅ Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// In the requestPasswordReset function, replace the email sending code:
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // For security, don't reveal if email exists or not
      return res.status(200).json({ 
        message: "If the email exists, a reset link has been generated",
        resetToken: "demo-reset-token-12345",
        resetUrl: `http://localhost:5173/reset-password/demo-reset-token-12345`
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Create reset URL with the correct frontend port (5173)
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    // Return the reset link to be displayed on screen
    res.json({ 
      message: "Password reset link generated successfully",
      resetToken: resetToken,
      resetUrl: resetUrl,
      note: "Click the link below to reset your password"
    });
  } catch (error) {
    console.error("Error in password reset:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
};

// Also update the resetPassword function to handle demo tokens
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Handle demo token
    if (token === "demo-reset-token-12345") {
      return res.status(400).json({ 
        message: "This is a demo token. Use a real account for actual password reset." 
      });
    }

    // Hash the token to compare with DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // still valid
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { 
  registerUser, 
  loginUser, 
  getMe, 
  updateUsername, 
  updateEmail, 
  updatePassword, 
  resetPassword, 
  requestPasswordReset 
};