export const ROWS = 7;
export const CELL_COUNT = (ROWS * (ROWS + 1)) / 2; // 28

export function idx(r: number, c: number) {
  return (r * (r + 1)) / 2 + c;
}
export function pos(i: number): [number, number] {
  let r = 0;
  while (idx(r + 1, 0) <= i) r++;
  return [r, i - idx(r, 0)];
}
export function neighbors(i: number): number[] {
  const [r, c] = pos(i);
  const cand: [number, number][] = [[r, c - 1], [r, c + 1], [r - 1, c - 1], [r - 1, c], [r + 1, c], [r + 1, c + 1]];
  return cand.filter(([rr, cc]) => rr >= 0 && rr < ROWS && cc >= 0 && cc <= rr).map(([rr, cc]) => idx(rr, cc));
}

/** True when one connected group of owned cells touches the left, right and bottom side. */
export function hasWon(owned: Set<number>): boolean {
  const seen = new Set<number>();
  for (const start of owned) {
    if (seen.has(start)) continue;
    let left = false, right = false, bottom = false;
    const stack = [start];
    seen.add(start);
    while (stack.length) {
      const cur = stack.pop()!;
      const [r, c] = pos(cur);
      if (c === 0) left = true;
      if (c === r) right = true;
      if (r === ROWS - 1) bottom = true;
      for (const n of neighbors(cur)) if (owned.has(n) && !seen.has(n)) { seen.add(n); stack.push(n); }
    }
    if (left && right && bottom) return true;
  }
  return false;
}

export type AzQuestion = { q: string; a: string[] };
export const QUESTIONS: AzQuestion[] = [
  { q: "Hlavní město Slovenska?", a: ["bratislava"] },
  { q: "Nejvyšší hora Česka?", a: ["snezka"] },
  { q: "Kolik hráčů má fotbalový tým na hřišti?", a: ["11", "jedenact"] },
  { q: "Který chmel je nejslavnější český aromatický?", a: ["zatecky", "zatecky chmel", "saaz"] },
  { q: "Ve kterém sportu se hraje o Stanley Cup?", a: ["hokej", "lední hokej"] },
  { q: "Kolik stran má šestiúhelník?", a: ["6", "sest"] },
  { q: "Nejdelší řeka Česka?", a: ["vltava"] },
  { q: "Jak se jmenuje krtek z večerníčku? (jedno slovo)", a: ["krtek", "krtecek"] },
  { q: "Chemická značka zlata?", a: ["au"] },
  { q: "Kolik minut trvá třetina v hokeji?", a: ["20", "dvacet"] },
  { q: "Planeta nejblíže Slunci?", a: ["merkur"] },
  { q: "Hlavní město Rakouska?", a: ["viden"] },
  { q: "Kolik kostek tvoří jeden domino set double-six?", a: ["28", "dvacet osm"] },
  { q: "Jakou barvu má na semaforu pokyn stůj?", a: ["cervena", "cervenou"] },
  { q: "Kolik je 7 × 8?", a: ["56"] },
  { q: "Které město je známé Plzeňským prazdrojem?", a: ["plzen"] },
  { q: "Jak se nazývá míč v badmintonu?", a: ["kosik", "kosicek", "letajici kosik"] },
  { q: "Ve kterém roce začala sametová revoluce?", a: ["1989"] },
  { q: "Kolik nohou má pavouk?", a: ["8", "osm"] },
  { q: "Hlavní město Itálie?", a: ["rim"] },
  { q: "Jak se jmenuje nejvyšší šachová figura?", a: ["kral"] },
  { q: "Kolik bodů je touchdown v americkém fotbale?", a: ["6", "sest"] },
  { q: "Které zvíře je symbolem Česka ve znaku?", a: ["lev"] },
  { q: "Kolik dní má přestupný rok?", a: ["366"] },
  { q: "Jak se česky řekne 'computer'?", a: ["pocitac"] },
  { q: "Největší oceán světa?", a: ["tichy", "tichy ocean", "pacifik"] },
  { q: "Kolik je kruhů na olympijské vlajce?", a: ["5", "pet"] },
  { q: "Hlavní surovina piva vedle chmele a vody?", a: ["slad", "jecmen"] },
  { q: "Kolik sekund má jedna minuta?", a: ["60", "sedesat"] },
  { q: "Jak se jmenuje hrad nad Prahou?", a: ["prazsky hrad", "hradcany"] },
  { q: "Kolik setů je potřeba na výhru v tenise na grandslamu u mužů?", a: ["3", "tri"] },
  { q: "Kdo napsal Babičku? (příjmení)", a: ["nemcova"] },
];
export type YesNo = { q: string; a: boolean };
export const YES_NO: YesNo[] = [
  { q: "Je Brno větší než Ostrava?", a: true },
  { q: "Má včela osm nohou?", a: false },
  { q: "Je Mount Everest vyšší než 8 000 m?", a: true },
  { q: "Hraje se basketbal s pukem?", a: false },
  { q: "Je Praha na Vltavě?", a: true },
  { q: "Je delfín ryba?", a: false },
  { q: "Má rok 12 měsíců?", a: true },
  { q: "Je Slunce planeta?", a: false },
  { q: "Vaří voda při 100 °C za normálního tlaku?", a: true },
  { q: "Je Austrálie v Evropě?", a: false },
];

const LETTERS = "ABCČDEFGHIJKLMNOPRŘSŠTUVZŽ";
export function cellLabel(i: number) {
  return LETTERS[i % LETTERS.length] ?? String(i + 1);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
