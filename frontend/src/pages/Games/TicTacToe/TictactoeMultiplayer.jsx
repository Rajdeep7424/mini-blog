import { useState, useEffect } from "react";
import { useGame } from "../../../context/GameContext";
import { useAuth } from "../../../context/AuthContext"; 
import styles from "./TicTacToeMultiplayer.module.css";

export default function TictactoeMultiplayer() {
  const { socket, match, makeMove, playerId, gameResult, setGameResult } = useGame(); // ✅ use from context
  const { user } = useAuth();

  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState(null);
  const [opponentName, setOpponentName] = useState("");
  const [opponentSymbol, setOpponentSymbol] = useState("");
  const [drawOffered, setDrawOffered] = useState(false); 
  const [incomingDrawOffer, setIncomingDrawOffer] = useState(null); 
  const [drawRefusedMsg, setDrawRefusedMsg] = useState(""); 
  const [searching, setSearching] = useState(false); 
  const [errorMessage, setErrorMessage] = useState(""); 
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentTimerPlayer, setCurrentTimerPlayer] = useState(null);

  const isCellDisabled = (index) => {
    if (board[index] !== null) return true;
    if (!turn) return true;
    if (turn !== playerId) return true;
    if (currentTimerPlayer !== playerId) return true;
    return false;
  };

  // Initialize board & timer when match starts
  useEffect(() => {
    if (!match) return;

    setBoard(match.gameState.board);
    setTurn(match.gameState.turn);

    const oppId = match.players.find((p) => p !== playerId);
    const oppObj = match.playerSymbols.find((p) => p.player === oppId);

    setOpponentName(oppObj?.username || "Opponent");
    setOpponentSymbol(oppObj?.symbol || "");
    setGameResult(""); // ✅ reset shared result
    setDrawOffered(false);
    setIncomingDrawOffer(null);
    setDrawRefusedMsg("");
    setSearching(false);

    setCurrentTimerPlayer(match.gameState.turn);
    setTimeLeft(30); // default 30s per move
  }, [match, playerId, setGameResult]);

  // Smooth frontend countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft(prev => Math.max(prev - 1, 0)), 1000);
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

      if (match.result.status === "finished") {
        if (match.result.reason === "draw") setGameResult("🤝 Draw!");
        else if (match.result.winner === playerId) setGameResult("🎉 You win!");
        else setGameResult(`💀 ${opponentName} wins!`);
      }

      setDrawOffered(false);
      setIncomingDrawOffer(null);
      setDrawRefusedMsg("");
      setSearching(false);
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

    const handleMatchAbandoned = ({ message }) => {
      setGameResult(message || "⚠️ Match abandoned");
      setTurn(null);
      setCurrentTimerPlayer(null);
      setTimeLeft(0);
      setDrawOffered(false);
      setIncomingDrawOffer(null);
      setDrawRefusedMsg("");
      setSearching(false);
    };

    socket.on("moveMade", handleMove);
    socket.on("gameFinished", handleGameFinished);
    socket.on("drawOffered", handleDrawOffered);
    socket.on("drawCanceled", handleDrawCanceled);
    socket.on("drawRefused", handleDrawRefused);
    socket.on("waiting", handleWaiting);
    socket.on("errorMessage", handleErrorMessage);
    socket.on("timerUpdate", handleTimerUpdate);
    socket.on("matchAbandoned", handleMatchAbandoned);

    return () => {
      socket.off("moveMade", handleMove);
      socket.off("gameFinished", handleGameFinished);
      socket.off("drawOffered", handleDrawOffered);
      socket.off("drawCanceled", handleDrawCanceled);
      socket.off("drawRefused", handleDrawRefused);
      socket.off("waiting", handleWaiting);
      socket.off("errorMessage", handleErrorMessage);
      socket.off("timerUpdate", handleTimerUpdate);
      socket.off("matchAbandoned", handleMatchAbandoned);
    };
  }, [socket, playerId, opponentName, match, user, setGameResult]);

  const getMySymbol = () =>
    match?.playerSymbols?.find((p) => p.player === playerId)?.symbol || "";

  const handleClick = (index) => {
    if (!match || board[index] !== null) return;
    if (!turn || turn !== playerId) return;
    if (currentTimerPlayer !== playerId) return;
    makeMove(index);
  };

  const handleNewGame = () => {
    setBoard(Array(9).fill(null));
    setTurn(null);
    setOpponentName("");
    setOpponentSymbol("");
    setGameResult(""); // ✅ reset shared result
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
    setGameResult("🤝 Draw!"); // ✅ shared result
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
      {match && (
        <div className={styles.scoreBoard}>
          
          <div className={`${styles.score} ${turn === playerId && !gameResult ? styles.activePlayer : ''}`}>
  <span className={styles.scoreLabel}>You ( {getMySymbol()} )</span>
  <span className={styles.scoreValue}>{user.username}</span>
</div>

<div className={`${styles.score} ${turn !== playerId && !gameResult ? styles.activePlayer : ''}`}>
  <span className={styles.scoreLabel}>Opponent ( {opponentSymbol} )</span>
  <span className={styles.scoreValue}>{opponentName}</span>
</div>

        </div>
      )}

      {match && (
        <div className={`${styles.gameBoard} ${turn === playerId ? styles.activeTurn : ''}`}>
          {board.map((cell, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              disabled={isCellDisabled(i)}
              className={`${styles.cell} ${cell === "X" ? styles.cellX : cell === "O" ? styles.cellO : ""}`}
            >
              <span className={styles.cellContent}>{cell}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.status}>
        {turn && turn === playerId && <p>➡️ Your turn ⏱ {timeLeft}s</p>}
        {turn && turn !== playerId && <p>⏳ Waiting for {opponentName}...</p>}
        {gameResult && <p className={styles.statusResult}>{gameResult}</p>}

        {searching && !match && (
  <div className={styles.findMatchCard}>
    <div className={styles.findMatchContent}>
      <p className={styles.findMatchText}>🔍 Searching for an opponent...</p>
      <div className={styles.loader}></div>
    </div>
  </div>
)}


        <div>
          {incomingDrawOffer && (
            <>
              <p className={styles.statusResult}>⚠️ {incomingDrawOffer} offered a draw</p>
              <div className={styles.controls}>
                <button className={styles.button} onClick={acceptDraw}>🤝 Accept Draw</button>
                <button className={styles.buttonReset} onClick={refuseDraw}>❌ Refuse Draw</button>
              </div>
            </>
          )}

          {drawOffered && !incomingDrawOffer && (
            <div className={styles.controls1}>
              <p className={styles.statusResult}>⚠️ Draw offered</p>
              <button className={styles.buttonReset} onClick={handleCancelDraw}>❌ Cancel Draw</button>
            </div>
          )}
        </div>

        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
        {drawRefusedMsg && <p className={styles.statusResult}>{drawRefusedMsg}</p>}
      </div>

      <div className={styles.controls}>
        {(gameResult || (!match && !searching)) && (
  <div className={styles.findMatchCard}>
    <div className={styles.findMatchContent}>
      <p className={styles.findMatchText}>🎮 Ready for a new match?</p>
      <button className={styles.findMatchButton} onClick={handleFindMatch}>
        🔍 Find New Match
      </button>
    </div>
  </div>
)}


        {match && !gameResult && (
          <>
            <button className={styles.button} onClick={handleOfferDraw} disabled={drawOffered || incomingDrawOffer}>🤝 Offer Draw</button>
            <button className={styles.buttonReset} onClick={handleNewGame}>🔄 Reset Board</button>
          </>
        )}
      </div>
    </div>
  );
}
