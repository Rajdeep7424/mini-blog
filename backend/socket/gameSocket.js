// backend/sockets/gameSocket.js
import mongoose from 'mongoose';
import Match from '../models/Match.js';
import Matchmaking from '../models/matchmaking.js';
import User from '../models/User.js';

export default function(io) {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // --- Register user ---
    socket.on('register', async ({ userId }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error('Invalid userId');
        socket.userId = new mongoose.Types.ObjectId(userId);
        await User.findByIdAndUpdate(socket.userId, { socketId: socket.id, status: 'online' });
        console.log(`User ${userId} registered with socket ${socket.id}`);
      } catch (err) {
        console.error('register error:', err.message);
      }
    });

    // --- Request matchmaking ---
    socket.on('requestMatch', async ({ userId, game }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error('Invalid userId');
        const playerId = new mongoose.Types.ObjectId(userId);

        const waiting = await Matchmaking.create({ playerId, game, socketId: socket.id });

        const partner = await Matchmaking.findOneAndDelete({
          game,
          playerId: { $ne: playerId }
        }, { sort: { createdAt: 1 } });

        if (partner) {
          await Matchmaking.findByIdAndDelete(waiting._id);

          const p1 = playerId;
          const p2 = partner.playerId;
          const first = Math.random() < 0.5 ? p1 : p2;

          const playerSymbols = [
            { player: p1, symbol: first.equals(p1) ? 'X' : 'O' },
            { player: p2, symbol: first.equals(p2) ? 'X' : 'O' }
          ];

          const match = await Match.create({
            game,
            players: [p1, p2],
            playerSymbols,
            gameState: { board: Array(9).fill(null), turn: first },
            result: { status: 'ongoing', winner: null }
          });

          await User.updateMany(
            { _id: { $in: [p1, p2] } },
            { $set: { status: 'in-game', currentMatch: match._id } }
          );

          const socketsToNotify = [];
          if (partner.socketId) socketsToNotify.push(partner.socketId);
          if (waiting.socketId) socketsToNotify.push(waiting.socketId);

          socketsToNotify.forEach(sid => io.to(sid).emit('matchFound', { match }));
          io.to(match._id.toString()).emit('matchFound', { match });

        } else {
          io.to(socket.id).emit('waiting', { waiting: true });
        }
      } catch (err) {
        console.error('requestMatch error:', err.message);
      }
    });

    // --- Join match room ---
    socket.on('joinMatchRoom', ({ matchId, userId }) => {
      if (!mongoose.Types.ObjectId.isValid(matchId) || !mongoose.Types.ObjectId.isValid(userId)) return;
      socket.join(matchId);
      socket.to(matchId).emit('playerJoined', { userId });
    });

    // --- Handle player moves ---
    socket.on('makeMove', async ({ matchId, userId, index }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(matchId) || !mongoose.Types.ObjectId.isValid(userId)) return;
        const match = await Match.findById(matchId);
        if (!match || match.result.status === 'finished') return;

        const playerObjId = new mongoose.Types.ObjectId(userId);
        if (!match.gameState.turn.equals(playerObjId)) return;

        const symbolObj = match.playerSymbols.find(ps => ps.player.equals(playerObjId));
        if (!symbolObj) return;
        const symbol = symbolObj.symbol;

        if (match.gameState.board[index] !== null) return;

        match.gameState.board[index] = symbol;
        match.gameState.moves.push({ player: playerObjId, index, symbol });

        const WINNING = [
          [0,1,2],[3,4,5],[6,7,8],
          [0,3,6],[1,4,7],[2,5,8],
          [0,4,8],[2,4,6]
        ];
        const checkWinner = (board, sym) => WINNING.some(c => c.every(i => board[i] === sym));

        if (checkWinner(match.gameState.board, symbol)) {
          match.result = { winner: playerObjId, status: 'finished', reason: 'win' };
          await match.save();
          await User.updateMany({ _id: { $in: match.players }}, { $set: { status: 'online', currentMatch: null }});
          io.to(matchId).emit('gameFinished', { match });
          return;
        }

        if (!match.gameState.board.includes(null)) {
          match.result = { winner: null, status: 'finished', reason: 'draw' };
          await match.save();
          await User.updateMany({ _id: { $in: match.players }}, { $set: { status: 'online', currentMatch: null }});
          io.to(matchId).emit('gameFinished', { match });
          return;
        }

        const other = match.players.find(p => !p.equals(playerObjId));
        match.gameState.turn = other;
        await match.save();

        io.to(matchId).emit('moveMade', {
          board: match.gameState.board,
          turn: match.gameState.turn,
          moves: match.gameState.moves
        });

      } catch (err) {
        console.error('makeMove error:', err.message);
      }
    });

    // --- Offer draw ---
    socket.on('offerDraw', ({ matchId, from }) => {
      socket.to(matchId).emit('drawOffered', { from });
    });

    // --- Cancel draw ---
    socket.on('cancelDraw', ({ matchId }) => {
      socket.to(matchId).emit('drawCanceled');
    });

    // --- Accept draw ---
    socket.on('acceptDraw', async ({ matchId }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(matchId)) return;
        const match = await Match.findById(matchId);
        if (!match || match.result.status === 'finished') return;

        match.result = { winner: null, status: 'finished', reason: 'draw' };
        await match.save();

        await User.updateMany(
          { _id: { $in: match.players } },
          { $set: { status: 'online', currentMatch: null } }
        );

        io.to(matchId).emit('gameFinished', { match });
      } catch (err) {
        console.error('acceptDraw error:', err.message);
      }
    });

    // --- Refuse draw ---
    socket.on('refuseDraw', ({ matchId }) => {
      socket.to(matchId).emit('drawRefused');
    });

    // --- Disconnect ---
    socket.on('disconnect', async () => {
      console.log('Socket disconnected:', socket.id);
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, { status: 'offline' });
      }
    });
  });
}
