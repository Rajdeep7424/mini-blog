import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to protect routes by verifying JWT token
const protect = async (req, res, next) => {
  let token;

  // Check if authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from header (format: "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using our secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by ID from decoded token, exclude password field
      req.user = await User.findById(decoded.id).select('-password');

      // Continue to the next middleware/route handler
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If no token found in header
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export { protect };