import { useEffect, useRef, useState } from "react";
import { LIVES, SYLLABLES, checkWord } from "@/lib/games/slova";
import { normalize } from "@/lib/games/catalog";
import { Bubble, GameResult } from "./GameResult";

const SYL = Object.keys(SYLLABLES);
const pickSyl = () => SYL[Math.floor(Math.random() * SYL.length)] ?? "KO";
const fuse = () => 7000 + Math.random() * 5000;
const ERR: Record<string, string> = {
  short: "Aspoň 3 písmena!", missing: "Chybí slabika!", used: "Už padlo!", letters: "Jen písmena, bez mezer.",
};

export function SlovaGame({ me, players, onWin }: { me: string; players: string[]; onWin: () => void }) {
  const init = () => ({
    lives: Object.fromEntries(players.map((p) => [p, LIVES])) as Record<string, number>,
    turn: 0, syl: pickSyl(), deadline: Date.now() + fuse(), total: 0, used: [] as string[],
  });
  const [s, setS] = useState(() => { const x = init(); return { ...x, total: x.deadline - Date.now() }; });
  const [now, setNow] = useState(Date.now());
  const [word, setWord] = useState("");
  const [err, setErr] = useState("");
  const [log, setLog] = useState<{ who: string; text: string; boom?: boolean }[]>([]);
  const reported = useRef(false);

  const alive = players.filter((p) => (s.lives[p] ?? 0) > 0);
  const current = players[s.turn] ?? me;
  const winner = alive.length === 1 ? alive[0] : null;
  const iAmOut = (s.lives[me] ?? 0) <= 0;

  function nextTurn(from: number, lives: Record<string, number>) {
    for (let k = 1; k <= players.length; k++) {
      const i = (from + k) % players.length;
      if ((lives[players[i] ?? ""] ?? 0) > 0) return i;
    }
    return from;
  }
  function pass(validWord: string) {
    setLog((l) => [...l.slice(-6), { who: current, text: validWord.toUpperCase() }]);
    setS((x) => {
      const f = fuse();
      return { ...x, used: [...x.used, normalize(validWord)], turn: nextTurn(x.turn, x.lives), syl: pickSyl(), deadline: Date.now() + f, total: f };
    });
  }

  useEffect(() => {
    if (winner) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [winner]);

  // explosion
  useEffect(() => {
    if (winner || now < s.deadline) return;
    setLog((l) => [...l.slice(-6), { who: current, text: "BUM! 💥", boom: true }]);
    setS((x) => {
      const lives = { ...x.lives, [current]: (x.lives[current] ?? 1) - 1 };
      const f = fuse();
      return { ...x, lives, turn: nextTurn(x.turn, lives), syl: pickSyl(), deadline: Date.now() + f, total: f };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  // bot turn
  useEffect(() => {
    if (winner || current === me) return;
    const t = setTimeout(() => {
      const options = (SYLLABLES[s.syl] ?? []).filter((w) => checkWord(w, s.syl, s.used) === "ok");
      const w = options[Math.floor(Math.random() * options.length)];
      if (w && Math.random() < 0.8) pass(w);
    }, 1200 + Math.random() * 3500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.turn, s.syl, winner]);

  useEffect(() => { if (winner === me && !reported.current) { reported.current = true; onWin(); } }, [winner, me, onWin]);

  const submit = () => {
    if (current !== me) return;
    const res = checkWord(word, s.syl, s.used);
    if (res !== "ok") return setErr(ERR[res] ?? "");
    setErr(""); setWord(""); pass(word.trim());
  };
  const pct = Math.max(0, Math.min(100, ((s.deadline - now) / (s.total || 1)) * 100));

  return (
    <div className="relative grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="hatch flex flex-col items-center gap-5 border-2 border-paper/30 bg-violet p-5 sm:p-8">
        <div className="flex flex-wrap justify-center gap-2">
          {players.map((p, i) => {
            const l = s.lives[p] ?? 0;
            return (
              <div key={p} className={`border-2 px-3 py-1.5 text-center ${i === s.turn && !winner ? "border-neon bg-neon/15" : "border-paper/20"} ${l <= 0 ? "opacity-30 line-through" : ""}`}>
                <p className="font-display text-lg leading-none">{p === me ? `${p} (TY)` : p}</p>
                <p className="text-sm text-pink">{"♥".repeat(Math.max(l, 0)) || "—"}</p>
              </div>
            );
          })}
        </div>
        <div className="comic-shadow rotate-[-4deg] rounded-[28px] bg-paper px-8 py-4 text-center font-display text-ink">
          <p className="text-lg">SLABIKA</p>
          <p className="text-7xl leading-none tracking-widest">{s.syl}</p>
        </div>
        <div className="w-full max-w-md">
          <div className="h-3 w-full bg-ink"><div className={`h-full transition-[width] duration-100 ${pct < 30 ? "laser bg-pink" : "bg-neon"}`} style={{ width: `${pct}%` }} /></div>
          <p className="mt-2 text-center font-display text-2xl">{current === me ? "TVŮJ TAH — PIŠ!" : `${current.toUpperCase()} PÍŠE…`}</p>
        </div>
        <form className="grid w-full max-w-md gap-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <input value={word} onChange={(e) => { setWord(e.target.value); setErr(""); }} disabled={current !== me || iAmOut || !!winner}
            placeholder={iAmOut ? "Vypadl/a jsi, fandi ostatním" : current === me ? `Slovo se slabikou ${s.syl}…` : "Počkej na svůj tah…"} aria-label="Slovo"
            autoFocus className="rounded-full border border-paper/30 bg-ink px-5 py-3 text-lg text-paper focus:border-neon focus:outline-none disabled:opacity-50" />
          {err && <p className="text-center text-sm font-semibold text-pink">{err}</p>}
        </form>
      </div>
      <div className="flex flex-col gap-3 border-2 border-paper/15 bg-noir p-4">
        <p className="font-display text-2xl tracking-wide">AKCE</p>
        {log.length === 0 && <Bubble>Kdo zaváhá, nepíše! Napiš slovo, které obsahuje slabiku.</Bubble>}
        {log.map((l, i) => (
          <div key={i} className="grid gap-0.5">
            <span className="text-xs text-paper/50">{l.who}</span>
            <Bubble tone={l.boom ? "pink" : l.who === me ? "neon" : "paper"}>{l.text}</Bubble>
          </div>
        ))}
      </div>
      {winner && (
        <GameResult won={winner === me} detail={winner === me ? "Přežil/a jsi všechny výbuchy." : `Poslední přeživší: ${winner}.`}
          onRematch={() => { const x = init(); setS({ ...x, total: x.deadline - Date.now() }); setLog([]); reported.current = false; }} />
      )}
    </div>
  );
}
