import { createContext, useContext, useState, useEffect } from "react";
import { io } from "socket.io-client";

const GameContext = createContext();

export const GameProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null);
  const [match, setMatch] = useState(null);
  const [gameResult, setGameResult] = useState(""); // ✅ shared game result

  useEffect(() => {
    if (!user?._id) return;

    const newSocket = io(`${import.meta.env.VITE_API_URL}`);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("✅ Connected to server:", newSocket.id);
      // only register user
      newSocket.emit("register", { userId: user._id });
    });

    newSocket.on("matchFound", ({ match }) => {
      console.log("🎯 Match found:", match);
      setMatch(match);
      setGameResult(""); // reset when new match starts ✅
      newSocket.emit("joinMatchRoom", { matchId: match._id, userId: user._id });
    });

    newSocket.on("waiting", () => {
      console.log("⏳ Waiting for opponent...");
    });

    return () => newSocket.disconnect();
  }, [user]);

  const makeMove = (index) => {
    if (!socket || !match) return;
    socket.emit("makeMove", { matchId: match._id, userId: user._id, index });
  };

  // ✅ Explicit matchmaking trigger
  const requestMatch = (game = "tictactoe") => {
    if (!socket) return;
    socket.emit("requestMatch", { userId: user._id, game });
  };

  return (
    <GameContext.Provider
      value={{
        socket,
        match,
        setMatch,
        makeMove,
        playerId: user?._id,
        requestMatch,
        gameResult,       // ✅ provide to consumers
        setGameResult,    // ✅ allow TicTacToe to update
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
