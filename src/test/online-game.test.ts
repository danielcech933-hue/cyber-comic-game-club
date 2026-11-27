import { describe, expect, it } from "vitest";
import { normalizeOnlineRoomResponse, OnlineGameError, type OnlineGameState } from "@/lib/online-game";

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
    expect((room.gameState as OnlineGameState).secrets).toEqual({ Chmelak: 2 });
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
    expect((room.gameState as OnlineGameState).selectedPlayers).toEqual(["Chmelak"]);
  });

  it("rejects malformed payloads with a typed API error", () => {
    expect(() => normalizeOnlineRoomResponse({ room: {}, gameState: {} })).toThrow(OnlineGameError);
  });
});

it("normalizes an Akciove Monopoly room with stock state",()=>{const state={turnOrder:["p1","p2"],currentTurn:"p1",positions:{p1:0,p2:0},cash:{p1:1500,p2:1500},holdings:{p1:{},p2:{}},prices:{NOVA:120},bankrupt:[],hasRolled:false,lastRoll:null,turn:1,maxTurns:24,pendingOffer:null,log:[],gameOver:false,winner:null};const room=normalizeOnlineRoomResponse({code:"STOCK234",game:"stock-monopoly",status:"playing",max:2,players:[player],gameState:state});expect(room.game).toBe("stock-monopoly");expect(room.gameState).toMatchObject({currentTurn:"p1",cash:{p1:1500}});});
