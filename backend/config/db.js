import mongoose from 'mongoose';

// Function to connect to MongoDB
const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB using connection string from environment variables
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    // Log successful connection with host information
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Log any connection errors and exit the process
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit with failure code
  }
};

// Export the connectDB function to use in other files
export default connectDB;