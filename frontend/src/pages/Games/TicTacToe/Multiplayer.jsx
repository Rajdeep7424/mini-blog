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
  const [drawOffered, setDrawOffered] = useState(false); 
  const [incomingDrawOffer, setIncomingDrawOffer] = useState(null); 
  const [drawRefusedMsg, setDrawRefusedMsg] = useState(""); 
  const [searching, setSearching] = useState(false); 
  const [errorMessage, setErrorMessage] = useState(""); 

  const [timeLeft, setTimeLeft] = useState(0);
  const [currentTimerPlayer, setCurrentTimerPlayer] = useState(null);

  // Initialize board & timer when match starts
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
    setSearching(false);

    setCurrentTimerPlayer(match.gameState.turn);
    setTimeLeft(30); // default 30s per move
  }, [match, playerId]);

  // Smooth frontend countdown
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  // Listen to socket events
  useEffect(() => {
    if (!socket) return;

    const handleMove = ({ board, turn }) => {
      setBoard(board);
      setTurn(turn);
      setCurrentTimerPlayer(turn);
      setTimeLeft(30);
    };

    const handleGameFinished = ({ match }) => {
      setBoard(match.gameState.board);
      setTurn(null);
      setCurrentTimerPlayer(null);
      setTimeLeft(0);

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

    const handleWaiting = () => setSearching(true);

    const handleErrorMessage = ({ message }) => {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(""), 3000);
    };

    const handleTimerUpdate = ({ timeLeft, currentPlayer }) => {
      setTimeLeft(timeLeft);
      setCurrentTimerPlayer(currentPlayer);
    };

    socket.on("moveMade", handleMove);
    socket.on("gameFinished", handleGameFinished);
    socket.on("drawOffered", handleDrawOffered);
    socket.on("drawCanceled", handleDrawCanceled);
    socket.on("drawRefused", handleDrawRefused);
    socket.on("waiting", handleWaiting);
    socket.on("errorMessage", handleErrorMessage);
    socket.on("timerUpdate", handleTimerUpdate);

    return () => {
      socket.off("moveMade", handleMove);
      socket.off("gameFinished", handleGameFinished);
      socket.off("drawOffered", handleDrawOffered);
      socket.off("drawCanceled", handleDrawCanceled);
      socket.off("drawRefused", handleDrawRefused);
      socket.off("waiting", handleWaiting);
      socket.off("errorMessage", handleErrorMessage);
      socket.off("timerUpdate", handleTimerUpdate);
    };
  }, [socket, playerId, opponentName, match, user]);

  const getMySymbol = () =>
    match?.playerSymbols?.find((p) => p.player === playerId)?.symbol || "";

  const handleClick = (index) => {
    if (!match || board[index] !== null) return;
    if (!turn || turn !== playerId) return;
    if (currentTimerPlayer !== playerId) return; // block click if timeout

    makeMove(index);
  };

  const handleNewGame = () => {
    setBoard(Array(9).fill(null));
    setTurn(null);
    setOpponentName("");
    setOpponentSymbol("");
    setGameResult("");
    setDrawOffered(false);
    setIncomingDrawOffer(null);
    setDrawRefusedMsg("");
    setSearching(false);
    setTimeLeft(0);
    setCurrentTimerPlayer(null);
  };

  const handleFindMatch = () => {
    if (!socket) return;
    handleNewGame();
    socket.emit("requestMatch", { userId: playerId, game: "tictactoe" });
    setSearching(true);
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
        <>
          {!searching ? (
            <button className={styles.button} onClick={handleFindMatch}>🔍 Find Match</button>
          ) : (
            <h3 className={styles.status}>⏳ Searching for opponent...</h3>
          )}
        </>
      ) : (
        <>
          <div className={styles.scoreBoard}>
            <div className={styles.score}>
              <span className={styles.scoreLabel}>You ({getMySymbol()})</span>
              <span className={styles.scoreValue}>{user.username}</span>
            </div>
            <div className={styles.score}>
              <span className={styles.scoreLabel}>{opponentName} ({opponentSymbol})</span>
              <span className={styles.scoreValue}>{opponentName}</span>
            </div>
          </div>

          <div className={styles.gameBoard}>
            {board.map((cell, i) => (
              <button
                key={i}
                onClick={() => handleClick(i)}
                className={`${styles.cell} ${cell === "X" ? styles.cellX : cell === "O" ? styles.cellO : ""}`}
              >
                <span className={styles.cellContent}>{cell}</span>
              </button>
            ))}
          </div>

<div className={styles.status}>
  {turn && turn === playerId && <p>➡️ Your turn ⏱ {timeLeft}s</p>}
  {turn && turn !== playerId && <p>⏳ Waiting for {opponentName}...</p>}
  {!turn && gameResult && <p className={styles.statusResult}>{gameResult}</p>}

  {incomingDrawOffer && (
    <div>
      <p className={styles.statusResult}>⚠️ {incomingDrawOffer} offered a draw</p>
      <button className={styles.button} onClick={acceptDraw}>🤝 Accept Draw</button>
      <button className={styles.buttonCancel} onClick={refuseDraw}>❌ Refuse Draw</button>
    </div>
  )}

  {drawOffered && !incomingDrawOffer && (
    <div>
      <p className={styles.statusResult}>⚠️ Draw offered</p>
      <button className={styles.buttonCancel} onClick={handleCancelDraw}>❌ Cancel Draw</button>
    </div>
  )}

  {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
  {drawRefusedMsg && <p className={styles.statusResult}>{drawRefusedMsg}</p>}
</div>


          <div className={styles.controls}>
            <button className={styles.button} onClick={handleOfferDraw} disabled={drawOffered || incomingDrawOffer}>🤝 Offer Draw</button>
            <button className={styles.buttonReset} onClick={handleNewGame}>🔄 Reset Board</button>
            <button className={styles.button} onClick={handleFindMatch}>🔍 Find New Match</button>
          </div>
        </>
      )}
    </div>
  );
}
