import { useState, useEffect } from "react";
import { useGame } from "../../../context/GameContext";
import { useAuth } from "../../../context/AuthContext"; 
import styles from "./TicTacToe.module.css";

export default function TicTacToe() {
  const { socket, match, makeMove, playerId } = useGame();
  const { user } = useAuth();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState(null);
  const [opponentName, setOpponentName] = useState("");
  const [opponentSymbol, setOpponentSymbol] = useState("");
  const [gameResult, setGameResult] = useState("");
  const [drawOffered, setDrawOffered] = useState(false); // this player offered
  const [incomingDrawOffer, setIncomingDrawOffer] = useState(null); // opponent offered
  const [drawRefusedMsg, setDrawRefusedMsg] = useState(""); // message if draw is refused

  // Set initial board & turn when match found
  useEffect(() => {
    if (!match) return;

    setBoard(match.gameState.board);
    setTurn(match.gameState.turn);

    const oppId = match.players.find((p) => p !== playerId);
    const oppObj = match.playerSymbols.find((p) => p.player === oppId);

    setOpponentName(oppObj?.username || "Opponent");
    setOpponentSymbol(oppObj?.symbol || "");
    setGameResult("");
    setDrawOffered(false);
    setIncomingDrawOffer(null);
    setDrawRefusedMsg("");
  }, [match, playerId]);

  // Listen for live moves, draw offers, and draw refusals
  useEffect(() => {
    if (!socket) return;

    const handleMove = ({ board, turn }) => {
      setBoard(board);
      setTurn(turn);
    };

    const handleGameFinished = ({ match }) => {
      setBoard(match.gameState.board);
      setTurn(null);

      if (match.result.winner === null) setGameResult("🤝 Draw!");
      else if (match.result.winner === playerId) setGameResult("🎉 You win!");
      else setGameResult(`💀 ${opponentName} wins!`);

      setDrawOffered(false);
      setIncomingDrawOffer(null);
      setDrawRefusedMsg("");
    };

    const handleDrawOffered = ({ from }) => {
      if (from !== user.username) {
        setIncomingDrawOffer(from);
        setDrawRefusedMsg("");
      }
    };

    const handleDrawCanceled = () => {
      setIncomingDrawOffer(null);
      setDrawOffered(false);
      setDrawRefusedMsg("");
    };

    const handleDrawRefused = () => {
      setDrawOffered(false);
      setDrawRefusedMsg("❌ Your draw offer was refused");
    };

    socket.on("moveMade", handleMove);
    socket.on("gameFinished", handleGameFinished);
    socket.on("drawOffered", handleDrawOffered);
    socket.on("drawCanceled", handleDrawCanceled);
    socket.on("drawRefused", handleDrawRefused);

    return () => {
      socket.off("moveMade", handleMove);
      socket.off("gameFinished", handleGameFinished);
      socket.off("drawOffered", handleDrawOffered);
      socket.off("drawCanceled", handleDrawCanceled);
      socket.off("drawRefused", handleDrawRefused);
    };
  }, [socket, playerId, opponentName, match, user.username]);

  const getMySymbol = () =>
    match?.playerSymbols?.find((p) => p.player === playerId)?.symbol || "";

  const handleClick = (index) => {
    if (!match || board[index] !== null) return;
    if (!turn || turn !== playerId) return;

    makeMove(index);
  };

  const handleNewGame = () => {
    if (!socket) return;

    setBoard(Array(9).fill(null));
    setTurn(null);
    setOpponentName("");
    setOpponentSymbol("");
    setGameResult("");
    setDrawOffered(false);
    setIncomingDrawOffer(null);
    setDrawRefusedMsg("");

    socket.emit("requestMatch", { userId: playerId, game: "tictactoe" });
  };

  const handleOfferDraw = () => {
    if (!socket || !match) return;
    socket.emit("offerDraw", { matchId: match._id, from: user.username });
    setDrawOffered(true);
    setDrawRefusedMsg("");
  };

  const handleCancelDraw = () => {
    if (!socket || !match) return;
    socket.emit("cancelDraw", { matchId: match._id });
    setDrawOffered(false);
  };

  const acceptDraw = () => {
    if (!socket || !match) return;
    socket.emit("acceptDraw", { matchId: match._id });
    setGameResult("🤝 Draw!");
    setIncomingDrawOffer(null);
    setDrawOffered(false);
  };

  const refuseDraw = () => {
    if (!socket || !match) return;
    socket.emit("refuseDraw", { matchId: match._id });
    setIncomingDrawOffer(null);
  };

  return (
    <div className={styles.ticTacToe}>
      {!match ? (
        <h3 className={styles.status}>⏳ Waiting for match...</h3>
      ) : (
        <>
          <div className={styles.scoreBoard}>
            <div className={styles.score}>
              <span className={styles.scoreLabel}>
                You ({getMySymbol()})
              </span>
              <span className={styles.scoreValue}>{user.username}</span>
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

            {/* Show Accept / Refuse Draw buttons if opponent offered */}
            {incomingDrawOffer && (
              <div>
                <p className={styles.statusResult}>⚠️ {incomingDrawOffer} offered a draw</p>
                <button className={styles.button} onClick={acceptDraw}>
                  🤝 Accept Draw
                </button>
                <button className={styles.buttonCancel} onClick={refuseDraw}>
                  ❌ Refuse Draw
                </button>
              </div>
            )}

            {/* Show your own draw offer */}
            {drawOffered && !incomingDrawOffer && (
              <div>
                <p className={styles.statusResult}>⚠️ Draw offered</p>
                <button className={styles.buttonCancel} onClick={handleCancelDraw}>
                  ❌ Cancel Draw
                </button>
              </div>
            )}

            {/* Draw refused message */}
            {drawRefusedMsg && <p className={styles.statusResult}>{drawRefusedMsg}</p>}
          </div>

          <div className={styles.controls}>
            <button className={styles.button} onClick={handleOfferDraw} disabled={drawOffered || incomingDrawOffer}>
              🤝 Offer Draw
            </button>
            <button className={styles.buttonReset} onClick={handleNewGame}>
              🔄 New Game
            </button>
          </div>
        </>
      )}
    </div>
  );
}
