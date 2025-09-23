import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import blogRoutes from "./routes/blogRoutes.js";

// Load environment variables
dotenv.config();

// Create Express application
const app = express();
// Middleware - Fix CORS configuration
app.use(cors({
  origin: 'http://localhost:5173', // Your Vite frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Middleware
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Blog API" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);

// Define PORT
const PORT = process.env.PORT || 5000;

// Connect DB and then start server
const startServer = async () => {
  try {
    await connectDB(); // wait for DB connection
    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    process.exit(1); // Exit process if DB connection fails
  }
};
// backend/server.js (or entry file)
import http from 'http';
import { initSocket } from './socket/index.js';
import gameSocket from './socket/gameSocket.js'; // next file

const server = http.createServer(app);
const io = initSocket(server);
gameSocket(io);
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));

startServer();

import gameRoutes from "./routes/gameRoutes.js";

app.use("/api/games", gameRoutes);
