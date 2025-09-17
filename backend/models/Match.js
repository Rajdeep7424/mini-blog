import mongoose from 'mongoose';

const MoveSchema = new mongoose.Schema({
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  index: Number,
  symbol: { type: String, enum: ['X', 'O'] },
  createdAt: { type: Date, default: Date.now }
});

const MatchSchema = new mongoose.Schema({
  game: { type: String, required: true, enum: ['tictactoe'] },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  playerSymbols: [{
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    symbol: { type: String, enum: ['X', 'O'] },
    username: { type: String } // ✅ Fixed
  }],
  gameState: {
    board: { type: [String], default: () => Array(9).fill(null) },
    turn: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    moves: { type: [MoveSchema], default: [] }
  },
  result: {
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['ongoing', 'finished'], default: 'ongoing' },
    reason: { type: String, default: '' }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Match', MatchSchema);
