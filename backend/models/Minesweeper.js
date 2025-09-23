import mongoose from "mongoose";

const cellSchema = new mongoose.Schema({
  row: Number,
  col: Number,
  isMine: Boolean,
  isRevealed: Boolean,
  isFlagged: Boolean,
  neighborMines: Number,
});

const minesweeperSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rows: { type: Number, default: 9 },
  cols: { type: Number, default: 9 },
  mines: { type: Number, default: 20 },
  board: [[cellSchema]], // 2D grid of cells
  status: { type: String, enum: ["ongoing", "won", "lost"], default: "ongoing" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Minesweeper", minesweeperSchema);
