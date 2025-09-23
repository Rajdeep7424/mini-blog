// backend/routes/gameRoutes.js
import express from 'express';
import { joinQueue, makeMove } from '../controllers/gamecontroller.js';
// import authMiddleware from '../middleware/authMiddleware.js';
import { protect as authMiddleware } from '../middleware/authMiddleware.js';
import { startMinesweeper, revealCell, flagCell } from "../controllers/gamecontroller.js";

const router = express.Router();

router.post('/join', authMiddleware, joinQueue);  // { game, socketId? }
router.post('/move', authMiddleware, makeMove);   // { matchId, index }

// Minesweeper routes
router.post("/minesweeper/start", startMinesweeper);
router.post("/minesweeper/reveal", revealCell);
router.post("/minesweeper/flag", flagCell);


export default router;
