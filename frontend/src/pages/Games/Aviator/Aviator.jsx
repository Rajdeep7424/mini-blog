import { useState, useEffect, useRef } from "react";
import styles from "./Aviator.module.css"; 
import { useAuth } from "../../../context/AuthContext";

const BACKEND_BASE = "http://localhost:5000/api/games";

export default function Aviator() {
  const { user } = useAuth();
  const intervalRef = useRef(null);

  const [time, setTime] = useState(0);
  const [crashTime, setCrashTime] = useState(null);
  const [isFlying, setIsFlying] = useState(false);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState(null);
  const [crashed, setCrashed] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);

  // Fetch leaderboard
  useEffect(() => {
    fetch(`${BACKEND_BASE}/leaderboard/aviator`)
      .then(res => res.json())
      .then(setLeaderboard)
      .catch(console.error);
  }, []);

  // Fetch best score
  useEffect(() => {
    if (!user?._id) return;
    fetch(`${BACKEND_BASE}/best/${user._id}/aviator`)
      .then(res => res.json())
      .then(data => {
        if (data.bestScore !== undefined) setBestScore(data.bestScore);
      })
      .catch(console.error);
  }, [user]);

  // Update best score
  const updateBestScore = async (finalScore) => {
    if (!user?._id) return;
    try {
      const res = await fetch(`${BACKEND_BASE}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, game: "aviator", score: finalScore }),
      });
      const data = await res.json();
      if (res.ok && data.bestScores?.aviator !== undefined) {
        setBestScore(data.bestScores.aviator);
      }
    } catch (err) { console.error(err); }
  };

  // Start game
  const startGame = () => {
    setTime(0);
    setScore(0);
    setResult(null);
    setCrashed(false);
    setIsFlying(true);
    setGameStarted(true);

    const randomCrash = (Math.random() * 10 + 5).toFixed(1);
    setCrashTime(parseFloat(randomCrash));

    intervalRef.current = setInterval(() => setTime(prev => prev + 0.1), 100);
  };

  // Crash detection
  useEffect(() => {
    if (isFlying && crashTime && time >= crashTime) {
      clearInterval(intervalRef.current);
      setIsFlying(false);
      setCrashed(true);
      setResult("💥 Plane Crashed!");
      setScore(0);
    }
  }, [time, crashTime, isFlying]);

  // Collect score
  const handleCollect = () => {
    if (!isFlying) return;
    clearInterval(intervalRef.current);
    const earned = Math.floor(time * 10);
    setScore(earned);
    setIsFlying(false);
    setResult(`✅ Collected! Score: ${earned}`);
    updateBestScore(earned);
  };

  const restartGame = () => {
    startGame()
    setTime(0);
    setScore(0);
    setResult(null);
    setCrashed(false);
  };

  return (
    <div className={styles.container}>
     

      {!gameStarted ? (
        <div className={styles.startCard}>
          <h1>✈️ Aviator</h1>
          <div className={styles.scoreboard}>
            <span>⭐ Best Score: {bestScore}</span>
          </div>
          <button className={styles.startBtn} onClick={startGame}>Start Flight</button>
        </div>
      ) : (
        <div className={styles.gameWrapper}>
          <div className={styles.gameArea}>
            <div className={styles.scoreboard}>
              <span>⭐ Best: {bestScore}</span>
              <span>⏱️ Time: {time.toFixed(1)}s</span>
              <span>🎯 Score: {score}</span>
            </div>

            <div className={styles.sky}>
              <div className={styles.clouds}></div>
              {isFlying && !crashed && (
                <img
  src="/plane.png"
  alt="Plane"
  className={`${styles.plane} ${isFlying ? styles.flying : ""}`}
/>

              )}
              {crashed && (
                <img src="/explosion.gif" alt="Explosion" className={styles.explosion} />
              )}
            </div>

            {isFlying && (
              <button className={styles.collectBtn} onClick={handleCollect}>
                Collect
              </button>
            )}

            {(crashed || result) && (
              <div className={styles.overlay}>
                <h1>{result}</h1>
                <button className={styles.restartBtn} onClick={restartGame}>
                  Restart Flight
                </button>
              </div>
            )}
          </div>
        </div>
      )}
       {/* Leaderboard always visible */}
      <div className={styles.leaderboard}>
        <h3>🏆 Leaderboard</h3>
        {leaderboard.length > 0 ? (
          leaderboard.map((entry, idx) => (
            <div key={idx}>{idx + 1}. {entry.username} — {entry.score}</div>
          ))
        ) : <div>No scores yet</div>}
      </div>
    </div>
  );
}
