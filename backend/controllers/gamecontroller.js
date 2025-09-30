// backend/controllers/gameController.js
import Matchmaking from '../models/matchmaking.js';
import Match from '../models/Match.js';
import User from '../models/User.js';
import Minesweeper from '../models/minesweeper.js';


// helper: check winning combos for tic-tac-toe
const WINNING = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function checkWinner(board, symbol) {
  return WINNING.some(combo => combo.every(i => board[i] === symbol));
}

// 1) Player requests to join matchmaking (REST endpoint or via socket)
export const joinQueue = async (req, res) => {
  try {
    const userId = req.user._id; // assume auth middleware sets this
    const { game, socketId } = req.body;
    // prevent double-join
    const alreadyWaiting = await Matchmaking.findOne({ playerId: userId });
    if (alreadyWaiting) return res.status(400).json({ message: 'Already in queue' });

    const waiting = await Matchmaking.create({ playerId: userId, game, socketId });

    // Try to find a partner (atomically removes partner if found)
    const partner = await Matchmaking.findOneAndDelete(
      { game, playerId: { $ne: userId } },
      { sort: { createdAt: 1 } }
    );

    if (partner) {
      // we found a partner -> remove our waiting doc and create match
      await Matchmaking.findByIdAndDelete(waiting._id);

      const p1 = userId;
      const p2 = partner.playerId;

      // randomly assign X or O
      const first = Math.random() < 0.5 ? p1 : p2;
      const playerSymbols = [
        { player: p1, symbol: first.toString() === p1.toString() ? 'X' : 'O' },
        { player: p2, symbol: first.toString() === p2.toString() ? 'X' : 'O' }
      ];

      const match = await Match.create({
        game,
        players: [p1, p2],
        playerSymbols,
        gameState: { board: Array(9).fill(null), turn: first }
      });

      // set both users status -> in-game, record currentMatch
      await User.updateMany(
        { _id: { $in: [p1, p2] } },
        { $set: { status: 'in-game', currentMatch: match._id } }
      );

      // return match (or you can emit via socket — see Socket section)
      return res.json({ match, matched: true });
    } else {
      // still waiting
      await User.findByIdAndUpdate(userId, { status: 'waiting' });
      return res.json({ waiting: true });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// 2) make a move
export const makeMove = async (req, res) => {
  try {
    const userId = req.user._id;
    const { matchId, index } = req.body;
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (match.result.status === 'finished') return res.status(400).json({ message: 'Match already finished' });

    // is it user's turn?
    if (match.gameState.turn.toString() !== userId.toString()) {
      return res.status(400).json({ message: 'Not your turn' });
    }

    // is index valid and empty?
    if (index < 0 || index > 8) return res.status(400).json({ message: 'Invalid index' });
    if (match.gameState.board[index] !== null) return res.status(400).json({ message: 'Cell already taken' });

    // find player's symbol
    const symbolObj = match.playerSymbols.find(ps => ps.player.toString() === userId.toString());
    if (!symbolObj) return res.status(400).json({ message: 'Player not in match' });
    const symbol = symbolObj.symbol;

    // apply move
    match.gameState.board[index] = symbol;
    match.gameState.moves.push({ player: userId, index, symbol });

    // check for win
    if (checkWinner(match.gameState.board, symbol)) {
      match.result = { winner: userId, status: 'finished', reason: 'win' };
      await match.save();

      // clear players' currentMatch and update status
      await User.updateMany(
        { _id: { $in: match.players } },
        { $set: { status: 'online', currentMatch: null } }
      );

      // respond updated match
      return res.json({ match });
    }

    // check for draw
    if (!match.gameState.board.includes(null)) {
      match.result = { winner: null, status: 'finished', reason: 'draw' };
      await match.save();

      await User.updateMany(
        { _id: { $in: match.players } },
        { $set: { status: 'online', currentMatch: null } }
      );

      return res.json({ match });
    }

    // otherwise continue game: switch turn to other player
    const other = match.players.find(p => p.toString() !== userId.toString());
    match.gameState.turn = other;
    await match.save();

    return res.json({ match });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
// controllers/gamecontroller.js

// Generate a new board
function generateBoard(rows, cols, mines) {
  const board = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      row: r,
      col: c,
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      neighborMines: 0,
    }))
  );

  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!board[r][c].isMine) {
      board[r][c].isMine = true;
      placed++;
    }
  }

  // Count neighbor mines
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (r + dr >= 0 && r + dr < rows && c + dc >= 0 && c + dc < cols) {
            if (board[r + dr][c + dc].isMine) count++;
          }
        }
      }
      board[r][c].neighborMines = count;
    }
  }

  return board;
}

// Start new game
export const startMinesweeper = async (req, res) => {
  console.log("REQ BODY:", req.body);
  try {
    const { rows = 9, cols = 9, mines = 10, user } = req.body;

    const board = generateBoard(rows, cols, mines);

    const newGame = await Minesweeper.create({
      user: user || null,
      rows,
      cols,
      mines,
      board,
      status: "ongoing",
    });

    res.status(201).json(newGame);
  } catch (err) {
    console.error("Start Minesweeper error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Reveal cell
export const revealCell = async (req, res) => {
  try {
    const { gameId, row, col } = req.body;
    const game = await Minesweeper.findById(gameId);
    if (!game) return res.status(404).json({ error: "Game not found" });

    const cell = game.board[row][col];
    if (cell.isRevealed || cell.isFlagged) return res.status(400).json({ error: "Cell already revealed or flagged" });

    cell.isRevealed = true;

    if (cell.isMine) game.status = "lost";
    else {
      // Optional: auto-reveal neighbors if neighborMines === 0
    }

    // Check win condition
    if (game.board.flat().every(c => c.isRevealed || c.isMine)) game.status = "won";

    await game.save();
    res.json(game);
  } catch (err) {
    console.error("Reveal cell error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Flag cell
export const flagCell = async (req, res) => {
  try {
    const { gameId, row, col } = req.body;
    const game = await Minesweeper.findById(gameId);
    if (!game) return res.status(404).json({ error: "Game not found" });

    const cell = game.board[row][col];
    if (cell.isRevealed) return res.status(400).json({ error: "Cannot flag revealed cell" });

    cell.isFlagged = !cell.isFlagged;

    await game.save();
    res.json(game);
  } catch (err) {
    console.error("Flag cell error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update best score
export const updateBestScore = async (req, res) => {
  try {
    const { userId, game, score } = req.body;

    if (!userId || !game || typeof score !== "number") {
      return res.status(400).json({ error: "Invalid input" });
    }

    // $max ensures we only update if new score is higher
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $max: { [`games.${game}`]: score } }, // e.g. games.minesweeper
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Score updated successfully",
      bestScores: updatedUser.games
    });
  } catch (err) {
    console.error("Error updating best score:", err);
    res.status(500).json({ error: "Server error" });
  }
};
