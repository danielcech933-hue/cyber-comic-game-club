export type Hair = "blond" | "černé" | "zrzavé" | "holá";
export type Character = {
  id: number; name: string; hair: Hair; glasses: boolean; cap: boolean; beard: boolean; headband: boolean; jersey: "neon" | "pink";
};
export const CHARACTERS: Character[] = [
  { id: 0, name: "Ada", hair: "blond", glasses: true, cap: false, beard: false, headband: false, jersey: "neon" },
  { id: 1, name: "Boris", hair: "černé", glasses: false, cap: true, beard: true, headband: false, jersey: "pink" },
  { id: 2, name: "Cyril", hair: "holá", glasses: true, cap: false, beard: true, headband: false, jersey: "neon" },
  { id: 3, name: "Dana", hair: "zrzavé", glasses: false, cap: false, beard: false, headband: true, jersey: "pink" },
  { id: 4, name: "Emil", hair: "blond", glasses: false, cap: true, beard: false, headband: false, jersey: "neon" },
  { id: 5, name: "Fany", hair: "černé", glasses: true, cap: false, beard: false, headband: true, jersey: "neon" },
  { id: 6, name: "Gusta", hair: "zrzavé", glasses: false, cap: false, beard: true, headband: false, jersey: "neon" },
  { id: 7, name: "Hela", hair: "blond", glasses: false, cap: false, beard: false, headband: true, jersey: "pink" },
  { id: 8, name: "Igor", hair: "holá", glasses: false, cap: true, beard: false, headband: false, jersey: "pink" },
  { id: 9, name: "Jana", hair: "černé", glasses: false, cap: false, beard: false, headband: false, jersey: "pink" },
  { id: 10, name: "Kuba", hair: "zrzavé", glasses: true, cap: true, beard: false, headband: false, jersey: "pink" },
  { id: 11, name: "Lola", hair: "blond", glasses: true, cap: true, beard: false, headband: false, jersey: "pink" },
  { id: 12, name: "Mates", hair: "černé", glasses: false, cap: false, beard: true, headband: true, jersey: "neon" },
  { id: 13, name: "Nora", hair: "zrzavé", glasses: true, cap: false, beard: false, headband: false, jersey: "neon" },
  { id: 14, name: "Otto", hair: "holá", glasses: false, cap: false, beard: true, headband: false, jersey: "pink" },
  { id: 15, name: "Pája", hair: "blond", glasses: false, cap: false, beard: false, headband: false, jersey: "neon" },
];
export type MaskQuestion = { id: string; q: string; test: (c: Character) => boolean };
export const MASK_QUESTIONS: MaskQuestion[] = [
  { id: "glasses", q: "Má brýle?", test: (c) => c.glasses },
  { id: "cap", q: "Má kšiltovku?", test: (c) => c.cap },
  { id: "beard", q: "Má vousy?", test: (c) => c.beard },
  { id: "headband", q: "Má čelenku?", test: (c) => c.headband },
  { id: "blond", q: "Je blond?", test: (c) => c.hair === "blond" },
  { id: "black", q: "Má černé vlasy?", test: (c) => c.hair === "černé" },
  { id: "red", q: "Je zrzavý/á?", test: (c) => c.hair === "zrzavé" },
  { id: "bald", q: "Je holohlavý/á?", test: (c) => c.hair === "holá" },
  { id: "neon", q: "Má zelený dres?", test: (c) => c.jersey === "neon" },
];
export const MAX_QUESTIONS = 6;
