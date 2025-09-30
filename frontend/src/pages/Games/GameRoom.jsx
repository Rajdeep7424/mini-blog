import { useEffect } from "react";
import { useGame } from "../context/GameContext";
import TicTacToe from "../components/TicTacToe";

export default function GameRoom({ matchId }) {
  const { socket, setMatch, match, playerId } = useGame();

  useEffect(() => {
    if (!socket) return;

    // join the match room
    socket.emit("joinMatch", { matchId, playerId });

    // get match data from backend
    socket.on("matchData", (data) => {
      setMatch(data);
    });

    return () => {
      socket.off("matchData");
    };
  }, [socket, matchId, playerId, setMatch]);

  if (!match) return <p>Loading match...</p>;

  return (
    <div className="game-room">
      <h2>{match.game.toUpperCase()} Room</h2>
      <p>Players: {match.players[0]} vs {match.players[1]}</p>

      {match.game === "tictactoe" && <TicTacToe />}
    </div>
  );
}
