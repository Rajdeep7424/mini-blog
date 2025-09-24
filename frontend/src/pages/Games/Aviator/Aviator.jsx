import { useState, useEffect, useRef } from "react";

export default function PlaneCrashGame() {
  const [time, setTime] = useState(0);
  const [crashTime, setCrashTime] = useState(null);
  const [isFlying, setIsFlying] = useState(false);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState(null);
  const intervalRef = useRef(null);

  // Start game
  const startGame = () => {
    setTime(0);
    setScore(0);
    setResult(null);
    setIsFlying(true);

    const randomCrash = Math.floor(Math.random() * 10) + 5; // crash in 5–15s
    setCrashTime(randomCrash);

    intervalRef.current = setInterval(() => {
      setTime((prev) => prev + 0.1);
    }, 100);
  };

  // End game if crash
  useEffect(() => {
    if (isFlying && crashTime && time >= crashTime) {
      clearInterval(intervalRef.current);
      setIsFlying(false);
      setResult("💥 Plane Crashed! You Lost!");
      setScore(0);
    }
  }, [time, crashTime, isFlying]);

  // Collect before crash
  const handleCollect = () => {
    if (isFlying) {
      clearInterval(intervalRef.current);
      const earned = Math.floor(time * 10); // Score formula
      setScore(earned);
      setIsFlying(false);
      setResult(`✅ You Collected! Score: ${earned}`);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>✈️ Plane Crash Game</h2>
      {!isFlying && (
        <button onClick={startGame}>Start Game</button>
      )}
      {isFlying && (
        <div>
          <p>Flying Time: {time.toFixed(1)}s</p>
          <button onClick={handleCollect}>Collect</button>
        </div>
      )}
      {result && <h3>{result}</h3>}
      <p>Your Score: {score}</p>
    </div>
  );
}
