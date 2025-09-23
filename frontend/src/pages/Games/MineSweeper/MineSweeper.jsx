import { useState } from "react";
import styles from "./Minesweeper.module.css";
import { useAuth } from "../../../context/AuthContext";

const BACKEND_BASE = "http://localhost:5000/api/games/minesweeper";

export default function Minesweeper() {
  const { user } = useAuth();
  const [board, setBoard] = useState([]);
  const [gameId, setGameId] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");

  const startGame = async () => {
    setMessage("");
    try {
      const res = await fetch(`${BACKEND_BASE}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: 9, cols: 9, mines: 10, user: user?._id }),
      });
      const data = await res.json();

      if (res.ok) {
        setBoard(data.board);
        setGameId(data._id);
        setGameOver(false);
        setMessage("Game started! Good luck 💎");
      } else {
        setMessage(data.error || "Failed to start game");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error while starting game");
    }
  };

  const revealCell = async (r, c) => {
    if (!gameId || gameOver) return;

    try {
      const res = await fetch(`${BACKEND_BASE}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, row: r, col: c }),
      });
      const data = await res.json();

      if (res.ok) {
        setBoard(data.board);

        const cell = data.board[r][c];
        if (cell.isMine) {
          setMessage("💥 You hit a mine! Game Over!");
          setGameOver(true);
        } else {
          setMessage("💎 Safe!");
        }

        if (data.status === "won") {
          setMessage("🎉 You won the game!");
          setGameOver(true);
        }
      } else {
        setMessage(data.error || "Failed to reveal cell");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error while revealing cell");
    }
  };

  const flagCell = async (e, r, c) => {
    e.preventDefault();
    if (!gameId || gameOver) return;

    try {
      const res = await fetch(`${BACKEND_BASE}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, row: r, col: c }),
      });
      const data = await res.json();
      if (res.ok) setBoard(data.board);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Minesweeper</h2>
      <button onClick={startGame} className={styles.startBtn}>
        Start New Game
      </button>

      {message && <div className={styles.message}>{message}</div>}

      <div className={styles.board}>
        {board.length > 0 ? (
          board.map((rowArr, rIdx) => (
            <div key={rIdx} className={styles.row}>
              {rowArr.map((cell, cIdx) => (
                <div
                  key={cIdx}
                  className={`${styles.cell} ${
                    cell.isRevealed ? styles.revealed : ""
                  }`}
                  onClick={() => revealCell(rIdx, cIdx)}
                  onContextMenu={(e) => flagCell(e, rIdx, cIdx)}
                >
                  {cell.isRevealed
                    ? cell.isMine
                      ? "💣"
                      : "💎" // safe cells show diamond
                    : cell.isFlagged
                    ? "🚩"
                    : ""}
                </div>
              ))}
            </div>
          ))
        ) : (
          <p>Click "Start Game" to begin!</p>
        )}
      </div>
    </div>
  );
}
