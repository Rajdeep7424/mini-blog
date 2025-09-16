import { useState, useEffect } from "react";
import { useGame } from "../../../context/GameContext";
import styles from "./TicTacToe.module.css";

export default function TicTacToe() {
  const { socket, match, makeMove, playerId } = useGame();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState(null);
  const [opponentName, setOpponentName] = useState("");
  const [opponentSymbol, setOpponentSymbol] = useState("");
  const [gameResult, setGameResult] = useState(""); // New state for result

  // Set initial board & turn when match found
  useEffect(() => {
    if (!match) return;

    setBoard(match.gameState.board);
    setTurn(match.gameState.turn);

    const opp = match.players.find((p) => p !== playerId);
    const oppObj = match.playerSymbols.find((p) => p.player === opp);

    setOpponentName(oppObj?.username || "Opponent");
    setOpponentSymbol(oppObj?.symbol || "");
    setGameResult(""); // reset result when new match starts
  }, [match, playerId]);

  // Listen for live moves
  useEffect(() => {
    if (!socket) return;

    const handleMove = ({ board, turn }) => {
      setBoard(board);
      setTurn(turn);
    };

    const handleGameFinished = ({ match }) => {
      setBoard(match.gameState.board);
      setTurn(null);

      if (match.result.winner === null) {
        setGameResult("🤝 Draw!");
      } else if (match.result.winner === playerId) {
        setGameResult("🎉 You win!");
      } else {
        setGameResult(`💀 ${opponentName} wins!`);
      }
    };

    socket.on("moveMade", handleMove);
    socket.on("gameFinished", handleGameFinished);

    return () => {
      socket.off("moveMade", handleMove);
      socket.off("gameFinished", handleGameFinished);
    };
  }, [socket, playerId, opponentName]);

  const getMySymbol = () =>
    match?.playerSymbols?.find((p) => p.player === playerId)?.symbol || "";

  const handleClick = (index) => {
    if (!match || board[index] !== null) return;
    if (!turn || turn !== playerId) return; // only allow if your turn

    makeMove(index);
  };

  return (
    <div className={styles.ticTacToe}>
      {!match ? (
        <h3 className={styles.status}>⏳ Waiting for match...</h3>
      ) : (
        <>
          <div className={styles.scoreBoard}>
            <div className={styles.score}>
              <span className={styles.scoreLabel}>You ({getMySymbol()})</span>
              <span className={styles.scoreValue}>{playerId}</span>
            </div>
            <div className={styles.score}>
              <span className={styles.scoreLabel}>
                {opponentName} ({opponentSymbol})
              </span>
              <span className={styles.scoreValue}>{opponentName}</span>
            </div>
          </div>

          <div className={styles.gameBoard}>
            {board.map((cell, i) => (
              <button
                key={i}
                onClick={() => handleClick(i)}
                className={`${styles.cell} ${
                  cell === "X" ? styles.cellX : cell === "O" ? styles.cellO : ""
                }`}
              >
                <span className={styles.cellContent}>{cell}</span>
              </button>
            ))}
          </div>

          <div className={styles.status}>
            {turn === playerId && <p>➡️ Your turn</p>}
            {turn && turn !== playerId && <p>⏳ {opponentName}'s turn</p>}
            {!turn && gameResult && <p className={styles.statusResult}>{gameResult}</p>}
          </div>
        </>
      )}
    </div>
  );
}
