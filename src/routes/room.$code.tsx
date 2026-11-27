import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LobbyHeader } from "@/components/lobby/LobbyHeader";
import { GAMES } from "@/lib/games/catalog";
import { joinRoom, leaveRoom, setRoomStatus, useLobby } from "@/lib/lobby-store";

export const Route = createFileRoute("/room/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Aréna #${params.code} — Cyber Chmel Lobby` },
      { name: "description", content: `Připoj se do herní místnosti #${params.code} v Cyber Chmel Lobby.` },
      { property: "og:title", content: `Aréna #${params.code} — Cyber Chmel Lobby` },
      { property: "og:description", content: "Párty hra čeká na hráče. Vstup a vyzvi soupeře!" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RoomPage,
});

function RoomPage() {
  const { code } = Route.useParams();
  const lobby = useLobby();
  const navigate = useNavigate();
  const room = lobby.rooms.find((r) => r.code === code);
  const me = lobby.nick;
  const inRoom = !!room && room.players.includes(me);
  const [joinErr, setJoinErr] = useState("");
  const game = room ? GAMES[room.game] : null;

  let body: React.ReactNode;
  if (!lobby.ready) {
    body = <p className="animate-pulse py-24 text-center font-display text-4xl text-neon">NAČÍTÁM ARÉNU…</p>;
  } else if (!room || !game) {
    body = (
      <div className="mx-auto grid max-w-md gap-4 py-16 text-center">
        <p className="comic-shadow mx-auto rotate-[-4deg] rounded-[28px] bg-paper px-6 py-3 font-display text-4xl text-ink">ARÉNA NENALEZENA</p>
        <p className="text-paper/70">Místnost #{code} neexistuje nebo ji hostitel zavřel.</p>
        <Link to="/" className="cut-btn mx-auto bg-neon px-8 py-2 font-display text-2xl text-ink">ZPĚT DO LOBBY</Link>
      </div>
    );
  } else if (!inRoom) {
    body = (
      <div className="mx-auto grid max-w-md gap-4 py-16 text-center">
        <p className="font-display text-5xl">{game.title} <span className="text-neon">{game.tag}</span></p>
        <p className="text-paper/70">Místnost #{room.code} · {room.players.length}/{room.max} hráčů</p>
        {joinErr && <p className="font-semibold text-pink">{joinErr}</p>}
        <button type="button" onClick={() => {
          const r = joinRoom(room.code);
          setJoinErr(r === "full" ? "Místnost je plná." : r === "playing" ? "Právě se hraje, zkus to za chvíli." : "");
        }} className="cut-btn glow-neon mx-auto border-2 border-neon bg-neon/10 px-10 py-3 font-display text-3xl text-neon hover:bg-neon hover:text-ink">VSTOUPIT</button>
      </div>
    );
  } else if (room.status === "waiting") {
    const seats = Array.from({ length: room.max }, (_, i) => room.players[i]);
    const canStart = room.players.length >= 1;
    body = (
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="dots grid gap-5 border-2 border-neon bg-noir p-6 sm:p-8">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-neon">ČEKÁRNA ARÉNY</p>
            <h2 className="font-display text-5xl leading-none sm:text-6xl">{game.title} <span className="text-neon">{game.tag}</span></h2>
            <p className="mt-2 text-paper/70">{game.blurb}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {seats.map((p, i) => (
              <div key={i} className={`flex items-center gap-3 border-2 px-4 py-3 ${p ? "border-neon/60 bg-ink" : "border-dashed border-paper/20"}`}>
                <span className={`grid h-10 w-10 place-items-center rounded-full border-2 font-display text-xl ${p ? "border-neon text-neon" : "border-paper/20 text-paper/30"}`}>{p ? p.charAt(0) : "?"}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl">{p ?? "ČEKÁ SE NA HRÁČE…"}</p>
                  {p && <p className="text-xs text-paper/50">{p === me ? "ty" : p === room.host ? "hostitel" : "připraven"}</p>}
                </div>
                
              </div>
            ))}
          </div>
          {!canStart && <p className="animate-pulse font-display text-2xl text-pink">ČEKÁME NA SOUPEŘE…</p>}
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 border-2 border-paper/15 bg-noir p-4">
            <p className="font-display text-2xl tracking-wide">POZVÁNKA DO HRY</p>
            <p className="font-display text-6xl tracking-[0.2em] text-neon">{room.code}</p>
            <p className="text-xs text-paper/50">Pošli kód nebo odkaz kamarádům</p>
            <button type="button" onClick={() => {
              void navigator.clipboard?.writeText(`${window.location.origin}/room/${room.code}`).then(() => toast.success("Odkaz zkopírován"), () => toast.error("Kopírování selhalo"));
            }} className="rounded-full border border-paper/25 px-4 py-2 text-sm font-semibold hover:border-neon hover:text-neon">Zkopírovat pozvánku</button>
            <button type="button" onClick={() => { leaveRoom(room.code); void navigate({ to: "/" }); }} className="text-sm font-semibold text-pink hover:underline">Opustit místnost</button>
          </div>
          <button type="button" disabled={!canStart} onClick={() => setRoomStatus(room.code, "playing")}
            className="cut-btn glow-neon flex h-20 items-center justify-center gap-3 border-2 border-neon bg-neon/10 font-display text-4xl tracking-wider text-neon hover:bg-neon hover:text-ink disabled:opacity-40 disabled:hover:bg-neon/10 disabled:hover:text-neon">
            <Bolt size={20} />OTEVŘÍT MÍSTNOST
          </button>
        </div>
      </div>
    );
  } else {
    body = (
      <div className="mx-auto grid max-w-3xl gap-5 border-2 border-pink bg-noir p-6 text-center sm:p-10">
        <p className="text-xs font-bold tracking-[0.3em] text-pink">ARÉNA #{room.code}</p>
        <h2 className="font-display text-5xl sm:text-6xl">NOVÝ <span className="text-neon">GAME CLUB</span></h2>
        <p className="text-paper/70">Místnost je připravená. Původní hry jsou pryč — sem později přidáme nové herní režimy.</p>
        <button type="button" onClick={() => { leaveRoom(room.code); void navigate({ to: "/" }); }} className="cut-btn mx-auto border-2 border-pink px-6 py-2 font-display text-xl text-pink hover:bg-pink hover:text-ink">ZPĚT DO LOBBY</button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col gap-5 bg-ink p-3 sm:p-6">
      <LobbyHeader />
      <main className="flex-1">{body}</main>
    </div>
  );
}
