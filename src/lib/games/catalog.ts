export type GameId = "guess-who";

export const GAMES: Record<GameId, {
  id: GameId;
  title: string;
  tag: string;
  blurb: string;
  minPlayers: number;
  maxPlayers: number;
}> = {
  "guess-who": {
    id: "guess-who",
    title: "HÁDEJ KDO",
    tag: "// GUESS WHO",
    blurb: "Každý si vybere tajnou postavu. Ptej se, vyřazuj a uhodni postavy ostatních hráčů.",
    minPlayers: 2,
    maxPlayers: 8,
  },
};

export const GAME_LIST = Object.values(GAMES);

export function roomsLabel(n: number, _game: GameId) {
  if (n === 0) return "ZATÍM ŽÁDNÁ MÍSTNOST";
  if (n === 1) return "1 OTEVŘENÁ MÍSTNOST";
  if (n >= 2 && n <= 4) return `${n} OTEVŘENÉ MÍSTNOSTI`;
  return `${n} OTEVŘENÝCH MÍSTNOSTÍ`;
}

export function normalize(s: string) {
  return s.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().trim().replace(/\\s+/g, " ");
}
