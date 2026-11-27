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
      <circle cx="32" cy="40" r="2.5" fill="var(--ink)" /><circle cx="48" cy="40" r="2.5" fill="var(--ink)" />
      {character.glasses && <g fill="none" stroke="var(--ink)" strokeWidth="2.5"><circle cx="32" cy="40" r="6" /><circle cx="48" cy="40" r="6" /><path d="M38 40h4" /></g>}
      {character.beard
        ? <path d="M24 46 Q40 72 56 46 Q48 56 40 56 Q32 56 24 46Z" fill={character.hair === "holá" ? "oklch(0.35 0.03 60)" : HAIR[character.hair]} stroke="var(--ink)" strokeWidth="1.5" />
        : <path d="M33 52 Q40 57 47 52" stroke="var(--ink)" strokeWidth="2" fill="none" />}
    </svg>
  );
}

export function GuessWhoGame({ players, me, gameState, onChooseSecret, onAskQuestion, onAnswerQuestion, onGuess, onAnswerGuess }: {
  players: string[];
  me: string;
  gameState: import("@/lib/lobby-store").GuessWhoState;
  onChooseSecret: (characterId: number) => void;
  onAskQuestion: (target: string, questionId: string, text: string) => void;
  onAnswerQuestion: (questionId: string, yes: boolean) => void;
  onGuess: (target: string, characterId: number) => void;
  onAnswerGuess: (guessId: string) => void;
}) {
  const opponents = players.filter((player) => player !== me);
  const [targetPlayer, setTargetPlayer] = useState(opponents[0] ?? "");
  const [eliminated, setEliminated] = useState<Record<string, number[]>>({});
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [guessMode, setGuessMode] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const mySecretId = gameState.secrets[me];
  const mySecret = mySecretId === undefined ? undefined : CHARACTERS[mySecretId];
  const allSelected = players.every((player) => gameState.secrets[player] !== undefined);
  const myQuestionsForTarget = (gameState.questions[targetPlayer] ?? []).filter((question) => question.asker === me);
  const questionsLeft = MAX_QUESTIONS_PER_OPPONENT - myQuestionsForTarget.length;
  const targetQuestions = gameState.questions[me] ?? [];
  const pendingQuestions = targetQuestions.filter((question) => !question.answered);
  const pendingGuesses = gameState.guesses.filter((guess) => guess.target === me && !guess.answered);
  const targetEliminated = new Set(eliminated[targetPlayer] ?? []);

  if (mySecretId === undefined) {
    return (
      <section className="mx-auto grid max-w-6xl gap-5 border-2 border-pink bg-noir p-5 sm:p-8">
        <div>
          <p className="text-xs font-bold tracking-[0.3em] text-pink">KROK 1 / 2 · SOUKROMÁ VOLBA</p>
          <h2 className="mt-2 font-display text-4xl sm:text-6xl">VYBER SI SVOU <span className="text-pink">POSTAVU</span></h2>
          <p className="mt-2 max-w-3xl text-paper/70">Každý hráč si vybere jednu postavu. Svůj výběr nikomu neukazuj — ostatní ho budou odhalovat otázkami.</p>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8 sm:gap-3">
          {CHARACTERS.map((character) => (
            <button key={character.id} type="button" onClick={() => onChooseSecret(character.id)} className="group border-2 border-paper/20 bg-ink p-2 text-left transition hover:border-pink hover:bg-pink/10">
              <div className="aspect-[3/4]"><Face character={character} /></div>
              <p className="mt-1 truncate text-center font-display text-sm text-paper sm:text-base">{character.name}</p>
            </button>
          ))}
        </div>
      </section>
    );
  }

  if (opponents.length === 0) return <div className="border-2 border-pink bg-noir p-6 text-center font-display text-2xl text-pink">PŘIDEJ DO MÍSTNOSTI ALESPOŇ JEDNOHO SOUPEŘE.</div>;

  const makeGuess = (characterId: number) => {
    if (!targetPlayer) return;
    onGuess(targetPlayer, characterId);
    setGuessMode(false);
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="border-2 border-pink bg-noir p-3 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.25em] text-pink">KROK 2 / 2 · HÁDÁNÍ</p>
              <h2 className="font-display text-4xl sm:text-5xl">HÁDEJ <span className="text-pink">KDO?</span></h2>
            </div>
            <button type="button" onClick={() => setShowSecret((value) => !value)} className="rounded-lg border border-neon/50 bg-ink px-3 py-2 text-left">
              <p className="text-[10px] font-bold tracking-widest text-paper/50">TVOJE POSTAVA</p>
              <p className="font-display text-xl text-neon">{showSecret ? mySecret?.name : "TAJNÁ · UKÁZAT"}</p>
            </button>
          </div>

          {!allSelected && <p className="mb-3 border border-pink/30 bg-pink/10 p-3 text-sm text-pink">Ještě vybírají: {players.filter((player) => gameState.secrets[player] === undefined).join(", ")}</p>}

          <div className="mb-4 flex flex-wrap gap-2">
            {opponents.map((player) => (
              <button key={player} type="button" onClick={() => { setTargetPlayer(player); setGuessMode(false); }}
                className={`rounded-lg border-2 px-4 py-2 font-display text-lg ${targetPlayer === player ? "border-pink bg-pink text-ink" : "border-paper/20 text-paper hover:border-pink"}`}>{player}</button>
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
                <button key={character.id} type="button" disabled={!allSelected} onClick={() => guessMode ? makeGuess(character.id) : setEliminated((current) => {
                  const next = new Set(current[targetPlayer] ?? []);
                  if (next.has(character.id)) next.delete(character.id); else next.add(character.id);
                  return { ...current, [targetPlayer]: [...next] };
                })} className={`relative border-2 bg-ink p-1 transition ${guessMode ? "border-pink hover:bg-pink/20" : isEliminated ? "border-paper/10 opacity-40" : "border-neon/40 hover:border-neon"} disabled:opacity-30`}>
                  <div className="aspect-[3/4]"><Face character={character} /></div>
                  <p className="bg-paper text-center font-display text-sm text-ink sm:text-base">{character.name}</p>
                  {isEliminated && !guessMode && <span className="absolute inset-0 grid place-items-center bg-ink/55 font-display text-4xl text-pink">✕</span>}
                </button>
              );
            })}
          </div>
          {guessMode && <p className="mt-3 animate-pulse text-center font-display text-2xl text-pink">VYBER POSTAVU, KTEROU TIPUJEŠ!</p>}
        </section>

        <aside className="flex flex-col gap-3 border-2 border-paper/15 bg-noir p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-2xl">OTÁZKY NA SOUPEŘE</h3>
            <span className="font-display text-xl text-pink">{questionsLeft}/6</span>
          </div>
          <p className="text-sm text-paper/60">Vyber otázku. Soupeři se zobrazí a musí odpovědět ano nebo ne.</p>
          <select value={selectedQuestion} onChange={(e) => setSelectedQuestion(e.target.value)} className="w-full border border-paper/25 bg-ink px-3 py-2 text-sm text-paper focus:border-pink focus:outline-none">
            <option value="">Vyber otázku…</option>
            {MASK_QUESTIONS.filter((question) => !myQuestionsForTarget.some((answer) => answer.text === question.text)).map((question) => <option key={question.id} value={question.id}>{question.text}</option>)}
          </select>
          <button type="button" disabled={!selectedQuestion || questionsLeft <= 0 || !allSelected} onClick={() => {
            const question = MASK_QUESTIONS.find((item) => item.id === selectedQuestion);
            if (question) onAskQuestion(targetPlayer, question.id, question.text);
            setSelectedQuestion("");
          }} className="cut-btn border-2 border-pink bg-pink py-2 font-display text-2xl text-ink disabled:opacity-40">POLOŽIT OTÁZKU</button>

          <div className="grid gap-2">
            {myQuestionsForTarget.length === 0
              ? <p className="border border-dashed border-paper/20 p-3 text-sm text-paper/55">Zatím žádné otázky. Začni otázkou o vzhledu postavy.</p>
              : myQuestionsForTarget.map((question) => (
                <div key={question.id} className="grid gap-1">
                  <p className="ml-auto rounded-xl rounded-br-none bg-neon px-3 py-2 text-sm font-semibold text-ink">{question.text}</p>
                  <p className="rounded-xl rounded-bl-none bg-paper px-3 py-2 text-sm font-bold text-ink">{question.answered ? question.yes ? "ANO" : "NE" : "ČEKÁ NA ODPOVĚĎ…"}</p>
                </div>
              ))}
          </div>
          <button type="button" onClick={() => setGuessMode((value) => !value)} disabled={!allSelected} className={`cut-btn mt-auto border-2 py-3 font-display text-2xl ${guessMode ? "border-paper bg-paper text-ink" : "border-pink bg-pink text-ink"} disabled:opacity-40`}>
            {guessMode ? "ZRUŠIT TIPOVÁNÍ" : "TIPNOUT POSTAVU"}
          </button>
        </aside>
      </div>

      <section className="grid gap-4 border-2 border-neon/50 bg-noir p-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <h3 className="font-display text-2xl text-neon">ČEKÁ NA TVOU ODPOVĚĎ</h3>
          {pendingQuestions.length === 0 ? <p className="text-sm text-paper/50">Nikdo se tě zatím neptá.</p> : pendingQuestions.map((question) => (
            <div key={question.id} className="grid gap-2 rounded-lg border border-paper/15 bg-ink p-3">
              <p className="text-sm text-paper/60">{question.asker} se ptá:</p>
              <p className="font-display text-xl">{question.text}</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onAnswerQuestion(question.id, true)} className="cut-btn bg-neon py-2 font-display text-xl text-ink">ANO</button>
                <button type="button" onClick={() => onAnswerQuestion(question.id, false)} className="cut-btn bg-pink py-2 font-display text-xl text-ink">NE</button>
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-2">
          <h3 className="font-display text-2xl text-pink">SOUPEŘI HÁDAJÍ TVOU POSTAVU</h3>
          {pendingGuesses.length === 0 ? <p className="text-sm text-paper/50">Zatím nikdo netipuje tvoji postavu.</p> : pendingGuesses.map((guess) => (
            <div key={guess.id} className="grid gap-2 rounded-lg border border-paper/15 bg-ink p-3">
              <p className="text-sm text-paper/60">{guess.asker} tipuje:</p>
              <p className="font-display text-2xl">{CHARACTERS[guess.characterId]?.name}</p>
              <p className="text-xs text-paper/50">Tajná postava je {mySecret?.name}.</p>
              <button type="button" onClick={() => onAnswerGuess(guess.id)} className="cut-btn bg-pink py-2 font-display text-xl text-ink">ODHALIT, ZDA JE TIP SPRÁVNÝ</button>
            </div>
          ))}
        </div>
      </section>
      <section className="border border-paper/15 bg-noir p-4">
        <h3 className="mb-2 font-display text-2xl">VÝSLEDKY TIPŮ</h3>
        {gameState.guesses.filter((guess) => guess.answered).length === 0
          ? <p className="text-sm text-paper/50">Zatím žádné vyhodnocené tipy.</p>
          : <div className="flex flex-wrap gap-2">{gameState.guesses.filter((guess) => guess.answered).map((guess) => (
            <p key={guess.id} className={`rounded-lg border px-3 py-2 text-sm ${guess.correct ? "border-neon text-neon" : "border-pink text-pink"}`}>{guess.asker} → {guess.target}: {CHARACTERS[guess.characterId]?.name} · {guess.correct ? "SPRÁVNĚ" : "VEDLE"}</p>
          ))}</div>}
      </section>
    </div>
  );
}
