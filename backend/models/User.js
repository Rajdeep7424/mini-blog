// backend/models/User.js
import mongoose from 'mongoose';

// Create User Schema definition
const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please add a username'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
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
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },

    // Reset password fields
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // NEW: multiplayer status & pointer to current match (if any)
    status: {
      type: String,
      enum: ['offline', 'online', 'waiting', 'in-game'],
      default: 'offline',
    },
    currentMatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
    },
    games: {
      carrace:{type: Number,required: true,default:0},
      minesweeper:{type: Number,required: true,default:0},
      aviator:{type: Number, required: true, default:0},
    }
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);
export default User;
