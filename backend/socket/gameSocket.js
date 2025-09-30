import mongoose from 'mongoose';
import Match from '../models/Match.js';
import Matchmaking from '../models/matchmaking.js';
import User from '../models/User.js';

export default function(io) {
  const moveTimers = new Map();
  const timerIntervals = new Map(); // interval for countdown

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

        const currentUser = await User.findById(userId);
        if (!currentUser) throw new Error('User not found');

        const waiting = await Matchmaking.create({ playerId: currentUser._id, game, socketId: socket.id });

        const partner = await Matchmaking.findOneAndDelete(
          { game, playerId: { $ne: currentUser._id } },
          { sort: { createdAt: 1 } }
        );

        if (partner) {
          await Matchmaking.findByIdAndDelete(waiting._id);

          const user1 = currentUser;
          const user2 = await User.findById(partner.playerId);
          if (!user2) throw new Error('Partner not found');

          const first = Math.random() < 0.5 ? user1._id : user2._id;

          const playerSymbols = [
            { player: user1._id, symbol: first.equals(user1._id) ? "X" : "O", username: user1.username },
            { player: user2._id, symbol: first.equals(user2._id) ? "X" : "O", username: user2.username }
          ];

          const match = await Match.create({
            game,
            players: [user1._id, user2._id],
            playerSymbols,
            gameState: { board: Array(9).fill(null), turn: first },
            result: { status: "ongoing", winner: null }
          });

          await User.updateMany(
            { _id: { $in: [user1._id, user2._id] } },
            { $set: { status: "in-game", currentMatch: match._id } }
          );

          [partner.socketId, waiting.socketId].forEach((sid) => {
            if (sid) io.to(sid).emit("matchFound", { match });
          });
        } else {
          io.to(socket.id).emit("waiting", { waiting: true });
        }
      } catch (err) {
        console.error("requestMatch error:", err.message);
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

          if (moveTimers.has(matchId)) clearTimeout(moveTimers.get(matchId));
          if (timerIntervals.has(matchId)) clearInterval(timerIntervals.get(matchId));
          moveTimers.delete(matchId);
          timerIntervals.delete(matchId);
          return;
        }

        if (!match.gameState.board.includes(null)) {
          match.result = { winner: null, status: 'finished', reason: 'draw' };
          await match.save();
          await User.updateMany({ _id: { $in: match.players }}, { $set: { status: 'online', currentMatch: null }});

          io.to(matchId).emit('gameFinished', { match });

          if (moveTimers.has(matchId)) clearTimeout(moveTimers.get(matchId));
          if (timerIntervals.has(matchId)) clearInterval(timerIntervals.get(matchId));
          moveTimers.delete(matchId);
          timerIntervals.delete(matchId);
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

        // Clear old timers
        if (moveTimers.has(matchId)) clearTimeout(moveTimers.get(matchId));
        if (timerIntervals.has(matchId)) clearInterval(timerIntervals.get(matchId));

        // Timer for next turn
        let timeLeft = 30;

        const interval = setInterval(() => {
          timeLeft--;
          io.to(matchId).emit('timerUpdate', { timeLeft, currentPlayer: other.toString() });
          if (timeLeft <= 0) clearInterval(interval);
        }, 1000);
        timerIntervals.set(matchId, interval);

        const timeout = setTimeout(async () => {
          try {
            const expiredMatch = await Match.findById(matchId);
            if (!expiredMatch || expiredMatch.result.status !== 'ongoing') return;

            expiredMatch.result = { winner: playerObjId, status: 'finished', reason: 'timeout' };
            await expiredMatch.save();

            await User.updateMany(
              { _id: { $in: expiredMatch.players } },
              { $set: { status: 'online', currentMatch: null } }
            );

            io.to(matchId).emit('gameFinished', { match: expiredMatch });

            moveTimers.delete(matchId);
            clearInterval(timerIntervals.get(matchId));
            timerIntervals.delete(matchId);
          } catch (err) {
            console.error("timeout auto-win error:", err.message);
          }
        }, 30000);

        moveTimers.set(matchId, timeout);

      } catch (err) {
        console.error('makeMove error:', err.message);
      }
    });

    // --- Offer, cancel, accept, refuse draw ---
    socket.on('offerDraw', async ({ matchId, from }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(matchId)) return;
        const match = await Match.findById(matchId);
        if (!match || match.result.status !== 'ongoing') {
          io.to(socket.id).emit("errorMessage", { message: "⚠️ Cannot offer draw: match not active" });
          return;
        }
        if (!match.players.some(p => p.equals(socket.userId))) {
          io.to(socket.id).emit("errorMessage", { message: "⚠️ You are not part of this match" });
          return;
        }
        socket.to(matchId).emit("drawOffered", { from });
      } catch (err) { console.error("offerDraw error:", err.message); }
    });

    socket.on('cancelDraw', ({ matchId }) => {
      socket.to(matchId).emit('drawCanceled');
    });

    socket.on('acceptDraw', async ({ matchId }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(matchId)) return;
        const match = await Match.findById(matchId);
        if (!match || match.result.status === 'finished') return;

        match.result = { winner: null, status: 'finished', reason: 'draw' };
        await match.save();

        await User.updateMany({ _id: { $in: match.players } }, { $set: { status: 'online', currentMatch: null } });
        io.to(matchId).emit('gameFinished', { match });
      } catch (err) { console.error('acceptDraw error:', err.message); }
    });

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
