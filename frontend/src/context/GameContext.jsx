import { createContext, useContext, useState, useEffect } from "react";
import { io } from "socket.io-client";

const GameContext = createContext();

export const GameProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null);
  const [match, setMatch] = useState(null);

  useEffect(() => {
    if (!user?._id) return;

    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("✅ Connected to server:", newSocket.id);

      // Register the user
      newSocket.emit("register", { userId: user._id });

      // Request matchmaking
      newSocket.emit("requestMatch", { userId: user._id, game: "tictactoe" });
    });

    newSocket.on("matchFound", ({ match }) => {
      console.log("🎯 Match found:", match);
      setMatch(match);

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

  return (
    <GameContext.Provider value={{ socket, match, makeMove, playerId: user?._id }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
