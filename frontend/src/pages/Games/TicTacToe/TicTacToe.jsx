import { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./TicTacToe.module.css";

/* ---------- Pure helpers (outside component) ---------- */
const WINNING_CONDITIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWin(board) {
  for (const [a, b, c] of WINNING_CONDITIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [a, b, c];
    }
  }
  return null;
}

function checkDraw(board) {
  return board.every((cell) => cell !== "") && !checkWin(board);
}

/** Computer move: win -> block -> center -> corner -> any */
function getComputerMove(board) {
  const available = board.reduce((acc, val, idx) => (val === "" ? acc.concat(idx) : acc), []);
  if (available.length === 0) return -1;

  // 1) Win
  for (const [a, b, c] of WINNING_CONDITIONS) {
    const line = [board[a], board[b], board[c]];
    if (line.filter((x) => x === "O").length === 2 && line.includes("")) {
      return [a, b, c][line.indexOf("")];
    }
  }

  // 2) Block
  for (const [a, b, c] of WINNING_CONDITIONS) {
    const line = [board[a], board[b], board[c]];
    if (line.filter((x) => x === "X").length === 2 && line.includes("")) {
      return [a, b, c][line.indexOf("")];
    }
  }

  // 3) Center
  if (board[4] === "") return 4;

  // 4) Corners
  const corners = [0, 2, 6, 8].filter((i) => board[i] === "");
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

  // 5) Any available
  return available[Math.floor(Math.random() * available.length)];
}

