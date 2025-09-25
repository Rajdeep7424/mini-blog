// Wheel.jsx
import React, { useState } from "react";
import styles from "./Wheel.module.css";

const Wheel = () => {
  const segments = ["$10", "$20", "$30", "$40", "$50", "$60" , "$70","$80", "Try Again"];
  const colors = ["#e74c3c", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6", "#e67e22", "#1abc9c"];
  const segmentAngle = 360 / segments.length;

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState("");
  const [spins, setSpins] = useState(0);
  const [lastWinner, setLastWinner] = useState("");

  const spinWheel = () => {
    if (spinning) return;

    setSpinning(true);
    setResult("");

    // Step 1: Decide how much the wheel should spin
    const baseSpins = (5 + Math.floor(Math.random() * 3)) * 360; // 5–7 full spins
    const randomSpin = Math.floor(Math.random() * 360);           // Extra random offset
    const totalRotation = baseSpins + randomSpin;                 // Total rotation

    // Useful logs for debugging
    console.log("Spinning...");
    console.log("Base Spins:", baseSpins);
    console.log("Random Spin:", randomSpin);
    console.log("Total Rotation (deg):", totalRotation);

    setRotation(totalRotation);
    setSpins((prev) => prev + 1);

    // Step 2: After animation ends, determine the winner
    setTimeout(() => {
      const normalizedRotation = totalRotation % 360;           // Keep within 0-359°
      const pointerAngle = (360 - normalizedRotation) % 360;    // Correct for pointer at top
      const index = (Math.floor(pointerAngle / segmentAngle) % segments.length)-2; //added -2 and it started giving exact result as visually can be seen
      const winner = segments[index];

      console.log("Normalized Rotation (deg):", normalizedRotation);
      console.log("Pointer Angle (deg):", pointerAngle);
      console.log("Winner Index:", index);
      console.log("Winner Segment:", winner);

      setResult(winner);
      if (winner !== "Try Again") {
        setLastWinner(winner);
      }
      setSpinning(false);
    }, 4000); // Match CSS spin duration
  };

  // Wheel gradient
  const gradient = `conic-gradient(from 0deg, ${segments
    .map(
      (_, i) =>
        `${colors[i % colors.length]} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`
    )
    .join(", ")})`;

  return (
    <div className={styles.container}>
      <h1>🎰 Lucky Wheel 🎰</h1>

      {/* Pointer */}
      <div className={styles.pointer}></div>

      {/* Wheel */}
      <div className={styles.wheelWrapper}>
        <div
          className={styles.wheel}
          style={{ 
            transform: `rotate(${rotation}deg)`, 
            background: gradient,
            transition: spinning ? 'transform 4s cubic-bezier(0.2, 0.8, 0.3, 1)' : 'none'
          }}
        >
          {segments.map((seg, i) => {
            const angle = 360 / segments.length;
            return (
              <span
                key={i}
                className={styles.label}
                style={{
                  transform: `rotate(${angle * i + angle/2 }deg) translate(140px) rotate(90deg)`,
                }}
              >
                {seg}
              </span>
            );
          })}
        </div>

        <div 
          className={styles.centerCircle} 
          onClick={spinWheel}
          style={{ cursor: spinning ? 'not-allowed' : 'pointer' }}
        >
          SPIN
        </div>
      </div>

      {/* Result */}
      {result && (
        <h2
          className={`${styles.result} ${
            !result.includes("Try Again") ? styles.winnerAnimation : ""
          }`}
        >
          {result === "Try Again"
            ? "😢 Try Again!"
            : `🎉 You won: ${result}!`}
        </h2>
      )}
      {/* Spin Button */}
      <button
        onClick={spinWheel}
        disabled={spinning}
        className={styles.spinBtn}
      >
        {spinning ? "🎡 Spinning..." : "🎯 Spin Wheel"}
      </button>


      {/* Stats */}
      <div className={styles.stats}>
        <p>Total Spins: {spins}</p>
        {lastWinner && <p>Last Win: {lastWinner}</p>}
      </div>
    </div>
  );
};

export default Wheel;
