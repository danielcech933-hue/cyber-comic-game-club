import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import maskFace from "@/assets/mask_face.jpg.asset.json";
import { LobbyHeader } from "@/components/lobby/LobbyHeader";
import { LobbyChat } from "@/components/lobby/LobbyChat";
import { ArenaDialog, type ArenaTab } from "@/components/lobby/ArenaDialog";
import { Bolt } from "@/components/lobby/Bolt";
import { roomsLabel, type GameId } from "@/lib/games/catalog";
import { useLobby } from "@/lib/lobby-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cyber Chmel Lobby — párty hry online" },
      { name: "description", content: "Komiksové lobby pro AZ Kvíz Neo-grid, Hádej Kdo // Mask a Šílená slova. Založ arénu a vyzvi kámoše." },
      { property: "og:title", content: "Cyber Chmel Lobby — párty hry online" },
      { property: "og:description", content: "AZ Kvíz, Hádej Kdo a Šílená slova v Cyber Comic Noir lobby." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Lobby,
});

function Lobby() {
  const lobby = useLobby();
  const [dlg, setDlg] = useState<{ open: boolean; tab: ArenaTab; game: GameId }>({ open: false, tab: "create", game: "az" });
  const count = (g: GameId) => lobby.rooms.filter((r) => r.game === g && r.status === "waiting").length;
  const browse = (game: GameId) => setDlg({ open: true, tab: "browse", game });

  return (
    <div className="flex min-h-dvh flex-col gap-5 bg-ink p-3 sm:p-6 lg:h-dvh">
      <LobbyHeader />
      <main className="flex min-h-0 flex-1 flex-col gap-5 lg:flex-row">
        <section className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2 md:grid-rows-2">
          <button type="button" onClick={() => browse("az")}
            className="cut-a dots relative flex min-h-[460px] flex-col justify-between overflow-hidden border-2 border-neon bg-noir p-6 text-left transition-colors hover:bg-violet/40 sm:p-8 md:row-span-2 md:min-h-0">
            <div>
              <p className="text-xs font-bold tracking-[0.3em] text-neon">#01</p>
              <h2 className="mt-2 font-display text-6xl leading-none">AZ KVÍZ<br /><span className="text-neon">NEO-GRID</span></h2>
            </div>
            <svg viewBox="0 0 220 190" className="w-64 self-center sm:w-80" fill="none" stroke="var(--neon)" strokeWidth="2" aria-hidden>
              <circle cx="110" cy="25" r="16" /><circle cx="90" cy="60" r="16" /><circle cx="130" cy="60" r="16" fill="var(--neon)" />
              <circle cx="70" cy="95" r="16" /><circle cx="110" cy="95" r="16" fill="var(--pink)" stroke="var(--pink)" /><circle cx="150" cy="95" r="16" />
              <circle cx="50" cy="130" r="16" fill="var(--neon)" /><circle cx="90" cy="130" r="16" /><circle cx="130" cy="130" r="16" /><circle cx="170" cy="130" r="16" />
              <path d="M196 10l-14 26h10l-8 22" strokeWidth="3" />
            </svg>
            <p className="pr-10 font-display text-3xl text-neon">{roomsLabel(count("az"), "az")}</p>
          </button>

          <button type="button" onClick={() => browse("mask")}
            className="cut-b relative flex min-h-[260px] flex-col justify-end overflow-hidden border-2 border-pink bg-ink p-6 pl-16 text-left">
            <img src={maskFace.url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 grayscale" />
            <div className="laser absolute left-[18%] right-0 top-[38%] h-3 bg-pink" />
            <div className="relative w-fit bg-ink/80 px-3 py-2">
              <h2 className="font-display text-4xl leading-none">HÁDEJ KDO <span className="text-pink">// MASK</span></h2>
              <p className="mt-1 font-display text-xl text-pink">{roomsLabel(count("mask"), "mask")}</p>
            </div>
          </button>

          <button type="button" onClick={() => browse("slova")}
            className="cut-c hatch relative flex min-h-[260px] flex-col justify-between overflow-hidden border-2 border-paper/30 bg-violet p-6 text-left">
            <div className="comic-shadow self-end rotate-[-4deg] rounded-[28px] bg-paper px-5 py-3 font-display text-2xl text-ink sm:text-3xl">KDO ZAVÁHÁ, NEPÍŠE!</div>
            <div className="pl-6">
              <h2 className="font-display text-4xl">ŠÍLENÁ SLOVA</h2>
              <p className="font-display text-xl text-neon">{roomsLabel(count("slova"), "slova")}</p>
            </div>
          </button>
        </section>

        <aside className="flex w-full flex-col gap-4 lg:w-80">
          <LobbyChat lobby={lobby} />
          <button type="button" onClick={() => setDlg({ open: true, tab: "create", game: "az" })}
            className="cut-btn glow-neon flex h-20 shrink-0 items-center justify-center gap-3 border-2 border-neon bg-neon/10 font-display text-4xl tracking-wider text-neon transition-colors hover:bg-neon hover:text-ink">
            <Bolt size={20} />ZALOŽIT ARÉNU
          </button>
        </aside>
      </main>
      <ArenaDialog open={dlg.open} onOpenChange={(o) => setDlg((d) => ({ ...d, open: o }))} lobby={lobby} initialTab={dlg.tab} initialGame={dlg.game} />
    </div>
  );
}
