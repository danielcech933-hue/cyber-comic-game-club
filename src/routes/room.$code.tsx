import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LobbyHeader } from "@/components/lobby/LobbyHeader";
import { GuessWhoGame } from "@/components/games/GuessWhoGame";
import { GAMES } from "@/lib/games/catalog";
import {
  getOnlineRoom, getPlayerSession, previewOnlineRoom, joinOnlineRoom, startOnlineGame, leaveOnlineRoom,
  chooseOnlineSecret, askOnlineQuestion, answerOnlineQuestion,
  guessOnlineCharacter, answerOnlineGuess,
  type OnlineRoom, type PlayerSession, OnlineGameError,
} from "@/lib/online-game";
import { Bolt } from "@/components/lobby/Bolt";

export const Route = createFileRoute("/room/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Aréna #${params.code} — Cyber Chmel Lobby` },
      { name: "description", content: `Připoj se do herní místnosti #${params.code} v Cyber Chmel Lobby.` },
      { property: "og:title", content: `Aréna #${params.code} — Cyber Chmel Lobby` },
      { property: "og:description", content: "Hádej kdo — vyber tajnou postavu a odhal postavy ostatních hráčů." },
    ],
  }),
  component: RoomPage,
});

function RoomPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [room,setRoom] = useState<OnlineRoom | null>(null);
  const [session,setSession] = useState<PlayerSession | null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [starting,setStarting] = useState(false);
  const [invitePreview,setInvitePreview] = useState<import("@/lib/online-game").OnlineRoomSummary | null>(null);
  const [joinName,setJoinName] = useState("");
  const [joining,setJoining] = useState(false);

  const refresh = useCallback(async()=>{
    const currentSession=getPlayerSession(code);
    setSession(currentSession);
    if(!currentSession) {
      try { const preview=await previewOnlineRoom(code); setInvitePreview(preview); setRoom(null); setError(""); }
      catch(e) { setInvitePreview(null); setError(e instanceof Error?e.message:"Místnost se nepodařilo najít."); }
      finally { setLoading(false); }
      return;
    }
    try {
      const next=await getOnlineRoom(code,currentSession);
      setRoom(next);
      setError("");
    } catch(e) {
      if(e instanceof OnlineGameError && e.status===401) setError("Tahle relace hráče už není platná. Vrať se do lobby a připoj se znovu.");
      else setError(e instanceof Error?e.message:"Místnost se nepodařilo načíst.");
    } finally {setLoading(false);}
  },[code]);

  useEffect(()=>{
    void refresh();
    const id=window.setInterval(()=>{
      if (!document.hidden && getPlayerSession(code)) void refresh();
    },2000);
    return()=>window.clearInterval(id);
  },[refresh]);

  const act=async(fn:()=>Promise<unknown>)=>{
    setError("");
    try { await fn(); await refresh(); }
    catch(e) { setError(e instanceof Error?e.message:"Akce se nepodařila."); }
  };

  const joinFromInvite=async()=>{
    const name=joinName.trim().slice(0,18);
    if(!name) { setError("Zadej přezdívku."); return; }
    setJoining(true); setError("");
    try { await joinOnlineRoom(code,name); await refresh(); }
    catch(e) { setError(e instanceof Error?e.message:"Do místnosti se nepodařilo připojit."); }
    finally { setJoining(false); }
  };

  const leave=async()=>{
    if(session) { try { await leaveOnlineRoom(code,session); } catch { /* continue */ } }
    void navigate({to:"/"});
  };
  const start=async()=>{
    if(!session) return;
    setStarting(true);
    await act(()=>startOnlineGame(code,session));
    setStarting(false);
  };
  const copyInvite=()=>{
    void navigator.clipboard?.writeText(`${window.location.origin}/room/${code}`)
      .then(()=>toast.success("Odkaz zkopírován"),()=>toast.error("Kopírování selhalo"));
  };

  const game=GAMES["guess-who"];
  let body:React.ReactNode;
  if(loading) {
    body=<p className="animate-pulse py-24 text-center font-display text-4xl text-neon">NAČÍTÁM ARÉNU…</p>;
  } else if(!session) {
    body=invitePreview ? (
      <div className="mx-auto grid max-w-xl gap-5 border-2 border-neon bg-noir p-6 sm:p-8">
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.3em] text-neon">POZVÁNKA DO ONLINE ARÉNY</p>
          <h2 className="mt-2 font-display text-5xl">HÁDEJ <span className="text-pink">KDO?</span></h2>
          <p className="mt-2 text-paper/70">Místnost #{invitePreview.code} · {invitePreview.players.length}/{invitePreview.max} hráčů</p>
          <p className="mt-1 text-sm text-paper/50">{invitePreview.players.map(p=>p.name).join(" · ")}</p>
        </div>
        <label className="grid gap-1 text-xs font-bold tracking-[0.2em] text-neon">
          TVOJE PŘEZDÍVKA
          <input value={joinName} onChange={e=>setJoinName(e.target.value)} maxLength={18} placeholder="Např. Chmelák"
            className="border border-paper/20 bg-ink px-3 py-3 text-base font-semibold tracking-normal text-paper focus:border-neon focus:outline-none"/>
        </label>
        {error&&<p className="text-center text-sm font-semibold text-pink">{error}</p>}
        <button type="button" disabled={joining||invitePreview.players.length>=invitePreview.max} onClick={()=>void joinFromInvite()}
          className="cut-btn glow-neon border-2 border-neon bg-neon/10 py-3 font-display text-3xl text-neon hover:bg-neon hover:text-ink disabled:opacity-40">
          {joining?"PŘIPOJUJI…":invitePreview.players.length>=invitePreview.max?"MÍSTNOST JE PLNÁ":"VSTOUPIT DO HRY"}
        </button>
        <Link to="/" className="text-center text-sm text-paper/50 hover:text-neon">Zpět do lobby</Link>
      </div>
    ) : (
      <div className="mx-auto grid max-w-md gap-4 py-16 text-center">
        <p className="comic-shadow mx-auto rotate-[-4deg] rounded-[28px] bg-paper px-6 py-3 font-display text-4xl text-ink">ARÉNA NENALEZENA</p>
        <p className="text-paper/70">{error || "Místnost nebyla nalezena nebo už vypršela."}</p>
        <Link to="/" className="cut-btn mx-auto bg-neon px-8 py-2 font-display text-2xl text-ink">ZPĚT DO LOBBY</Link>
      </div>
    );
  } else if(error && !room) {
    body=(
      <div className="mx-auto grid max-w-md gap-4 py-16 text-center">
        <p className="font-display text-4xl text-pink">ARÉNU SE NEPODAŘILO NAČÍST</p>
        <p className="text-paper/70">{error}</p>
        <button type="button" onClick={()=>void navigate({to:"/"})} className="cut-btn mx-auto bg-neon px-8 py-2 font-display text-2xl text-ink">ZPĚT DO LOBBY</button>
      </div>
    );
  } else if(!room) {
    body=<p className="py-20 text-center text-paper/70">Místnost nebyla nalezena.</p>;
  } else if(room.status==="waiting") {
    const seats=Array.from({length:room.max},(_,i)=>room.players[i]);
    const canStart=room.players.length>=game.minPlayers;
    const isHost=room.players.some(p=>p.id===session.playerId&&p.isHost);
    body=(
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="dots grid gap-5 border-2 border-neon bg-noir p-6 sm:p-8">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-neon">ČEKÁRNA ARÉNY · ONLINE</p>
            <h2 className="font-display text-5xl leading-none sm:text-6xl">{game.title} <span className="text-neon">{game.tag}</span></h2>
            <p className="mt-2 text-paper/70">{game.blurb}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {seats.map((player,i)=>(
              <div key={i} className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 ${player?"border-neon/60 bg-ink":"border-dashed border-paper/20"}`}>
                <span className={`grid h-10 w-10 place-items-center rounded-full border-2 font-display text-xl ${player?"border-neon text-neon":"border-paper/20 text-paper/30"}`}>{player?player.name.charAt(0):"?"}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl">{player?.name??"ČEKÁ SE NA HRÁČE…"}</p>
                  {player&&<p className="text-xs text-paper/50">{player.id===session.playerId?"ty":player.isHost?"hostitel":player.online?"online":"neaktivní"}{player.isHost&&player.id===session.playerId?" · hostitel":""}</p>}
                </div>
                {player?.online&&<span className="h-2.5 w-2.5 rounded-full bg-neon"/>}
              </div>
            ))}
          </div>
          <p className="text-sm text-paper/60">{room.players.length} z {room.max} hráčů · minimum {game.minPlayers}</p>
          {error&&<p className="text-sm font-semibold text-pink">{error}</p>}
        </section>
        <aside className="flex flex-col gap-4">
          <div className="grid gap-3 border-2 border-paper/15 bg-noir p-4">
            <p className="font-display text-2xl tracking-wide">POZVÁNKA DO HRY</p>
            <p className="font-display text-6xl tracking-[0.2em] text-neon">{room.code}</p>
            <p className="text-xs text-paper/50">Pošli kód nebo odkaz kamarádům</p>
            <button type="button" onClick={copyInvite} className="rounded-full border border-paper/25 px-4 py-2 text-sm font-semibold hover:border-neon hover:text-neon">Zkopírovat pozvánku</button>
            <button type="button" onClick={()=>void leave()} className="text-sm font-semibold text-pink hover:underline">Opustit místnost</button>
          </div>
          {isHost?(
            <button type="button" disabled={!canStart||starting} onClick={()=>void start()}
              className="cut-btn glow-neon flex h-20 items-center justify-center gap-3 border-2 border-neon bg-neon/10 font-display text-3xl tracking-wider text-neon hover:bg-neon hover:text-ink disabled:opacity-40">
              <Bolt size={20}/>{starting?"SPOUŠTÍM…":"SPUSTIT HÁDEJ KDO"}
            </button>
          ):<p className="border border-paper/15 bg-noir p-4 text-center text-sm text-paper/60">Čekáš, až hostitel spustí hru.</p>}
        </aside>
      </div>
    );
  } else {
    const gameState=room.gameState;
    body=(
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-neon">CYBER CHMEL · GAME 01</p>
            <h2 className="font-display text-4xl sm:text-5xl">HÁDEJ <span className="text-pink">KDO?</span> <span className="text-base text-paper/50">#{room.code}</span></h2>
          </div>
          <button type="button" onClick={()=>void leave()} className="cut-btn border-2 border-pink px-4 py-2 font-display text-lg text-pink hover:bg-pink hover:text-ink">ODEJÍT</button>
        </div>
        <GuessWhoGame
          key={room.code+session.displayName}
          players={room.players.map(p=>p.name)}
          me={session.displayName}
          gameState={gameState}
          onChooseSecret={(characterId)=>void act(()=>chooseOnlineSecret(code,session,characterId))}
          onAskQuestion={(target,questionId)=>void act(()=>askOnlineQuestion(code,session,target,questionId))}
          onAnswerQuestion={(questionId)=>void act(()=>answerOnlineQuestion(code,session,questionId))}
          onGuess={(target,characterId)=>void act(()=>guessOnlineCharacter(code,session,target,characterId))}
          onAnswerGuess={(guessId)=>void act(()=>answerOnlineGuess(code,session,guessId))}
        />
        {error&&<p className="border border-pink/40 bg-pink/10 p-3 text-sm text-pink">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col gap-5 bg-ink p-3 sm:p-6">
      <LobbyHeader/>
      <main className="flex-1">{body}</main>
    </div>
  );
}
