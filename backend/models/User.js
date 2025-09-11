import mongoose from 'mongoose';

// Create User Schema definition
const userSchema = mongoose.Schema(
  {
    // Username field
    username: {
      type: String,
      required: [true, 'Please add a username'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    // Email field
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    // Password field
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // requires `.select('+password')` when fetching
    },

    // 🔑 Reset password fields
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Create User model from the schema
const User = mongoose.model('User', userSchema);

// Export User model
export default User;