/* ---------- Component ---------- */
export default function TicTacToe() {
  const [gameBoard, setGameBoard] = useState(() => Array(9).fill(""));
  const [currentPlayer, setCurrentPlayer] = useState("X"); // 'X' always starts
  const [gameActive, setGameActive] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0, T: 0 });
  const [winningCombo, setWinningCombo] = useState([]);
  const [gameMode, setGameMode] = useState("2player"); // '2player' | 'vsComputer'
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [lastMove, setLastMove] = useState(null);

  /* ---------- Derived status message (no separate state) ---------- */
  const statusMessage = useMemo(() => {
    if (!gameActive && winningCombo.length) {
      const winner = gameBoard[winningCombo[0]];
      if (gameMode === "vsComputer" && winner === "O") return "Computer wins!";
      if (winner === "X") return "Player X wins!";
      return "Player O wins!";
    }
    if (!gameActive) return "Game ended in a draw!";
    if (gameMode === "2player") return `Player ${currentPlayer}'s turn`;
    // vsComputer
    if (currentPlayer === "X") return "Your turn";
    return "Computer thinking...";
  }, [gameActive, winningCombo, gameBoard, currentPlayer, gameMode]);

  /* ---------- Human click handler ---------- */
  const handleCellClick = useCallback((index) => {
    if (gameBoard[index] !== "" || !gameActive || isComputerThinking) return;
    if (gameMode === "vsComputer" && currentPlayer !== "X") return;

    // Apply the move
    setGameBoard((prev) => {
      const next = [...prev];
      next[index] = currentPlayer;
      return next;
    });
    
    // Track last move for animation
    setLastMove(index);

    // Switch turn immediately after making a valid move
    setCurrentPlayer((p) => (p === "X" ? "O" : "X"));
  }, [gameBoard, gameActive, isComputerThinking, gameMode, currentPlayer]);

  /* ---------- Computer move effect ---------- */
  useEffect(() => {
    // Only run if it's computer's turn in vsComputer mode and game is active
    if (gameMode !== "vsComputer" || currentPlayer !== "O" || !gameActive) return;

    setIsComputerThinking(true);
    
    const timer = setTimeout(() => {
      setGameBoard((prev) => {
        const move = getComputerMove(prev);
        if (move < 0) return prev;
        
        const next = [...prev];
        next[move] = "O";
        
        // Track computer's move for animation
        setLastMove(move);
        return next;
      });

      // After the computer places, give turn back to player
      setCurrentPlayer("X");
      setIsComputerThinking(false);
    }, 350);

    return () => {
      clearTimeout(timer);
      setIsComputerThinking(false);
    };
  }, [gameMode, currentPlayer, gameActive]); // Removed isComputerThinking from dependencies

  /* ---------- Watch board for result (win/draw) ---------- */
  useEffect(() => {
    const win = checkWin(gameBoard);
    if (win) {
      setGameActive(false);
      setWinningCombo(win);

      // Determine the winner symbol directly from the board to avoid race with currentPlayer
      const winnerSymbol = gameBoard[win[0]];
      setScores((prev) => ({ ...prev, [winnerSymbol]: prev[winnerSymbol] + 1 }));
      return;
    }

    if (checkDraw(gameBoard)) {
      setGameActive(false);
      setWinningCombo([]);
      setScores((prev) => ({ ...prev, T: prev.T + 1 }));
    }
  }, [gameBoard]);

  /* ---------- Controls ---------- */
  const restartGame = useCallback(() => {
    setGameBoard(Array(9).fill(""));
    setGameActive(true);
    setWinningCombo([]);
    setCurrentPlayer("X");
    setIsComputerThinking(false);
    setLastMove(null);
  }, []);

  const resetScores = useCallback(() => {
    setScores({ X: 0, O: 0, T: 0 });
    restartGame();
  }, [restartGame]);

  const changeGameMode = useCallback((mode) => {
    setGameMode(mode);
    restartGame();
  }, [restartGame]);

  const getCellClassName = useCallback((index) => {
    const value = gameBoard[index];
    const classes = [styles.cell];
    if (value === "X") classes.push(styles.cellX);
    if (value === "O") classes.push(styles.cellO);
    if (winningCombo.includes(index)) classes.push(styles.cellWin);
    if (isComputerThinking) classes.push(styles.disabled);
    if (lastMove === index) classes.push(styles.lastMove);
    return classes.filter(Boolean).join(" ");
  }, [gameBoard, winningCombo, isComputerThinking, lastMove]);

  return (
    <div className={styles.ticTacToe}>
      <h1 className={styles.title}>Tic Tac Toe</h1>
      
      {/* Mode */}
      <div className={styles.gameModeSelector}>
        <button
          type="button"
          className={gameMode === "2player" ? styles.modeActive : styles.modeButton}
          onClick={() => changeGameMode("2player")}
        >
          2 Players
        </button>
        <button
          type="button"
          className={gameMode === "vsComputer" ? styles.modeActive : styles.modeButton}
          onClick={() => changeGameMode("vsComputer")}
        >
          VS Computer
        </button>
      </div>

      {/* Status */}
      <div className={`${styles.status} ${!gameActive ? styles.statusResult : ""}`}>
        {statusMessage}
        {isComputerThinking && <span className={styles.thinking}>...</span>}
      </div>

      {/* Board */}
      <div className={styles.gameBoard} role="grid" aria-label="Tic Tac Toe board">
        {gameBoard.map((cell, i) => (
          <button
            key={i}
            type="button"
            role="gridcell"
            aria-label={`Cell ${i + 1} ${cell ? `occupied by ${cell}` : 'empty'}`}
            aria-disabled={!gameActive || cell !== "" || isComputerThinking || (gameMode === "vsComputer" && currentPlayer !== "X")}
            className={getCellClassName(i)}
            onClick={() => handleCellClick(i)}
            disabled={!gameActive || cell !== "" || isComputerThinking || (gameMode === "vsComputer" && currentPlayer !== "X")}
          >
            {cell && <span className={styles.cellContent}>{cell}</span>}
          </button>
        ))}
      </div>

      {/* Scores */}
      <div className={styles.scoreBoard}>
        <div className={`${styles.score} ${currentPlayer === 'X' && gameActive ? styles.activePlayer : ''}`}>
          <span className={styles.scoreLabel}>{gameMode === "vsComputer" ? "You" : "Player X"}</span>
          <span className={styles.scoreValue}>{scores.X}</span>
        </div>
        <div className={styles.score}>
          <span className={styles.scoreLabel}>Ties</span>
          <span className={styles.scoreValue}>{scores.T}</span>
        </div>
        <div className={`${styles.score} ${currentPlayer === 'O' && gameActive ? styles.activePlayer : ''}`}>
          <span className={styles.scoreLabel}>{gameMode === "vsComputer" ? "Computer" : "Player O"}</span>
          <span className={styles.scoreValue}>{scores.O}</span>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <button className={styles.button} type="button" onClick={restartGame}>
          {gameActive ? 'Restart' : 'Play Again'}
        </button>
        <button className={styles.buttonReset} type="button" onClick={resetScores}>
          Reset Scores
        </button>
      </div>
    </div>
  );
}