import { useEffect, useRef, useState } from "react";
import styles from "./CarRace.module.css";
import { useAuth } from "../../../context/AuthContext";

const BACKEND_BASE = "http://localhost:5000/api/games";

export default function CarRace() {
  const { user } = useAuth();
  const canvasRef = useRef(null);

  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(5);
  const [gameStarted, setGameStarted] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);


  const carRef = useRef({ x: 230, y: 500, width: 40, height: 70, dx: 0 });

useEffect(() => {
  fetch(`${BACKEND_BASE}/leaderboard/carrace`)
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
      fetch(`${BACKEND_BASE}/best/${user._id}/carrace`)
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

  // 🔹 Update best score in backend
  const updateBestScore = async (finalScore) => {
    if (!user?._id) return;

    try {
      const res = await fetch(`${BACKEND_BASE}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          game: "carrace",
          score: finalScore,
        }),
      });

      const data = await res.json();
      if (res.ok && data.bestScores?.carrace !== undefined) {
        setBestScore(data.bestScores.carrace);
      }
    } catch (err) {
      console.error("Error updating best score:", err);
    }
  };

  const handleTouchStart = (direction) => {
    carRef.current.dx = direction;
  };

  const handleTouchEnd = () => {
    carRef.current.dx = 0;
  };

  useEffect(() => {
    if (!gameStarted) return; // only start game loop if started

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationId;
    let distance = 0;
    let lineOffset = 0;

    const road = { width: 220, laneX: (canvas.width - 220) / 2 };
    let obstacles = [];

    const despawnOffScreen = (arr) => arr.filter((obj) => obj.y < canvas.height + 100);

    const keyDown = (e) => {
      if (e.key === "ArrowLeft") carRef.current.dx = -6;
      if (e.key === "ArrowRight") carRef.current.dx = 6;
    };
    const keyUp = (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") carRef.current.dx = 0;
    };
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);

    function spawnObstacle() {
      if (obstacles.length > 0 && obstacles[obstacles.length - 1].y < 200) return;
      const lanes = [
        road.laneX + 10,
        road.laneX + road.width / 2 - 20,
        road.laneX + road.width - 50,
      ];
      const numObstacles = Math.floor(Math.random() * 2) + 1;
      lanes.sort(() => 0.5 - Math.random())
        .slice(0, numObstacles)
        .forEach((x) => obstacles.push({ x, y: -80, width: 40, height: 70 }));
    }

    function drawRoad() {
      ctx.fillStyle = "#555";
      ctx.fillRect(road.laneX, 0, road.width, canvas.height);

      ctx.strokeStyle = "white";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(road.laneX, 0);
      ctx.lineTo(road.laneX, canvas.height);
      ctx.moveTo(road.laneX + road.width, 0);
      ctx.lineTo(road.laneX + road.width, canvas.height);
      ctx.stroke();

      for (let i = 1; i < 3; i++) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;
        ctx.setLineDash([30, 30]);
        ctx.beginPath();
        ctx.moveTo(road.laneX + (road.width / 3) * i, -canvas.height + lineOffset);
        ctx.lineTo(road.laneX + (road.width / 3) * i, canvas.height + lineOffset);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    function drawCar(x, y, color = "#e63946") {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 40, 70);
      ctx.fillStyle = "#dfe6e9";
      ctx.fillRect(x + 5, y + 10, 30, 15);
      ctx.fillStyle = "yellow";
      ctx.fillRect(x + 5, y, 10, 5);
      ctx.fillRect(x + 25, y, 10, 5);
      ctx.fillStyle = "black";
      ctx.fillRect(x - 5, y + 10, 5, 15);
      ctx.fillRect(x + 40, y + 10, 5, 15);
      ctx.fillRect(x - 5, y + 45, 5, 15);
      ctx.fillRect(x + 40, y + 45, 5, 15);
    }

    function getHitbox(obj) {
      return { x: obj.x - 5, y: obj.y - 5, width: obj.width + 10, height: obj.height + 10 };
    }

    function checkCollision(a, b) {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      );
    }

    function gameOverNow() {
      setGameOver(true);
      updateBestScore(Math.floor(distance / 10)); // ✅ Pass final score directly
      cancelAnimationFrame(animationId);
    }

    function update() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      lineOffset += speed;
      if (lineOffset > 60) lineOffset = 0;

      drawRoad();

      const car = carRef.current;
      car.x += car.dx;
      if (car.x < road.laneX) car.x = road.laneX;
      if (car.x + car.width > road.laneX + road.width) car.x = road.laneX + road.width - car.width;
      drawCar(car.x, car.y);

      if (Math.random() < 0.05) spawnObstacle();
      obstacles.forEach((o) => {
        o.y += speed;
        drawCar(o.x, o.y, "#0984e3");
        if (checkCollision(getHitbox(car), getHitbox(o))) gameOverNow();
      });
      obstacles = despawnOffScreen(obstacles);

      distance += speed;
      setScore(Math.floor(distance / 10));

      if (!gameOver) animationId = requestAnimationFrame(update);
    }

    update();

    return () => {
      cancelAnimationFrame(animationId);
      document.removeEventListener("keydown", keyDown);
      document.removeEventListener("keyup", keyUp);
    };
  }, [gameStarted, gameOver]);

  const restartGame = () => {
    setGameOver(false);
    setScore(0);
    setSpeed(5);
    carRef.current = { x: 230, y: 500, width: 40, height: 70, dx: 0 };
    setGameStarted(true);
  };

  return (
    <div className={styles.container}>
      {!gameStarted ? (
        <div className={styles.startCard}>
          <h1>🚗 Car Racing</h1>
          <div className={styles.scoreboard}>
            <span>⭐ Best Score: {bestScore}</span>
          </div>
          <button onClick={() => setGameStarted(true)}>Start Race</button>
        </div>
      ) : (
        <>
          <div className={styles.scoreboard}>
            <span>⭐ Best Score: {bestScore}</span>
            <span>🎯 Current Score: {score}</span>
          </div>

          <canvas ref={canvasRef} width={500} height={600} className={styles.canvas}></canvas>

          {gameOver && (
            <div className={styles.overlay}>
              <h1>💥 Game Over!</h1>
              <button onClick={restartGame} className={styles.restartBtn}>
                Restart
              </button>
            </div>
          )}

          <div className={styles.controls}>
            <button
              onTouchStart={() => handleTouchStart(-6)}
              onTouchEnd={handleTouchEnd}
              onMouseDown={() => handleTouchStart(-6)}
              onMouseUp={handleTouchEnd}
            >
              &larr;
            </button>
            <button
              onTouchStart={() => handleTouchStart(6)}
              onTouchEnd={handleTouchEnd}
              onMouseDown={() => handleTouchStart(6)}
              onMouseUp={handleTouchEnd}
            >
              &rarr;
            </button>
          </div>
        </>
      )}
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
  );
}
