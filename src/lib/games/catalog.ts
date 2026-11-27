export type GameId = "az" | "mask" | "slova";

export const GAMES: Record<
  GameId,
  { id: GameId; title: string; tag: string; blurb: string; minPlayers: number; maxPlayers: number }
> = {
  az: { id: "az", title: "AZ KVÍZ", tag: "NEO-GRID", blurb: "Obsaď pyramidu a propoj všechny tři strany.", minPlayers: 2, maxPlayers: 2 },
  mask: { id: "mask", title: "HÁDEJ KDO", tag: "// MASK", blurb: "Ptej se, sklápěj kartičky a odhal tajnou postavu.", minPlayers: 2, maxPlayers: 2 },
  slova: { id: "slova", title: "ŠÍLENÁ SLOVA", tag: "BOMBA", blurb: "Napiš slovo se slabikou, než bomba bouchne.", minPlayers: 2, maxPlayers: 6 },
};

export const GAME_LIST = Object.values(GAMES);

export function roomsLabel(n: number, game: GameId) {
  if (game === "az") {
    if (n === 1) return "1 OTEVŘENÁ MÍSTNOST";
    if (n >= 2 && n <= 4) return `${n} OTEVŘENÉ MÍSTNOSTI`;
    return `${n} OTEVŘENÝCH MÍSTNOSTÍ`;
  }
  if (n === 1) return "1 MÍSTNOST";
  if (n >= 2 && n <= 4) return `${n} MÍSTNOSTI`;
  return `${n} MÍSTNOSTÍ`;
}

export function normalize(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
}
