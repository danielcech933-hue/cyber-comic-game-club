import { useEffect, useRef, useState } from "react";
import { CELL_COUNT, QUESTIONS, YES_NO, ROWS, cellLabel, hasWon, neighbors, pos, shuffle } from "@/lib/games/azkviz";
import { normalize } from "@/lib/games/catalog";
import { Bubble, GameResult } from "./GameResult";

type Owner = null | "me" | "cpu" | "grey";
const TIME = 25;

function newGame() {
  return { owners: Array<Owner>(CELL_COUNT).fill(null), qs: shuffle(QUESTIONS), yn: shuffle(YES_NO), qi: 0, yi: 0 };
}

export function AzKvizGame({ me, opponent, onWin }: { me: string; opponent: string; onWin: () => void }) {
  const [g, setG] = useState(newGame);
  const [turn, setTurn] = useState<"me" | "cpu">("me");
  const [active, setActive] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");
  const [left, setLeft] = useState(TIME);
  const [log, setLog] = useState<{ text: string; tone: "paper" | "pink" | "neon" }>({ text: `Začínáš ty, ${me}. Vyber políčko.`, tone: "neon" });
  const [winner, setWinner] = useState<"me" | "cpu" | null>(null);
  const reported = useRef(false);

  const isGrey = active !== null && g.owners[active] === "grey";
  const question = active === null ? null : isGrey ? g.yn[g.yi % g.yn.length] : g.qs[g.qi % g.qs.length];

  function resolve(cell: number, who: "me" | "cpu", correct: boolean, grey: boolean, shown: string) {
    const other = who === "me" ? "cpu" : "me";
    const owners = [...g.owners];
    owners[cell] = correct ? who : grey ? other : "grey";
    setG((x) => ({ ...x, owners, qi: grey ? x.qi : x.qi + 1, yi: grey ? x.yi + 1 : x.yi }));
    setActive(null);
    setAnswer("");
    const name = who === "me" ? "Ty" : opponent;
    setLog({ text: `${name}: ${correct ? "SPRÁVNĚ!" : `VEDLE! (${shown})`}`, tone: correct ? "neon" : "pink" });
    const mine = new Set(owners.flatMap((o, i) => (o === "me" ? [i] : [])));
    const theirs = new Set(owners.flatMap((o, i) => (o === "cpu" ? [i] : [])));
    if (hasWon(mine)) return setWinner("me");
    if (hasWon(theirs)) return setWinner("cpu");
    setTurn(other);
  }

  // answer timer for my question
  useEffect(() => {
    if (active === null || turn !== "me" || winner) return;
    setLeft(TIME);
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, [active, turn, winner]);
  useEffect(() => {
    if (left <= 0 && active !== null && turn === "me" && question) {
      resolve(active, "me", false, isGrey, "čas vypršel");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  // CPU turn
  useEffect(() => {
    if (turn !== "cpu" || winner) return;
    const t1 = setTimeout(() => {
      const free = g.owners.flatMap((o, i) => (o === null || o === "grey" ? [i] : []));
      const near = free.filter((i) => neighbors(i).some((n) => g.owners[n] === "cpu"));
      const pool = near.length && Math.random() < 0.75 ? near : free;
      const cell = pool[Math.floor(Math.random() * pool.length)];
      if (cell === undefined) return;
      setActive(cell);
      setLog({ text: `${opponent} vybírá ${cellLabel(cell)} a přemýšlí…`, tone: "paper" });
      setTimeout(() => {
        const grey = g.owners[cell] === "grey";
        const ok = Math.random() < (grey ? 0.7 : 0.55);
        const q = grey ? g.yn[g.yi % g.yn.length] : g.qs[g.qi % g.qs.length];
        const shown = q ? ("a" in q && Array.isArray(q.a) ? (q.a[0] ?? "") : "") : "";
        resolve(cell, "cpu", ok, grey, shown || "špatně");
      }, 1800);
    }, 1000);
    return () => clearTimeout(t1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, winner]);

  useEffect(() => {
    if (winner === "me" && !reported.current) { reported.current = true; onWin(); }
  }, [winner, onWin]);

  const submitText = () => {
    if (active === null || !question || isGrey) return;
    const q = QUESTIONS.includes(question as (typeof QUESTIONS)[number]) ? (question as (typeof QUESTIONS)[number]) : null;
    if (!q) return;
    const ok = q.a.some((a) => normalize(a) === normalize(answer));
    resolve(active, "me", ok, false, q.a[0] ?? "");
  };
  const submitYN = (v: boolean) => {
    if (active === null || !question || !isGrey) return;
    const q = question as (typeof YES_NO)[number];
    resolve(active, "me", q.a === v, true, q.a ? "ANO" : "NE");
  };

  const R = 24, DX = 56, DY = 48, W = DX * ROWS + 20, H = DY * ROWS + 20;
  return (
    <div className="relative grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="dots relative border-2 border-neon bg-noir p-3 sm:p-6">
        <div className="mb-2 flex items-center justify-between font-display text-xl tracking-wide">
          <span className="text-neon">● {me}</span>
          <span className={turn === "me" ? "text-neon" : "text-pink"}>{turn === "me" ? "TVŮJ TAH" : "TAH SOUPEŘE"}</span>
          <span className="text-pink">{opponent} ●</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[520px]" role="group" aria-label="Herní pyramida">
          {g.owners.map((o, i) => {
            const [r, c] = pos(i);
            const x = W / 2 + (c - r / 2) * DX, y = R + 6 + r * DY;
            const clickable = turn === "me" && active === null && !winner && (o === null || o === "grey");
            const fill = o === "me" ? "var(--neon)" : o === "cpu" ? "var(--pink)" : o === "grey" ? "var(--muted-foreground)" : "transparent";
            return (
              <g key={i} onClick={() => clickable && setActive(i)} className={clickable ? "cursor-pointer" : ""} role="button" aria-label={`Políčko ${cellLabel(i)}`}>
                <circle cx={x} cy={y} r={R} fill={fill} stroke={active === i ? "var(--paper)" : o === "cpu" ? "var(--pink)" : "var(--neon)"} strokeWidth={active === i ? 4 : 2}
                  className={clickable ? "transition-opacity hover:opacity-70" : ""} />
                <text x={x} y={y + 7} textAnchor="middle" fontFamily="Bangers" fontSize="20" fill={o && o !== "grey" ? "var(--ink)" : "var(--paper)"}>{cellLabel(i)}</text>
              </g>
            );
          })}
        </svg>
        <p className="mt-2 text-center text-xs text-paper/60">Propoj levou, pravou i spodní stranu pyramidy. Šedé políčko = otázka ANO/NE.</p>
      </div>

      <div className="flex flex-col gap-3 border-2 border-paper/15 bg-noir p-4">
        <p className="font-display text-2xl tracking-wide">OTÁZKA</p>
        <Bubble tone={log.tone}>{log.text}</Bubble>
        {active !== null && turn === "me" && question && (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-3xl text-neon">{cellLabel(active)}</span>
              <span className={`font-display text-2xl ${left <= 5 ? "text-pink" : "text-paper"}`}>{left}s</span>
            </div>
            <p className="rounded-[20px] bg-paper px-4 py-3 font-semibold text-ink">{question.q}</p>
            {isGrey ? (
              <div className="flex gap-2">
                <button type="button" onClick={() => submitYN(true)} className="cut-btn flex-1 bg-neon py-2 font-display text-2xl text-ink">ANO</button>
                <button type="button" onClick={() => submitYN(false)} className="cut-btn flex-1 bg-pink py-2 font-display text-2xl text-ink">NE</button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); submitText(); }} className="grid gap-2">
                <input autoFocus value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Tvoje odpověď…" aria-label="Odpověď"
                  className="rounded-full border border-paper/20 bg-ink px-4 py-2.5 text-paper focus:border-neon focus:outline-none" />
                <button type="submit" disabled={!answer.trim()} className="cut-btn bg-neon py-2 font-display text-2xl text-ink disabled:opacity-40">ODPOVĚDĚT</button>
              </form>
            )}
          </div>
        )}
        {active === null && turn === "me" && !winner && <p className="text-sm text-paper/60">Klikni na volné políčko v pyramidě.</p>}
      </div>
      {winner && (
        <GameResult won={winner === "me"} detail={winner === "me" ? "Pyramida je tvoje." : `${opponent} propojil všechny strany.`}
          onRematch={() => { setG(newGame()); setTurn("me"); setWinner(null); setActive(null); reported.current = false; setLog({ text: "Nová hra! Vyber políčko.", tone: "neon" }); }} />
      )}
    </div>
  );
}
