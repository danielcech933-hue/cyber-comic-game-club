import { normalize } from "./catalog";

export const SYLLABLES: Record<string, string[]> = {
  KO: ["kolo", "kočka", "okno", "sokol", "koleno", "koruna", "kotel"],
  PRA: ["praha", "prase", "pravda", "prak", "sprava", "prapor"],
  STA: ["stadion", "stan", "stavba", "starost", "sestava", "stáj"],
  MO: ["moře", "most", "motor", "domov", "model", "mokro"],
  LE: ["les", "letadlo", "lev", "lekce", "zelený", "lednička"],
  NA: ["nalevo", "banán", "nádraží", "malina", "nákup", "znak"],
  RO: ["roh", "robot", "rodina", "pivovar", "hora", "kroupa"],
  PI: ["pivo", "pila", "pirát", "lopata", "spirála", "pinpong"],
  VO: ["voda", "volno", "vojsko", "slovo", "vozík", "hovor"],
  TE: ["teplo", "telefon", "tenis", "kotel", "tečka", "město"],
};

export type WordCheck = "ok" | "short" | "missing" | "used" | "letters";
export function checkWord(word: string, syllable: string, used: string[]): WordCheck {
  const w = normalize(word);
  if (!/^[a-z]+$/.test(w)) return "letters";
  if (w.length < 3) return "short";
  if (!w.includes(normalize(syllable))) return "missing";
  if (used.includes(w)) return "used";
  return "ok";
}
export const LIVES = 2;
