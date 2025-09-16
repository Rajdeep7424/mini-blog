// backend/models/Match.js
import mongoose from 'mongoose';

const MoveSchema = new mongoose.Schema({
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  index: Number, // cell index for tic-tac-toe (0..8)
  symbol: { type: String, enum: ['X', 'O'] },
  createdAt: { type: Date, default: Date.now }
});

const MatchSchema = new mongoose.Schema({
  game: { type: String, required: true, enum: ['tictactoe'] },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  // mapping which player has which symbol
  playerSymbols: [{
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    symbol: { type: String, enum: ['X', 'O'] }
  }],
  gameState: {
    board: { type: [String], default: function() { return Array(9).fill(null); } },
    turn: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // whose turn
    moves: { type: [MoveSchema], default: [] }
  },
  result: {
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['ongoing', 'finished'], default: 'ongoing' },
    reason: { type: String, default: '' } // e.g. "win", "draw", "disconnect"
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Match', MatchSchema);
