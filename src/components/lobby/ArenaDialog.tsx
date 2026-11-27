import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GAMES, GAME_LIST, type GameId } from "@/lib/games/catalog";
import { checkCustomCode, createRoom, joinRoom, setNick, quickPlay, type LobbyState } from "@/lib/lobby-store";
import { Bolt } from "./Bolt";

export type ArenaTab = "create" | "join" | "browse";

export function ArenaDialog({
  open, onOpenChange, lobby, initialTab = "create",
}: {
  open: boolean; onOpenChange: (o: boolean) => void; lobby: LobbyState; initialTab?: ArenaTab;
}) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<ArenaTab>(initialTab);
  const game: GameId = "guess-who";
  const [max, setMax] = useState(4);
  const [code, setCode] = useState("");
  const [nick, setNickLocal] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTab(initialTab); setMax(4);
      setCode(""); setError(""); setNickLocal(lobby.nick);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialTab]);

  const g = GAMES[game];
  const go = (c: string) => { onOpenChange(false); void navigate({ to: "/room/$code", params: { code: c } }); };
  const saveNick = () => { if (nick.trim()) setNick(nick); };

  const submitCreate = () => {
    saveNick();
    const custom = code.trim().toUpperCase();
    if (custom) {
      const chk = checkCustomCode(custom);
      if (chk === "invalid") return setError("Kód musí mít 4–6 znaků, jen písmena A–Z a číslice.");
      if (chk === "taken") return setError("Tenhle kód už někdo používá. Zkus jiný.");
    }
    go(createRoom(game, Math.min(Math.max(max, g.minPlayers), g.maxPlayers), custom || undefined));
  };
  const submitJoin = (c = code) => {
    saveNick();
    const res = joinRoom(c.trim().toUpperCase());
    if (res === "notfound") return setError("Místnost s tímhle kódem neexistuje.");
    if (res === "full") return setError("Místnost je plná.");
    if (res === "playing") return setError("V místnosti už se hraje. Počkej na další kolo.");
    go(c.trim().toUpperCase());
  };

  const openRooms = lobby.rooms.filter((r) => r.game === game && r.status === "waiting");
  const tabBtn = (t: ArenaTab, label: string) => (
    <button
      type="button"
      onClick={() => { setTab(t); setError(""); }}
      className={`cut-btn flex-1 px-3 py-2 font-display text-xl tracking-wide ${tab === t ? "bg-neon text-ink" : "bg-ink text-paper/70 hover:text-neon"}`}
    >
      {label}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="hatch max-h-[92dvh] overflow-y-auto rounded-none border-2 border-neon bg-noir text-paper sm:rounded-none">
        <DialogTitle className="font-display text-4xl tracking-wider">
          {tab === "browse" ? <>OTEVŘENÉ <span className="text-neon">MÍSTNOSTI</span></> : <>HÁDEJ KDO · <span className="text-neon">ARÉNA</span></> }
        </DialogTitle>
        <DialogDescription className="text-sm text-paper/60">{tab === "browse" ? "Přehled aktuálně otevřených místností." : "Vytvoř prázdnou místnost pro svoji partu a pošli jí pozvánku."}</DialogDescription>

        <div className="flex gap-2">{tabBtn("browse", "MÍSTNOSTI")}{tabBtn("create", "ZALOŽIT")}{tabBtn("join", "KÓD")}</div>

        {tab !== "browse" && (
          <label className="grid gap-1 text-xs font-bold tracking-[0.2em] text-neon">
            PŘEZDÍVKA
            <input value={nick} onChange={(e) => setNickLocal(e.target.value)} maxLength={16} placeholder="Chmelák"
              className="border border-paper/20 bg-ink px-3 py-2 text-base font-semibold tracking-normal text-paper focus:border-neon focus:outline-none" />
          </label>
        )}

        {tab !== "join" && (
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Hra">
            {GAME_LIST.map((x) => (
              <button key={x.id} type="button" role="radio" aria-checked={game === x.id}
                onClick={() => setMax(x.maxPlayers)}
                className={`border-2 px-2 py-2 text-left font-display text-lg leading-none ${game === x.id ? "border-neon bg-neon/10 text-neon" : "border-paper/20 text-paper/70 hover:border-paper/50"}`}>
                {x.title}<span className="block text-sm text-pink">{x.tag}</span>
              </button>
            ))}
          </div>
        )}

        {tab === "browse" && (
          <div className="grid gap-2">
            {openRooms.length === 0 && (
              <p className="border border-dashed border-paper/20 p-4 text-center text-sm text-paper/60">Žádná otevřená místnost. Založ první a ostatní se přidají!</p>
            )}
            {openRooms.map((r) => {
              const full = r.players.length >= r.max;
              return (
                <div key={r.code} className="grid gap-3 rounded-lg border border-paper/15 bg-ink p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="font-display text-xl tracking-wider text-neon">#{r.code}</p>
                    <p className="truncate text-sm text-paper/70">{r.players.join(", ")}</p><p className="mt-1 text-xs font-bold tracking-wider text-neon">{r.players.length} / {r.max} HRÁČŮ · {r.max-r.players.length} VOLNÝCH MÍST</p>
                  </div>
                  <button type="button" disabled={full} onClick={() => submitJoin(r.code)}
                    className="cut-btn bg-neon px-4 py-1.5 font-display text-lg text-ink hover:bg-paper disabled:bg-paper/20 disabled:text-paper/50">
                    {full ? "PLNO" : "VSTOUPIT"}
                  </button>
                </div>
              );
            })}
            {error && <p className="text-sm font-semibold text-pink">{error}</p>}
            <button type="button" onClick={() => { onOpenChange(false); void navigate({ to: "/room/$code", params: { code: quickPlay(game) } }); }}
              className="cut-btn glow-neon mt-1 flex items-center justify-center gap-2 border-2 border-neon bg-neon/10 py-3 font-display text-3xl tracking-wider text-neon hover:bg-neon hover:text-ink">
              <Bolt /> RYCHLÝ VSTUP
            </button>
          </div>
        )}

        {tab === "create" && (
          <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); submitCreate(); }}>
            <div className="grid gap-1 text-xs font-bold tracking-[0.2em] text-neon">
              POČET HRÁČŮ
              <div className="flex gap-2">
                {Array.from({ length: g.maxPlayers - g.minPlayers + 1 }, (_, i) => i + g.minPlayers).map((n) => (
                  <button key={n} type="button" onClick={() => setMax(n)}
                    className={`h-10 w-10 border-2 font-display text-xl ${max === n ? "border-pink bg-pink text-ink" : "border-paper/20 text-paper"}`}>{n}</button>
                ))}
              </div>
              <span className="text-[11px] font-semibold tracking-normal text-paper/50">Hádej kdo je určen pro 2 až 8 hráčů.</span>
            </div>
            <label className="grid gap-1 text-xs font-bold tracking-[0.2em] text-neon">
              VLASTNÍ KÓD (NEPOVINNÉ)
              <input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }} maxLength={6} placeholder="např. CHMEL"
                className="border border-paper/20 bg-ink px-3 py-2 font-display text-2xl tracking-[0.3em] text-paper focus:border-neon focus:outline-none" />
            </label>
            {error && <p className="text-sm font-semibold text-pink">{error}</p>}
            <button type="submit" className="cut-btn glow-neon flex items-center justify-center gap-2 border-2 border-neon bg-neon/10 py-3 font-display text-3xl tracking-wider text-neon hover:bg-neon hover:text-ink">
              <Bolt /> VYTVOŘIT MÍSTNOST
            </button>
          </form>
        )}

        {tab === "join" && (
          <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); submitJoin(); }}>
            <label className="grid gap-1 text-xs font-bold tracking-[0.2em] text-neon">
              KÓD MÍSTNOSTI
              <input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }} maxLength={6} placeholder="NEO3" autoFocus
                className="border border-paper/20 bg-ink px-3 py-2 font-display text-3xl tracking-[0.3em] text-paper focus:border-neon focus:outline-none" />
            </label>
            {error && <p className="text-sm font-semibold text-pink">{error}</p>}
            <button type="submit" disabled={code.trim().length < 4}
              className="cut-btn border-2 border-pink bg-pink py-3 font-display text-3xl tracking-wider text-ink hover:bg-paper disabled:opacity-40">
              VSTOUPIT
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
