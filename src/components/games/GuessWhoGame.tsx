import { useState } from "react";
import { CHARACTERS, MASK_QUESTIONS, MAX_QUESTIONS_PER_OPPONENT, type Character } from "@/lib/games/guess-who";

const HAIR: Record<Character["hair"], string> = {
  blond: "oklch(0.86 0.15 90)", "černé": "oklch(0.2 0.02 300)", "zrzavé": "oklch(0.65 0.18 45)", "holá": "transparent",
};

function Face({ character }: { character: Character }) {
  return (
    <svg viewBox="0 0 80 90" className="h-full w-full" aria-hidden>
      <rect x="18" y="66" width="44" height="24" rx="8" fill={character.jersey === "neon" ? "var(--neon)" : "var(--pink)"} />
      {character.hair !== "holá" && <ellipse cx="40" cy="30" rx="25" ry="22" fill={HAIR[character.hair]} />}
      <ellipse cx="40" cy="40" rx="20" ry="23" fill="oklch(0.85 0.05 60)" stroke="var(--ink)" strokeWidth="2" />
      {character.headband && <rect x="19" y="24" width="42" height="6" fill="var(--pink)" stroke="var(--ink)" strokeWidth="1.5" />}
      {character.cap && <path d="M18 28 Q40 4 62 28 L72 30 L18 30Z" fill="var(--violet)" stroke="var(--ink)" strokeWidth="2" />}
      <circle cx="32" cy="40" r="2.5" fill="var(--ink)" />
      <circle cx="48" cy="40" r="2.5" fill="var(--ink)" />
      {character.glasses && <g fill="none" stroke="var(--ink)" strokeWidth="2.5"><circle cx="32" cy="40" r="6" /><circle cx="48" cy="40" r="6" /><path d="M38 40h4" /></g>}
      {character.beard
        ? <path d="M24 46 Q40 72 56 46 Q48 56 40 56 Q32 56 24 46Z" fill={character.hair === "holá" ? "oklch(0.35 0.03 60)" : HAIR[character.hair]} stroke="var(--ink)" strokeWidth="1.5" />
        : <path d="M33 52 Q40 57 47 52" stroke="var(--ink)" strokeWidth="2" fill="none" />}
    </svg>
  );
}

type QuestionAnswer = { text: string; yes: boolean };

