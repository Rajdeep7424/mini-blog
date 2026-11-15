import User from '../models/User.js';
import express from 'express';
import { joinQueue, makeMove } from '../controllers/gamecontroller.js';
// import authMiddleware from '../middleware/authMiddleware.js';
import { protect as authMiddleware } from '../middleware/authMiddleware.js';
import { startMinesweeper, revealCell, flagCell } from "../controllers/gamecontroller.js";


const router = express.Router();

router.post('/join', authMiddleware, joinQueue);  // { game, socketId? }
router.post('/move', authMiddleware, makeMove);   // { matchId, index }

// Minesweeper routes
router.post("/minesweeper/start",authMiddleware, startMinesweeper);
router.post("/minesweeper/reveal",authMiddleware, revealCell);
router.post("/minesweeper/flag",authMiddleware, flagCell);


// GET /api/games/best/:userId/:game

const GAMES = ['tictactoe','aviator','minesweeper','carrace','wheels'];
router.get("/best/:game",authMiddleware, async (req, res) => {
  
    const { game } = req.params;
    if(!GAMES.includes(game)) return res.status(400).json({error:'Unknown Game'});
    try{
      const user =await User.findById(req.user.id).select(`games.${game}`);
      if(!user) return res.status(404).json({error:'User not found'});
      res.json({bestScore:user.games?.[game] ?? 0});
    } catch (err) {
    console.error("Error fetching best score:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/leaderboard/:game", async (req, res) => {
  const { game } = req.params;
  try {
    const users = await User.find({ [`games.${game}`]: { $exists: true } })
      .sort({ [`games.${game}`]: -1 })
      .limit(5)
      .select("username games");

    const leaderboard = users.map(u => ({
      username: u.username,
      score: u.games[game]
    }));

    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
