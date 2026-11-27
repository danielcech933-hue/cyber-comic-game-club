import { describe, expect, it } from "vitest";
import { normalizeOnlineRoomResponse, OnlineGameError } from "@/lib/online-game";

const player = { id: "player-1", name: "Chmelak", isHost: true, online: true };
const gameState = {
  secrets: { Chmelak: 2 },
  selectedPlayers: ["Chmelak"],
  questions: {},
  guesses: [],
};

describe("online room API contract", () => {
  it("normalizes the canonical flat server response", () => {
    const room = normalizeOnlineRoomResponse({
      code: "ABCD2345",
      game: "guess-who",
      status: "waiting",
      max: 4,
      players: [player],
      gameState,
    });

    expect(room.code).toBe("ABCD2345");
    expect(room.players).toEqual([player]);
    expect(room.gameState.secrets).toEqual({ Chmelak: 2 });
  });

  it("also normalizes the legacy nested response without crashing the route", () => {
    const room = normalizeOnlineRoomResponse({
      room: {
        code: "ABCD2345",
        game: "guess-who",
        status: "playing",
        max: 4,
        players: [player],
      },
      gameState,
    });

    expect(room.status).toBe("playing");
    expect(room.players[0]?.name).toBe("Chmelak");
    expect(room.gameState.selectedPlayers).toEqual(["Chmelak"]);
  });

  it("rejects malformed payloads with a typed API error", () => {
    expect(() => normalizeOnlineRoomResponse({ room: {}, gameState: {} })).toThrow(OnlineGameError);
  });
});
