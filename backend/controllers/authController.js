import User from '../models/User.js';
import crypto from "crypto";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Email Transporter Configuration - FIXED: createTransport (not createTransporter)
const createTransporter = () => {
  // For development - use a test transporter that doesn't require real credentials
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    console.log('📧 Using development email transporter (no real emails sent)');
    return {
      sendMail: async (mailOptions) => {
        console.log('📧 Development Email would be sent:');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        const urlMatch = mailOptions.html.match(/http:\/\/[^"]+/);
        console.log('Reset URL:', urlMatch ? urlMatch[0] : 'URL not found');
        return { messageId: 'dev-mode-message-id' };
      }
    };
  }

  // For production with real email - FIXED: createTransport
  return nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Email sending function
const sendResetEmail = async (email, resetUrl, username = 'User') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER ? `"Blog Post" <${process.env.EMAIL_USER}>` : '"Blog Post" <noreply@blogpost.com>',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">Password Reset</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">Hello ${username},</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              You requested to reset your password. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link in your browser:<br>
              <code style="background: #eee; padding: 10px; border-radius: 4px; word-break: break-all; display: inline-block; margin-top: 10px;">
                ${resetUrl}
              </code>
            </p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <p style="color: #856404; margin: 0;">
                <strong>⚠️ Important:</strong> This link will expire in 15 minutes for security reasons.
              </p>
            </div>
            
            <p style="color: #999; font-size: 14px; margin-top: 20px;">
              If you didn't request this password reset, please ignore this email. Your account remains secure.
            </p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Your App Name. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">This is an automated message, please do not reply.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send reset email');
  }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: "Email is required" 
      });
    }

    // Basic email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }

    const user = await User.findOne({ email });

    let resetToken;
    let resetUrl;

    // For security, always return the same message but only send email if user exists
    if (user) {
      // Generate cryptographically secure reset token
      resetToken = crypto.randomBytes(32).toString("hex");
      
      // Hash the token before storing in database
      user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
      
      await user.save();

      // Create reset URL
      resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

      // Send reset email - but don't fail the request if email fails
      try {
        await sendResetEmail(email, resetUrl, user.username);
        console.log(`✅ Reset token generated for ${email}: ${resetToken}`);
      } catch (emailError) {
        console.log('⚠️ Email failed but continuing with reset token generation');
        // Don't clear the token - let the user use the URL directly
      }
    } else {
      console.log(`❌ Password reset requested for non-existent email: ${email}`);
    }

    // Prepare response
    const response = {
      success: true,
      message: "If an account with that email exists, a password reset link has been sent to your email address. Please check your inbox and spam folder.",
    };

    // In development, return the reset token for testing
    if (process.env.NODE_ENV === 'development' && user && resetToken) {
      response.debugToken = resetToken;
      response.debugUrl = resetUrl;
    }

    res.json(response);

  } catch (error) {
    console.error("❌ Password reset error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error during password reset process" 
    });
  }
};

// @desc    Reset password with token
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "Password must be at least 6 characters long" 
      });
    }

    // Handle demo token (for testing without email)
    if (token === "demo-reset-token-12345") {
      return res.status(400).json({ 
        success: false,
        message: "This is a demo token. Please use the actual reset link sent to your email." 
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid, unexpired token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // Check if token hasn't expired
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid or expired reset token. Please request a new password reset." 
      });
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as your current password"
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    console.log(`✅ Password reset successful for user: ${user.email}`);

    res.json({
      success: true,
      message: "Password reset successfully! You can now log in with your new password."
    });

  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error during password reset" 
    });
  }
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

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Prevent same password reuse
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({ message: "New password cannot be the same as old password" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
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