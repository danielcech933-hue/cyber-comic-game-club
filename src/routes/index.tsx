import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LobbyHeader } from "@/components/lobby/LobbyHeader";
import { LobbyChat } from "@/components/lobby/LobbyChat";
import { ArenaDialog, type ArenaTab } from "@/components/lobby/ArenaDialog";
import { Bolt } from "@/components/lobby/Bolt";
import { useLobby } from "@/lib/lobby-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cyber Chmel Lobby — herní klub" },
      { name: "description", content: "Komiksové lobby pro nové párty hry. Založ arénu a pozvi kamarády." },
      { property: "og:title", content: "Cyber Chmel Lobby — herní klub" },
      { property: "og:description", content: "Založ arénu a pozvi kamarády do Cyber Chmel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Lobby,
});

function Lobby() {
  const lobby = useLobby();
  const [dlg, setDlg] = useState<{ open: boolean; tab: ArenaTab }>({ open: false, tab: "create" });

  return (
    <div className="flex min-h-dvh flex-col gap-5 bg-ink p-3 sm:p-6 lg:h-dvh">
      <LobbyHeader />
      <main className="flex min-h-0 flex-1 flex-col gap-5 lg:flex-row">
        <section className="grid min-h-[420px] flex-1 grid-cols-1 gap-3 md:grid-cols-2 md:grid-rows-2">
          <div className="cut-a dots relative flex min-h-[320px] flex-col justify-between overflow-hidden border-2 border-neon bg-noir p-6 sm:p-8 md:row-span-2">
            <div>
              <p className="text-xs font-bold tracking-[0.3em] text-neon">CYBER CHMEL · GAME CLUB</p>
              <h2 className="mt-3 font-display text-6xl leading-none sm:text-7xl">VSTUP DO<br /><span className="text-neon">ARÉNY</span></h2>
              <p className="mt-4 max-w-md text-paper/65">Vyber si hru, založ online místnost a vyzvi kamarády. Od logiky až po burzovní strategii.</p>
            </div>
            <svg viewBox="0 0 220 190" className="w-56 self-center sm:w-72" fill="none" stroke="var(--neon)" strokeWidth="2" aria-hidden>
              <circle cx="110" cy="25" r="16" /><circle cx="90" cy="60" r="16" /><circle cx="130" cy="60" r="16" fill="var(--neon)" />
              <circle cx="70" cy="95" r="16" /><circle cx="110" cy="95" r="16" fill="var(--pink)" stroke="var(--pink)" /><circle cx="150" cy="95" r="16" />
              <circle cx="50" cy="130" r="16" fill="var(--neon)" /><circle cx="90" cy="130" r="16" /><circle cx="130" cy="130" r="16" /><circle cx="170" cy="130" r="16" />
              <path d="M196 10l-14 26h10l-8 22" strokeWidth="3" />
            </svg>
            <p className="font-display text-2xl tracking-wider text-neon">2 ONLINE HRY · 2–8 HRÁČŮ</p>
          </div>
          <div className="cut-b relative flex min-h-[220px] flex-col justify-end overflow-hidden border-2 border-pink bg-ink p-6 pl-10 sm:pl-16">
            <div className="laser absolute left-[18%] right-0 top-[38%] h-3 bg-pink" />
            <div className="relative w-fit bg-ink/80 px-3 py-2">
              <p className="text-xs font-bold tracking-[0.25em] text-pink">LOGICKÁ HRA</p>
              <h2 className="font-display text-4xl leading-none sm:text-5xl">HÁDEJ<br />KDO</h2>
            </div>
          </div>
          <div className="cut-c hatch relative flex min-h-[220px] flex-col justify-between overflow-hidden border-2 border-paper/30 bg-violet p-6">
            <div className="comic-shadow self-end rotate-[-4deg] rounded-[28px] bg-paper px-5 py-3 font-display text-xl text-ink sm:text-2xl">BURZOVNÍ TRH</div>
            <div className="pl-4">
              <h2 className="font-display text-4xl">AKCIOVÉ MONOPOLY</h2>
              <p className="font-display text-lg text-neon">INVESTUJ · OBCHODUJ · VYHRAJ</p>
            </div>
          </div>
        </section>

        <aside className="flex w-full flex-col gap-4 lg:w-80">
          <LobbyChat lobby={lobby} />
          <button type="button" onClick={() => setDlg({ open: true, tab: "create" })}
            className="cut-btn glow-neon flex h-20 shrink-0 items-center justify-center gap-3 border-2 border-neon bg-neon/10 font-display text-3xl tracking-wider text-neon transition-colors hover:bg-neon hover:text-ink">
            <Bolt size={20} />ZALOŽIT MÍSTNOST
          </button>
          <button type="button" onClick={() => setDlg({ open: true, tab: "browse" })}
            className="cut-btn flex h-14 shrink-0 items-center justify-center border-2 border-paper/30 bg-paper/5 font-display text-2xl text-paper transition-colors hover:border-pink hover:text-pink">
            PROHLÉDNOUT MÍSTNOSTI
          </button>
        </aside>
      </main>
      <ArenaDialog open={dlg.open} onOpenChange={(o) => setDlg((d) => ({ ...d, open: o }))} lobby={lobby} initialTab={dlg.tab} />
    </div>
  );
}
