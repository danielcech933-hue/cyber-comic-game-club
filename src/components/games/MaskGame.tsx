import { useEffect, useRef, useState } from "react";
import { CHARACTERS, MASK_QUESTIONS, MAX_QUESTIONS, type Character } from "@/lib/games/mask";
import { Bubble, GameResult } from "./GameResult";

const HAIR: Record<Character["hair"], string> = {
  blond: "oklch(0.86 0.15 90)", "černé": "oklch(0.2 0.02 300)", "zrzavé": "oklch(0.65 0.18 45)", "holá": "transparent",
};

function Face({ c }: { c: Character }) {
  return (
    <svg viewBox="0 0 80 90" className="h-full w-full" aria-hidden>
      <rect x="18" y="66" width="44" height="24" rx="8" fill={c.jersey === "neon" ? "var(--neon)" : "var(--pink)"} />
      {c.hair !== "holá" && <ellipse cx="40" cy="30" rx="25" ry="22" fill={HAIR[c.hair]} />}
      <ellipse cx="40" cy="40" rx="20" ry="23" fill="oklch(0.85 0.05 60)" stroke="var(--ink)" strokeWidth="2" />
      {c.headband && <rect x="19" y="24" width="42" height="6" fill="var(--pink)" stroke="var(--ink)" strokeWidth="1.5" />}
      {c.cap && <path d="M18 28 Q40 4 62 28 L72 30 L18 30Z" fill="var(--violet)" stroke="var(--ink)" strokeWidth="2" />}
      <circle cx="32" cy="40" r="2.5" fill="var(--ink)" /><circle cx="48" cy="40" r="2.5" fill="var(--ink)" />
      {c.glasses && (<g fill="none" stroke="var(--ink)" strokeWidth="2.5"><circle cx="32" cy="40" r="6" /><circle cx="48" cy="40" r="6" /><path d="M38 40h4" /></g>)}
      {c.beard ? <path d="M24 46 Q40 72 56 46 Q48 56 40 56 Q32 56 24 46Z" fill={c.hair === "holá" ? "oklch(0.35 0.03 60)" : HAIR[c.hair]} stroke="var(--ink)" strokeWidth="1.5" />
        : <path d="M33 52 Q40 57 47 52" stroke="var(--ink)" strokeWidth="2" fill="none" />}
    </svg>
  );
}

export function MaskGame({ opponent, onWin }: { opponent: string; onWin: () => void }) {
  const [secret, setSecret] = useState(() => Math.floor(Math.random() * CHARACTERS.length));
  const [down, setDown] = useState<Set<number>>(new Set());
  const [asked, setAsked] = useState<{ q: string; yes: boolean }[]>([]);
  const [guessing, setGuessing] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<null | { won: boolean; guess: number }>(null);
  const reported = useRef(false);
  const target = CHARACTERS[secret]!;
  const left = MAX_QUESTIONS - asked.length;

  useEffect(() => { if (result?.won && !reported.current) { reported.current = true; onWin(); } }, [result, onWin]);

  const ask = (id: string) => {
    const q = MASK_QUESTIONS.find((x) => x.id === id);
    if (!q || left <= 0 || thinking) return;
    setThinking(true);
    setTimeout(() => { setAsked((a) => [...a, { q: q.q, yes: q.test(target) }]); setThinking(false); }, 700);
  };
  const autoFlip = () => {
    const keep = (c: Character) => asked.every((a) => {
      const q = MASK_QUESTIONS.find((x) => x.q === a.q);
      return q ? q.test(c) === a.yes : true;
    });
    setDown(new Set(CHARACTERS.filter((c) => !keep(c)).map((c) => c.id)));
  };
  const clickCard = (id: number) => {
    if (result) return;
    if (guessing) { setResult({ won: id === secret, guess: id }); setGuessing(false); return; }
    setDown((d) => { const n = new Set(d); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };
  const askedIds = new Set(asked.map((a) => a.q));

  return (
    <div className="relative grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="border-2 border-pink bg-ink p-3 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="font-display text-2xl">KDO JE <span className="text-pink">MASKA</span> HRÁČE {opponent.toUpperCase()}?</p>
          {guessing && <p className="animate-pulse font-display text-xl text-pink">KLIKNI NA SVŮJ TIP!</p>}
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {CHARACTERS.map((c) => {
            const isDown = down.has(c.id);
            return (
              <button key={c.id} type="button" onClick={() => clickCard(c.id)} aria-pressed={isDown} aria-label={`${c.name}${isDown ? " (sklopeno)" : ""}`}
                className="group aspect-[3/4] [perspective:600px]">
                <div className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${isDown ? "[transform:rotateY(180deg)]" : ""}`}>
                  <div className={`absolute inset-0 flex flex-col border-2 bg-noir p-1 [backface-visibility:hidden] ${guessing ? "border-pink" : "border-neon/60 group-hover:border-neon"}`}>
                    <div className="min-h-0 flex-1"><Face c={c} /></div>
                    <p className="bg-paper text-center font-display text-sm text-ink sm:text-lg">{c.name}</p>
                  </div>
                  <div className="hatch absolute inset-0 grid place-items-center border-2 border-paper/20 bg-violet [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <span className="font-display text-3xl text-paper/40">✕</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-2 border-paper/15 bg-noir p-4">
        <div className="flex items-center justify-between">
          <p className="font-display text-2xl tracking-wide">OTÁZKY</p>
          <p className="font-display text-xl text-pink">{left} ZBÝVÁ</p>
        </div>
        <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
          {asked.length === 0 && <Bubble tone="paper">Zeptej se na cokoliv z nabídky. Mám jen {MAX_QUESTIONS} odpovědí!</Bubble>}
          {asked.map((a, i) => (
            <div key={i} className="grid gap-1">
              <p className="ml-auto w-fit rounded-2xl rounded-br-none bg-neon px-3 py-1.5 text-sm font-semibold text-ink">{a.q}</p>
              <Bubble tone={a.yes ? "paper" : "pink"}>{a.yes ? "ANO!" : "NE."}</Bubble>
            </div>
          ))}
          {thinking && <Bubble tone="paper">…</Bubble>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MASK_QUESTIONS.map((q) => (
            <button key={q.id} type="button" disabled={left <= 0 || thinking || askedIds.has(q.q) || !!result} onClick={() => ask(q.id)}
              className="rounded-full border border-paper/25 px-3 py-1 text-xs font-semibold hover:border-neon hover:text-neon disabled:opacity-30">{q.q}</button>
          ))}
        </div>
        <button type="button" disabled={asked.length === 0} onClick={autoFlip} className="text-left text-xs font-semibold text-neon underline-offset-2 hover:underline disabled:opacity-40">
          Sklopit kartičky, které nesedí
        </button>
        <button type="button" onClick={() => setGuessing((x) => !x)} disabled={!!result}
          className={`cut-btn mt-auto py-3 font-display text-3xl tracking-wider ${guessing ? "bg-paper text-ink" : "bg-pink text-ink hover:bg-paper"}`}>
          {guessing ? "ZRUŠIT TIP" : "VYZVAT — TIPNOUT!"}
        </button>
      </div>
      {result && (
        <GameResult won={result.won} detail={result.won ? `Maska padla: byl/a to ${target.name}.` : `Vedle! Tajná postava byla ${target.name}.`}
          onRematch={() => { setSecret(Math.floor(Math.random() * CHARACTERS.length)); setDown(new Set()); setAsked([]); setResult(null); reported.current = false; }} />
      )}
    </div>
  );
}
