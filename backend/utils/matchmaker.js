import Matchmaking from "../models/Matchmaking.js";
import Match from "../models/Match.js";
import User from "../models/User.js";

/**
 * Handles matchmaking logic
 * @param {String} playerId - The ID of the player requesting a match
 * @param {String} game - The game type (e.g., "tictactoe")
 */
export const findMatch = async (playerId, game) => {
  // Step 1: check if another player is already waiting for the same game
  const opponent = await Matchmaking.findOne({ game, playerId: { $ne: playerId } });

  if (opponent) {
    // ✅ Step 2: create a match with both players
    const newMatch = await Match.create({
      game,
      players: [playerId, opponent.playerId],
      gameState: {}, // empty at start
      result: { status: "ongoing" },
    });

    // Step 3: remove both players from matchmaking
    await Matchmaking.deleteMany({
      playerId: { $in: [playerId, opponent.playerId] },
      game,
    });

    // Step 4: update both users to "in-game"
    await User.updateMany(
      { _id: { $in: [playerId, opponent.playerId] } },
      { $set: { status: "in-game" } }
    );

    return { matchFound: true, match: newMatch };
  }

  // If no opponent found, just add this player to the waiting queue
  await Matchmaking.create({ playerId, game });
  await User.findByIdAndUpdate(playerId, { status: "waiting" });

  return { matchFound: false, message: "Waiting for opponent..." };
};
