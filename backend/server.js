import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import blogRoutes from "./routes/blogRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";

import http from 'http';
import { initSocket } from './socket/index.js';
import gameSocket from './socket/gameSocket.js';

dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/games", gameRoutes); // ✅ Mount BEFORE server starts

// Health check
app.get("/", (req,res)=>res.json({message:"Welcome"}));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB Connected");

    const server = http.createServer(app);

    const io = initSocket(server);
    gameSocket(io);

    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch(err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
};

startServer();
