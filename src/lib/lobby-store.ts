import { useEffect, useState } from "react";
import type { GameId } from "./games/catalog";
import { GAMES } from "./games/catalog";

export type Room = {
  code: string;
  game: GameId;
  max: number;
  players: string[];
  host: string;
  status: "waiting" | "playing";
  gameState?: { secrets: Record<string, number>; questions: Record<string, Array<{ text: string; yes: boolean }>>; guesses: Record<string, { player: string; characterId: number; correct: boolean }[]> };
};
export type ChatMsg = { id: string; author: string; avatar?: AvatarKey; text: string; color: "paper" | "pink" };
export type AvatarKey = "clip" | "curly" | "wavy";
export type LobbyState = {
  ready: boolean;
  nick: string;
  wins: Record<GameId, number>;
  rooms: Room[];
  chat: ChatMsg[];
};

const KEY = "cyberchmel-lobby-v1";
export const BOT_NAMES: string[] = [];

export function seedState(): LobbyState {
  return {
    ready: false,
    nick: "",
    wins: { sandbox: 0 },
    rooms: [],
    chat: [],
  };
}

let state: LobbyState | null = null;
const listeners = new Set<() => void>();

function load(): LobbyState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...seedState(), ...(JSON.parse(raw) as Partial<LobbyState>), ready: true };
  } catch {
    /* ignore corrupt storage */
  }
  return { ...seedState(), ready: true };
}

function current(): LobbyState {
  if (!state) state = load();
  return state;
}

export function update(fn: (s: LobbyState) => LobbyState) {
  state = fn(current());
  try {
    const { ready: _r, ...persist } = state;
    localStorage.setItem(KEY, JSON.stringify(persist));
  } catch {
    /* storage full / private mode */
  }
  listeners.forEach((l) => l());
}

export function useLobby(): LobbyState {
  const [s, setS] = useState<LobbyState>(seedState);
  useEffect(() => {
    setS(current());
    const l = () => setS(current());
    listeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        state = load();
        listeners.forEach((x) => x());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return s;
}

const ALPHA = "ABCDEFGHJKLMNPRSTUVWXYZ23456789";
export function genCode(existing: string[]) {
  for (;;) {
    let c = "";
    for (let i = 0; i < 4; i++) c += ALPHA[Math.floor(Math.random() * ALPHA.length)];
    if (!existing.includes(c)) return c;
  }
}

export function ensureNick(): string {
  const s = current();
  if (s.nick) return s.nick;
  const nick = `Chmelák${Math.floor(100 + Math.random() * 900)}`;
  update((x) => ({ ...x, nick }));
  return nick;
}

export function setNick(nick: string) {
  update((s) => ({ ...s, nick: nick.trim().slice(0, 16) }));
}

export type CodeCheck = "ok" | "invalid" | "taken";
export function checkCustomCode(code: string): CodeCheck {
  if (!/^[A-Z0-9]{4,6}$/.test(code)) return "invalid";
  return current().rooms.some((r) => r.code === code) ? "taken" : "ok";
}

export function createRoom(game: GameId, max: number, customCode?: string): string {
  const me = ensureNick();
  const code = customCode || genCode(current().rooms.map((r) => r.code));
  update((s) => ({
    ...s,
    rooms: [{ code, game, max, players: [me], host: me, status: "waiting" }, ...s.rooms],
  }));
  return code;
}

export type JoinResult = "ok" | "notfound" | "full" | "playing";
export function joinRoom(code: string): JoinResult {
  const me = ensureNick();
  const room = current().rooms.find((r) => r.code === code.toUpperCase());
  if (!room) return "notfound";
  if (room.players.includes(me)) return "ok";
  if (room.status === "playing") return "playing";
  if (room.players.length >= room.max) return "full";
  update((s) => ({
    ...s,
    rooms: s.rooms.map((r) => (r.code === room.code ? { ...r, players: [...r.players, me] } : r)),
  }));
  return "ok";
}

/** Joins the fullest open room of the game, or opens a new one. */
export function quickPlay(game: GameId): string {
  const me = ensureNick();
  const open = current()
    .rooms.filter((r) => r.game === game && r.status === "waiting" && r.players.length < r.max && !r.players.includes(me))
    .sort((a, b) => b.players.length - a.players.length)[0];
  if (open && joinRoom(open.code) === "ok") return open.code;
  return createRoom(game, GAMES[game].maxPlayers);
}

export function addBot(_code: string) { /* Bots are disabled in the clean lobby. */ }

export function setGuessWhoSecret(code: string, player: string, characterId: number) {
  update((s) => ({
    ...s,
    rooms: s.rooms.map((r) => r.code === code ? {
      ...r,
      gameState: {
        secrets: { ...(r.gameState?.secrets ?? {}), [player]: characterId },
        questions: r.gameState?.questions ?? {},
        guesses: r.gameState?.guesses ?? {},
      },
    } : r),
  }));
}

export function addGuessWhoQuestion(code: string, targetPlayer: string, text: string, yes: boolean) {
  update((s) => ({
    ...s,
    rooms: s.rooms.map((r) => r.code === code ? {
      ...r,
      gameState: {
        secrets: r.gameState?.secrets ?? {},
        questions: {
          ...(r.gameState?.questions ?? {}),
          [targetPlayer]: [...(r.gameState?.questions?.[targetPlayer] ?? []), { text, yes }],
        },
        guesses: r.gameState?.guesses ?? {},
      },
    } : r),
  }));
}

export function addGuessWhoGuess(code: string, player: string, characterId: number) {
  update((s) => ({
    ...s,
    rooms: s.rooms.map((r) => {
      if (r.code !== code) return r;
      const secret = r.gameState?.secrets?.[player];
      const guess = { player, characterId, correct: secret === characterId };
      return {
        ...r,
        gameState: {
          secrets: r.gameState?.secrets ?? {},
          questions: r.gameState?.questions ?? {},
          guesses: { ...(r.gameState?.guesses ?? {}), [player]: [...(r.gameState?.guesses?.[player] ?? []), guess] },
        },
      };
    }),
  }));
}

export function setRoomStatus(code: string, status: Room["status"]) {
  update((s) => ({ ...s, rooms: s.rooms.map((r) => (r.code === code ? { ...r, status } : r)) }));
}

export function leaveRoom(code: string) {
  const me = current().nick;
  update((s) => ({
    ...s,
    rooms: s.rooms
      .map((r) => (r.code === code ? { ...r, players: r.players.filter((p) => p !== me), status: "waiting" as const } : r))
      .filter((r) => !(r.code === code && (r.players.length === 0 || r.host === me))),
  }));
}


export function recordWin(game: GameId) {
  update((s) => ({ ...s, wins: { ...s.wins, [game]: (s.wins[game] ?? 0) + 1 } }));
}

export function sendChat(text: string) {
  const me = ensureNick();
  const t = text.trim().slice(0, 240);
  if (!t) return;
  update((s) => ({ ...s, chat: [...s.chat, { id: `m${Date.now()}`, author: me, color: "paper" as const, text: t }].slice(-60) }));
}
