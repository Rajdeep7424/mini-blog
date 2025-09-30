// backend/models/Matchmaking.js
import mongoose from 'mongoose';

const MatchmakingSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  game: { type: String, required: true, enum: ['tictactoe'] }, // add more games later
  socketId: { type: String }, // optional: store socket id for direct emit
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Matchmaking', MatchmakingSchema);