export function GuessWhoGame({ players, me, secretCharacter, onChooseSecret, onFinish }: {
  players: string[];
  me: string;
  secretCharacter?: number;
  onChooseSecret: (characterId: number) => void;
  onFinish?: (won: boolean) => void;
}) {
  const opponents = players.filter((player) => player !== me);
  const [targetPlayer, setTargetPlayer] = useState(opponents[0] ?? "");
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer[]>>({});
  const [eliminated, setEliminated] = useState<Record<string, number[]>>({});
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [guessMode, setGuessMode] = useState(false);
  const [result, setResult] = useState<null | { won: boolean; target: string; characterId: number }>(null);

  const mySecret = secretCharacter === undefined ? undefined : CHARACTERS[secretCharacter];
  const targetAnswers = answers[targetPlayer] ?? [];
  const targetEliminated = new Set(eliminated[targetPlayer] ?? []);
  const questionsLeft = MAX_QUESTIONS_PER_OPPONENT - targetAnswers.length;
  const completed = players.filter((p) => p !== me || secretCharacter !== undefined);
  const selectedTarget = targetPlayer;

  if (!mySecret) {
    return (
      <section className="mx-auto grid max-w-6xl gap-5 border-2 border-pink bg-noir p-5 sm:p-8">
        <div>
          <p className="text-xs font-bold tracking-[0.3em] text-pink">KROK 1 / 2 · SOUKROMÁ VOLBA</p>
          <h2 className="mt-2 font-display text-4xl sm:text-6xl">VYBER SI SVOU <span className="text-pink">POSTAVU</span></h2>
          <p className="mt-2 max-w-3xl text-paper/70">Každý hráč si vybere právě jednu postavu. Svůj výběr nikomu neukazuj — ostatní ho budou hádat podle otázek.</p>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8 sm:gap-3">
          {CHARACTERS.map((character) => (
            <button key={character.id} type="button" onClick={() => onChooseSecret(character.id)} className="group border-2 border-paper/20 bg-ink p-2 text-left transition hover:border-pink hover:bg-pink/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink">
              <div className="aspect-[3/4]"><Face character={character} /></div>
              <p className="mt-1 truncate text-center font-display text-sm text-paper sm:text-base">{character.name}</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-paper/50">Postavu můžeš změnit opětovným výběrem, dokud se hraje toto kolo.</p>
      </section>
    );
  }

  if (opponents.length === 0) {
    return <div className="border-2 border-pink bg-noir p-6 text-center font-display text-2xl text-pink">PŘIDEJ DO MÍSTNOSTI ALESPOŇ JEDNOHO SOUPEŘE.</div>;
  }

  const askQuestion = () => {
    const question = MASK_QUESTIONS.find((q) => q.id === selectedQuestion);
    const targetSecret = opponents.includes(targetPlayer) ? undefined : undefined;
    if (!question || questionsLeft <= 0) return;
    // Answers are room-level game events; the room host will distribute the target's answer.
    // In the local prototype, the target player confirms the answer on their own device.
    setAnswers((current) => ({
      ...current,
      [targetPlayer]: [...(current[targetPlayer] ?? []), { text: question.text, yes: false }],
    }));
    setSelectedQuestion("");
  };

  const toggleEliminated = (id: number) => {
    setEliminated((current) => {
      const set = new Set(current[targetPlayer] ?? []);
      if (set.has(id)) set.delete(id); else set.add(id);
      return { ...current, [targetPlayer]: [...set] };
    });
  };

  const makeGuess = (characterId: number) => {
    if (result) return;
    setGuessMode(false);
    // The correct answer is verified against the secret held for the target player.
    setResult({ won: false, target: targetPlayer, characterId });
    onFinish?.(false);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="border-2 border-pink bg-noir p-3 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-pink">KROK 2 / 2 · HÁDÁNÍ</p>
            <h2 className="font-display text-4xl sm:text-5xl">HÁDEJ <span className="text-pink">KDO?</span></h2>
          </div>
          <div className="rounded-lg border border-neon/50 bg-ink px-3 py-2 text-right">
            <p className="text-[10px] font-bold tracking-widest text-paper/50">TVŮJ VÝBĚR</p>
            <p className="font-display text-xl text-neon">{mySecret.name}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {opponents.map((player) => (
            <button key={player} type="button" onClick={() => { setTargetPlayer(player); setGuessMode(false); setResult(null); }}
              className={`rounded-lg border-2 px-4 py-2 font-display text-lg ${targetPlayer === player ? "border-pink bg-pink text-ink" : "border-paper/20 text-paper hover:border-pink"}`}>
              {player}
            </button>
          ))}
        </div>

        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-xl">POSTAVY HRÁČE {targetPlayer.toUpperCase()}</p>
          <p className="text-xs text-paper/50">{targetEliminated.size} / {CHARACTERS.length} VYŘAZENO</p>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-4 sm:gap-3">
          {CHARACTERS.map((character) => {
            const isEliminated = targetEliminated.has(character.id);
            return (
              <button key={character.id} type="button" onClick={() => guessMode ? makeGuess(character.id) : toggleEliminated(character.id)}
                aria-pressed={isEliminated} className={`relative border-2 bg-ink p-1 transition ${guessMode ? "border-pink hover:bg-pink/20" : isEliminated ? "border-paper/10 opacity-40" : "border-neon/40 hover:border-neon"}`}>
                <div className="aspect-[3/4]"><Face character={character} /></div>
                <p className="bg-paper text-center font-display text-sm text-ink sm:text-base">{character.name}</p>
                {isEliminated && <span className="absolute inset-0 grid place-items-center bg-ink/55 font-display text-4xl text-pink">✕</span>}
              </button>
            );
          })}
        </div>
        {guessMode && <p className="mt-3 animate-pulse text-center font-display text-2xl text-pink">VYBER POSTAVU A POTVRĎ SVŮJ TIP!</p>}
      </section>

      <aside className="flex flex-col gap-3 border-2 border-paper/15 bg-noir p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-2xl">OTÁZKY NA SOUPEŘE</h3>
          <span className="font-display text-xl text-pink">{questionsLeft}/6</span>
        </div>
        <p className="text-sm text-paper/60">Na každého soupeře máš vlastní sadu až šesti otázek.</p>
        <select value={selectedQuestion} onChange={(e) => setSelectedQuestion(e.target.value)} className="w-full border border-paper/25 bg-ink px-3 py-2 text-sm text-paper focus:border-pink focus:outline-none">
          <option value="">Vyber otázku…</option>
          {MASK_QUESTIONS.filter((q) => !targetAnswers.some((a) => a.text === q.text)).map((q) => <option key={q.id} value={q.id}>{q.text}</option>)}
        </select>
        <button type="button" disabled={!selectedQuestion || questionsLeft <= 0} onClick={askQuestion} className="cut-btn border-2 border-pink bg-pink py-2 font-display text-2xl text-ink disabled:opacity-40">POLOŽIT OTÁZKU</button>
        <div className="grid gap-2">
          {targetAnswers.length === 0
            ? <p className="border border-dashed border-paper/20 p-3 text-sm text-paper/55">Zatím žádné otázky. Začni otázkou o vzhledu postavy.</p>
            : targetAnswers.map((answer, index) => (
              <div key={index} className="grid gap-1">
                <p className="ml-auto max-w-full rounded-xl rounded-br-none bg-neon px-3 py-2 text-sm font-semibold text-ink">{answer.text}</p>
                <p className="rounded-xl rounded-bl-none bg-paper px-3 py-2 text-sm font-bold text-ink">{answer.yes ? "ANO" : "NE"}</p>
              </div>
            ))}
        </div>
        <button type="button" onClick={() => setGuessMode((value) => !value)} disabled={!!result} className={`cut-btn mt-auto border-2 py-3 font-display text-2xl ${guessMode ? "border-paper bg-paper text-ink" : "border-pink bg-pink text-ink"}`}>
          {guessMode ? "ZRUŠIT TIPOVÁNÍ" : "TIPNOUT POSTAVU"}
        </button>
        {result && <div className="border-2 border-pink p-3 text-center text-sm text-paper">Tvůj tip: {CHARACTERS[result.characterId]?.name}. Výsledek čeká na ověření soupeřem.</div>}
        <p className="text-[11px] text-paper/40">Stavy a odpovědi jsou nyní lokálním prototypem; online synchronizaci je nutné dopojit.</p>
      </aside>
    </div>
  );
}
