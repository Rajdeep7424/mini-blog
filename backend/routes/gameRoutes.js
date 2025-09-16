// backend/routes/gameRoutes.js
import express from 'express';
import { joinQueue, makeMove } from '../controllers/gamecontroller.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/join', authMiddleware, joinQueue);  // { game, socketId? }
router.post('/move', authMiddleware, makeMove);   // { matchId, index }

export default router;
