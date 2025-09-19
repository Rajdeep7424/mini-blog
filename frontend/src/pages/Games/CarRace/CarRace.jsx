import { useEffect, useRef, useState } from "react";
import styles from "./CarRace.module.css";

export default function CarRace() {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(5);
  const [gameStarted, setGameStarted] = useState(false);

  const carRef = useRef({ x: 230, y: 500, width: 40, height: 70, dx: 0 });

  const handleTouchStart = (direction) => {
    carRef.current.dx = direction;
  };

  const handleTouchEnd = () => {
    carRef.current.dx = 0;
  };

  useEffect(() => {
    if (!gameStarted) return; // only start the game loop if started

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationId;
    let distance = 0;
    let lineOffset = 0;

    const road = { width: 220, laneX: (canvas.width - 220) / 2 };
    let obstacles = [];
    let buildings = [];
    let trees = [];

    const despawnOffScreen = (arr) =>
      arr.filter((obj) => obj.y < canvas.height + 100);

    // --- Keyboard controls ---
    const keyDown = (e) => {
      if (e.key === "ArrowLeft") carRef.current.dx = -6;
      if (e.key === "ArrowRight") carRef.current.dx = 6;
    };
    const keyUp = (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight")
        carRef.current.dx = 0;
    };
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);

    // --- Spawns ---
    function spawnObstacle() {
      if (obstacles.length > 0 && obstacles[obstacles.length - 1].y < 200)
        return;
      const lanes = [
        road.laneX + 10,
        road.laneX + road.width / 2 - 20,
        road.laneX + road.width - 50,
      ];
      const numObstacles = Math.floor(Math.random() * 2) + 1;
      lanes
        .sort(() => 0.5 - Math.random())
        .slice(0, numObstacles)
        .forEach((x) => obstacles.push({ x, y: -80, width: 40, height: 70 }));
    }

    function spawnBuilding() {
      const side = Math.random() < 0.5 ? 50 : canvas.width - 120;
      const width = 70;
      const height = 80 + Math.random() * 40;
      const color = "#2d3436";
      buildings.push({ x: side, y: -height, width, height, color });
    }

    function spawnTree() {
      const x = Math.random() < 0.5 ? 10 : canvas.width - 50;
      trees.push({ x, y: -40 });
    }

    // --- Drawing functions ---
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

      for (let i = 1; i < 3; i++)
        drawLaneLine(road.laneX + (road.width / 3) * i);
    }

    function drawLaneLine(x) {
      ctx.strokeStyle = "white";
      ctx.lineWidth = 4;
      ctx.setLineDash([30, 30]);
      ctx.beginPath();
      ctx.moveTo(x, -canvas.height + lineOffset);
      ctx.lineTo(x, canvas.height + lineOffset);
      ctx.stroke();
      ctx.setLineDash([]);
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

    function drawBuilding(b) {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.fillStyle = "#082c48ff";
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + b.width / 2, b.y - 15);
      ctx.lineTo(b.x + b.width, b.y);
      ctx.fill();
      const windowWidth = 8;
      const windowHeight = 12;
      const xPadding = (b.width - 4 * windowWidth) / 3;
      const yPadding = 5;
      const ySpacing = 20;
      for (
        let row = 0;
        row < Math.floor((b.height - yPadding) / ySpacing);
        row++
      ) {
        for (let col = 0; col < 4; col++) {
          ctx.fillStyle = Math.random() < 0.5 ? "#ffeaa7" : "#dfe6e9";
          const x = b.x + xPadding + col * (windowWidth + 5);
          const y = b.y + yPadding + row * ySpacing;
          ctx.fillRect(x, y, windowWidth, windowHeight);
        }
      }
    }

    function drawTree(t) {
      ctx.fillStyle = "#6d4c41";
      ctx.fillRect(t.x + 8, t.y + 20, 10, 20);
      ctx.fillStyle = "#2ecc71";
      ctx.beginPath();
      ctx.arc(t.x + 12, t.y + 15, 15, 0, Math.PI * 2);
      ctx.arc(t.x + 12, t.y + 5, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    function getHitbox(obj) {
      return {
        x: obj.x - 5,
        y: obj.y - 5,
        width: obj.width + 10,
        height: obj.height + 10,
      };
    }

    function checkCollision(a, b) {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      );
    }

    function update() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      lineOffset += speed;
      if (lineOffset > 60) lineOffset = 0;

      drawRoad();

      buildings.forEach((b) => {
        b.y += speed;
        drawBuilding(b);
      });
      buildings = despawnOffScreen(buildings);

      trees.forEach((t) => {
        t.y += speed;
        drawTree(t);
      });
      trees = despawnOffScreen(trees);

      const car = carRef.current;
      car.x += car.dx;
      if (car.x < road.laneX) car.x = road.laneX;
      if (car.x + car.width > road.laneX + road.width)
        car.x = road.laneX + road.width - car.width;
      drawCar(car.x, car.y);

      if (Math.random() < 0.05) spawnObstacle();
      obstacles.forEach((o) => {
        o.y += speed;
        drawCar(o.x, o.y, "#0984e3");
        if (checkCollision(getHitbox(car), getHitbox(o))) gameOverNow();
      });
      obstacles = despawnOffScreen(obstacles);

      if (Math.random() < 0.02) spawnBuilding();
      if (Math.random() < 0.03) spawnTree();

      distance += speed;
      setScore(Math.floor(distance / 10));
      if (distance % 10 === 0) setSpeed((s) => s + 5);

      if (!gameOver) animationId = requestAnimationFrame(update);
    }

    function gameOverNow() {
      setGameOver(true);
      cancelAnimationFrame(animationId);
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
    setGameStarted(true); // go back to start card
  };

  return (
    <div className={styles.container}>
      {!gameStarted ? (
        <div className={styles.startCard}>
          <h1>🚗 Car Racing</h1>
          <button onClick={() => setGameStarted(true)}>Start Race</button>
        </div>
      ) : (
        <>
          <h2 className={styles.score}>Score: {score}</h2>
          <canvas
            ref={canvasRef}
            width={500}
            height={600}
            className={styles.canvas}
          ></canvas>
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
    </div>
  );
}
