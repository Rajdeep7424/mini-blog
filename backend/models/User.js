import mongoose from 'mongoose';

// Create User Schema definition
const userSchema = mongoose.Schema(
  {
    // Username field
    username: {
      type: String,
      required: [true, 'Please add a username'], // Required with custom error message
      unique: true, // Ensures no duplicate usernames
      trim: true, // Removes whitespace from both ends
      minlength: [3, 'Username must be at least 3 characters'], // Minimum length validation
      maxlength: [30, 'Username cannot exceed 30 characters'], // Maximum length validation
    },
    // Email field
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true, // Ensures no duplicate emails
      trim: true,
      lowercase: true, // Converts email to lowercase before saving
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, // Regex pattern for email validation
        'Please add a valid email',
      ],
    },
    // Password field

password: {
  type: String,
  required: [true, 'Please add a password'],
  minlength: [6, 'Password must be at least 6 characters'],
  select: false, // This is what requires .select('+password')
},
  },
  {
    // Schema options
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Create User model from the schema
const User = mongoose.model('User', userSchema);

// Export User model to use in other files
export default User;