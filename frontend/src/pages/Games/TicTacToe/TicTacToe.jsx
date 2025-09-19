import { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./TicTacToe.module.css";
import { NavLink } from "react-router-dom";

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

  const [scores, setScores] = useState({
    twoPlayer: { playerX: 0, playerO: 0, ties: 0 },
    vsComputer: { playerX: 0, computer: 0, ties: 0 },
  });

  const [winningCombo, setWinningCombo] = useState([]);
  const [gameMode, setGameMode] = useState("2player"); // '2player' | 'vsComputer'
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [lastMove, setLastMove] = useState(null);

  /* ---------- Derived status message (no separate state) ---------- */
  const statusMessage = useMemo(() => {
    if (!gameActive && winningCombo.length) {
      const winner = gameBoard[winningCombo[0]];
      if (gameMode === "vsComputer") {
        return winner === "O" ? "Computer wins!" : "You win!";
      }
      return winner === "X" ? "Player X wins!" : "Player O wins!";
    }
    if (!gameActive) return "Game ended in a draw!";
    if (gameMode === "2player") return `Player ${currentPlayer}'s turn`;
    // vsComputer
    if (currentPlayer === "X") return "Your turn";
    return "Computer thinking...";
  }, [gameActive, winningCombo, gameBoard, currentPlayer, gameMode]);

  /* ---------- Update scores when game ends ---------- */
  useEffect(() => {
    const win = checkWin(gameBoard);
    if (win) {
      setGameActive(false);
      setWinningCombo(win);

      const winnerSymbol = gameBoard[win[0]];

      setScores((prev) => {
        if (gameMode === "vsComputer") {
          return {
            ...prev,
            vsComputer: winnerSymbol === "X"
              ? { ...prev.vsComputer, playerX: prev.vsComputer.playerX + 1 }
              : { ...prev.vsComputer, computer: prev.vsComputer.computer + 1 },
          };
        } else {
          return {
            ...prev,
            twoPlayer: winnerSymbol === "X"
              ? { ...prev.twoPlayer, playerX: prev.twoPlayer.playerX + 1 }
              : { ...prev.twoPlayer, playerO: prev.twoPlayer.playerO + 1 },
          };
        }
      });
      return;
    }

    if (checkDraw(gameBoard)) {
      setGameActive(false);
      setWinningCombo([]);

      setScores((prev) => {
        if (gameMode === "vsComputer") {
          return {
            ...prev,
            vsComputer: { ...prev.vsComputer, ties: prev.vsComputer.ties + 1 },
          };
        } else {
          return {
            ...prev,
            twoPlayer: { ...prev.twoPlayer, ties: prev.twoPlayer.ties + 1 },
          };
        }
      });
    }
  }, [gameBoard, gameMode]);

  /* ---------- Human click handler ---------- */
  const handleCellClick = useCallback((index) => {
    if (gameBoard[index] !== "" || !gameActive || isComputerThinking) return;
    if (gameMode === "vsComputer" && currentPlayer !== "X") return;

    setGameBoard((prev) => {
      const next = [...prev];
      next[index] = currentPlayer;
      return next;
    });

    setLastMove(index);
    setCurrentPlayer((p) => (p === "X" ? "O" : "X"));
  }, [gameBoard, gameActive, isComputerThinking, gameMode, currentPlayer]);

  /* ---------- Computer move effect ---------- */
  useEffect(() => {
    if (gameMode !== "vsComputer" || currentPlayer !== "O" || !gameActive) return;

    setIsComputerThinking(true);

    const timer = setTimeout(() => {
      setGameBoard((prev) => {
        const move = getComputerMove(prev);
        if (move < 0) return prev;

        const next = [...prev];
        next[move] = "O";
        setLastMove(move);
        return next;
      });

      setCurrentPlayer("X");
      setIsComputerThinking(false);
    }, 350);

    return () => {
      clearTimeout(timer);
      setIsComputerThinking(false);
    };
  }, [gameMode, currentPlayer, gameActive]);

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
  setScores((prev) => {
    if (gameMode === "2player") {
      return {
        ...prev,
        twoPlayer: { playerX: 0, playerO: 0, ties: 0 },
      };
    }
    if (gameMode === "vsComputer") {
      return {
        ...prev,
        vsComputer: { playerX: 0, computer: 0, ties: 0 },
      };
    }
    return prev;
  });
  restartGame();
}, [restartGame, gameMode]);


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
    className={`${styles.modeButton} ${gameMode === "2player" ? styles.modeActive : ""}`}
    onClick={() => changeGameMode("2player")}
  >
    2 Players
  </button>
  <button
    type="button"
    className={`${styles.modeButton} ${gameMode === "vsComputer" ? styles.modeActive : ""}`}
    onClick={() => changeGameMode("vsComputer")}
  >
    VS Computer
  </button>
  <NavLink
    to="/tictactoe-multiplayer"
    className={`${styles.modeButton} ${gameMode === "multiplayer" ? styles.modeActive : ""}`}
    onClick={() => setGameMode("multiplayer")}
  >
    Multiplayer
  </NavLink>
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
        {gameMode === "2player" ? (
          <>
            <div className={`${styles.score} ${currentPlayer === 'X' && gameActive ? styles.activePlayer : ''}`}>
              <span className={styles.scoreLabel}>Player X</span>
              <span className={styles.scoreValue}>{scores.twoPlayer.playerX}</span>
            </div>
            <div className={styles.score}>
              <span className={styles.scoreLabel}>Ties</span>
              <span className={styles.scoreValue}>{scores.twoPlayer.ties}</span>
            </div>
            <div className={`${styles.score} ${currentPlayer === 'O' && gameActive ? styles.activePlayer : ''}`}>
              <span className={styles.scoreLabel}>Player O</span>
              <span className={styles.scoreValue}>{scores.twoPlayer.playerO}</span>
            </div>
          </>
        ) : (
          <>
            <div className={`${styles.score} ${currentPlayer === 'X' && gameActive ? styles.activePlayer : ''}`}>
              <span className={styles.scoreLabel}>You</span>
              <span className={styles.scoreValue}>{scores.vsComputer.playerX}</span>
            </div>
            <div className={styles.score}>
              <span className={styles.scoreLabel}>Ties</span>
              <span className={styles.scoreValue}>{scores.vsComputer.ties}</span>
            </div>
            <div className={`${styles.score} ${currentPlayer === 'O' && gameActive ? styles.activePlayer : ''}`}>
              <span className={styles.scoreLabel}>Computer</span>
              <span className={styles.scoreValue}>{scores.vsComputer.computer}</span>
            </div>
          </>
        )}
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
