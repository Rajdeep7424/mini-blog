import { useState, useEffect } from "react";
import styles from "./Minesweeper.module.css";
import { useAuth } from "../../../context/AuthContext";

const BACKEND_BASE = "http://localhost:5000/api/games";

export default function Minesweeper() {
  const { user } = useAuth();
  const [board, setBoard] = useState([]);
  const [gameId, setGameId] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");

  // Scores
  const [currentScore, setCurrentScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);


  useEffect(() => {
    fetch(`${BACKEND_BASE}/leaderboard/minesweeper`)
      .then(res => res.json())
      .then(data => {
        console.log(data); // <--- check what is received
        setLeaderboard(data);
      })
      .catch(err => console.error(err));
  }, []);
  

  // 🔹 Fetch best score on mount
  useEffect(() => {
    if (user?._id) {
      fetch(`${BACKEND_BASE}/best/${user._id}/minesweeper`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch best score");
          return res.json();
        })
        .then((data) => {
          if (data.bestScore !== undefined) setBestScore(data.bestScore);
        })
        .catch((err) => console.error("Error fetching best score:", err));
    }
  }, [user]);

  // 🔹 Start new game
  const startGame = async () => {
    setMessage("");
    setCurrentScore(0);
    setGameOver(false);

    try {
      const res = await fetch(`${BACKEND_BASE}/minesweeper/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: 9, cols: 9, mines: 10, user: user?._id }),
      });
      const data = await res.json();

      if (res.ok) {
        setBoard(data.board);
        setGameId(data._id);
        setMessage("Game started! Good luck 💎");
      } else {
        setMessage(data.error || "Failed to start game");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error while starting game");
    }
  };

  // 🔹 Reveal cell
  const revealCell = async (r, c) => {
    if (!gameId || gameOver) return;

    try {
      const res = await fetch(`${BACKEND_BASE}/minesweeper/reveal`, {
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
          await updateBestScore();
        } else {
          setMessage("💎 Safe!");
          setCurrentScore((prev) => prev + 1);
        }

        if (data.status === "won") {
          setMessage("🎉 You won the game!");
          setGameOver(true);
          await updateBestScore();
        }
      } else {
        setMessage(data.error || "Failed to reveal cell");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error while revealing cell");
    }
  };

  // 🔹 Flag cell
  const flagCell = async (e, r, c) => {
    e.preventDefault();
    if (!gameId || gameOver) return;

    try {
      const res = await fetch(`${BACKEND_BASE}/minesweeper/flag`, {
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

  // 🔹 Update best score in DB after game ends
  const updateBestScore = async () => {
    if (!user?._id) return;

    try {
      const res = await fetch(`${BACKEND_BASE}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          game: "minesweeper",
          score: currentScore
        }),
      });

      const data = await res.json();

      if (res.ok && data.bestScores?.minesweeper !== undefined) {
        setBestScore(data.bestScores.minesweeper);
      }
    } catch (err) {
      console.error("Error updating best score:", err);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Minesweeper</h2>

      {/* Scoreboard */}
      <div className={styles.scoreboard}>
        <span>⭐ Best Score: {bestScore}</span>
        {board.length > 0 && <span>🎯 Current Score: {currentScore}</span>}
      </div>

      {/* Start button */}
{(board.length === 0 || gameOver) && (
  <button onClick={startGame} className={styles.startBtn}>
    {gameOver ? "Start Another Game" : "Start New Game"}
  </button>
)}


      {message && <div className={styles.message}>{message}</div>}
  <div className={styles.masterBoard}>

      <div className={styles.board}>
        {board.length > 0 ? (
          board.map((rowArr, rIdx) => (
            <div key={rIdx} className={styles.row}>
              {rowArr.map((cell, cIdx) => (
                <div
                  key={cIdx}
                  className={`${styles.cell} ${cell.isRevealed ? styles.revealed : ""}`}
                  onClick={() => revealCell(rIdx, cIdx)}
                  onContextMenu={(e) => flagCell(e, rIdx, cIdx)}
                >
                  {cell.isRevealed
                    ? cell.isMine
                      ? "💣"
                      : "💎"
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
      <div className={styles.leaderboard}>
        <h3>🏆 Leaderboard</h3>
        {leaderboard.length > 0 ? (
          leaderboard.map((entry, idx) => (
            <div key={idx}>
              {idx + 1}. {entry.username} — {entry.score}
            </div>
          ))
        ) : (
          <div>No scores yet</div>
        )}
      </div>
      </div>
      
    </div>
  );
}
