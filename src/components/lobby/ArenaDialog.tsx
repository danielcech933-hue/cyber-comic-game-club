import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { joinOnlineRoom, createOnlineRoom, listOnlineRooms, type OnlineRoomSummary } from "@/lib/online-game";
import { setNick, type LobbyState } from "@/lib/lobby-store";
import { Bolt } from "./Bolt";

export type ArenaTab = "create" | "join" | "browse";

export function ArenaDialog({
  open, onOpenChange, lobby, initialTab = "create",
}: {
  open: boolean; onOpenChange: (o: boolean) => void; lobby: LobbyState; initialTab?: ArenaTab;
}) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<ArenaTab>(initialTab);
  const [max, setMax] = useState(4);
  const [code, setCode] = useState("");
  const [nick, setNickLocal] = useState("");
  const [error, setError] = useState("");
  const [rooms,setRooms] = useState<OnlineRoomSummary[]>([]);
  const [loadingRooms,setLoadingRooms] = useState(false);
  const [submitting,setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTab(initialTab); setMax(4); setCode(""); setError(""); setNickLocal(lobby.nick);
    }
  }, [open,initialTab,lobby.nick]);

  useEffect(() => {
    if(!open || tab!=="browse") return;
    let active=true;
    const refresh=async()=>{
      setLoadingRooms(true);
      try { const next=await listOnlineRooms(); if(active) setRooms(next); }
      catch { if(active) setError("Místnosti se nepodařilo načíst."); }
      finally { if(active) setLoadingRooms(false); }
    };
    void refresh();
    const id=window.setInterval(()=>void refresh(),4000);
    return()=>{active=false;window.clearInterval(id);};
  },[open,tab]);

  const go=(roomCode:string)=>{onOpenChange(false);void navigate({to:"/room/$code",params:{code:roomCode}});};
  const saveNick=()=>{const value=nick.trim().slice(0,18);if(value)setNick(value);return value;};

  const submitCreate=async()=>{
    const name=saveNick();
    if(!name) return setError("Zadej přezdívku.");
    setSubmitting(true);setError("");
    try { const {room}=await createOnlineRoom(name,max);go(room.code); }
    catch(e){setError(e instanceof Error?e.message:"Místnost se nepodařilo vytvořit.");}
    finally{setSubmitting(false);}
  };

  const submitJoin=async(roomCode=code)=>{
    const name=saveNick();
    if(!name) return setError("Zadej přezdívku.");
    const clean=roomCode.trim().toUpperCase();
    if(!/^[A-Z0-9]{8}$/.test(clean)) return setError("Kód místnosti musí mít 8 znaků.");
    setSubmitting(true);setError("");
    try { const {room}=await joinOnlineRoom(clean,name);go(room.code); }
    catch(e){setError(e instanceof Error?e.message:"Do místnosti se nepodařilo připojit.");}
    finally{setSubmitting(false);}
  };

  const tabBtn=(t:ArenaTab,label:string)=>(
    <button type="button" onClick={()=>{setTab(t);setError("");}}
      className={`cut-btn flex-1 px-3 py-2 font-display text-xl tracking-wide ${tab===t?"bg-neon text-ink":"bg-ink text-paper/70 hover:text-neon"}`}>
      {label}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="hatch max-h-[92dvh] overflow-y-auto rounded-none border-2 border-neon bg-noir text-paper sm:rounded-none">
        <DialogTitle className="font-display text-4xl tracking-wider">
          {tab==="browse"?<>OTEVŘENÉ <span className="text-neon">MÍSTNOSTI</span></>:<>HÁDEJ KDO · <span className="text-neon">ARÉNA</span></>}
        </DialogTitle>
        <DialogDescription className="text-sm text-paper/60">{tab==="browse"?"Živé místnosti, do kterých se můžeš připojit odkudkoliv.":"Vytvoř místnost, nastav počet hráčů a pozvi kamarády."}</DialogDescription>
        <div className="flex gap-2">{tabBtn("browse","MÍSTNOSTI")}{tabBtn("create","ZALOŽIT")}{tabBtn("join","KÓD")}</div>

        {tab!=="browse"&&(
          <label className="grid gap-1 text-xs font-bold tracking-[0.2em] text-neon">
            PŘEZDÍVKA
            <input value={nick} onChange={(e)=>setNickLocal(e.target.value)} maxLength={18} placeholder="Chmelák"
              className="border border-paper/20 bg-ink px-3 py-2 text-base font-semibold tracking-normal text-paper focus:border-neon focus:outline-none"/>
          </label>
        )}

        {tab==="browse"&&(
          <div className="grid gap-2">
            {loadingRooms&&rooms.length===0&&<p className="animate-pulse border border-paper/15 p-4 text-center text-sm text-paper/60">NAČÍTÁM MÍSTNOSTI…</p>}
            {!loadingRooms&&rooms.length===0&&<p className="border border-dashed border-paper/20 p-4 text-center text-sm text-paper/60">Žádná otevřená místnost. Založ první a pošli pozvánku ostatním.</p>}
            {rooms.map((room)=>(
              <div key={room.code} className="grid gap-3 rounded-lg border border-paper/15 bg-ink p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="font-display text-xl tracking-wider text-neon">#{room.code}</p>
                  <p className="truncate text-sm text-paper/70">{room.players.map((p)=>p.name).join(", ")}</p>
                  <p className="mt-1 text-xs font-bold tracking-wider text-neon">{room.players.length}/{room.max} HRÁČŮ · {room.max-room.players.length} VOLNÝCH MÍST</p>
                </div>
                <button type="button" disabled={room.players.length>=room.max||submitting} onClick={()=>void submitJoin(room.code)}
                  className="cut-btn bg-neon px-4 py-1.5 font-display text-lg text-ink hover:bg-paper disabled:bg-paper/20 disabled:text-paper/50">
                  {room.players.length>=room.max?"PLNO":"VSTOUPIT"}
                </button>
              </div>
            ))}
            {error&&<p className="text-sm font-semibold text-pink">{error}</p>}
            <button type="button" onClick={()=>setTab("create")} className="cut-btn glow-neon mt-1 flex items-center justify-center gap-2 border-2 border-neon bg-neon/10 py-3 font-display text-2xl tracking-wider text-neon hover:bg-neon hover:text-ink">
              <Bolt/> VYTVOŘIT NOVOU MÍSTNOST
            </button>
          </div>
        )}

        {tab==="create"&&(
          <form className="grid gap-3" onSubmit={(e)=>{e.preventDefault();void submitCreate();}}>
            <div className="grid gap-1 text-xs font-bold tracking-[0.2em] text-neon">
              POČET HRÁČŮ
              <div className="flex flex-wrap gap-2">
                {Array.from({length:7},(_,i)=>i+2).map((n)=>(
                  <button key={n} type="button" onClick={()=>setMax(n)} className={`h-10 w-10 border-2 font-display text-xl ${max===n?"border-pink bg-pink text-ink":"border-paper/20 text-paper"}`}>{n}</button>
                ))}
              </div>
              <span className="text-[11px] font-semibold tracking-normal text-paper/50">Od 2 do 8 hráčů. Každý hráč si zvolí svou tajnou postavu.</span>
            </div>
            {error&&<p className="text-sm font-semibold text-pink">{error}</p>}
            <button type="submit" disabled={submitting} className="cut-btn glow-neon flex items-center justify-center gap-2 border-2 border-neon bg-neon/10 py-3 font-display text-3xl tracking-wider text-neon hover:bg-neon hover:text-ink disabled:opacity-40">
              <Bolt/>{submitting?"VYTVÁŘÍM…":"VYTVOŘIT MÍSTNOST"}
            </button>
          </form>
        )}

        {tab==="join"&&(
          <form className="grid gap-3" onSubmit={(e)=>{e.preventDefault();void submitJoin();}}>
            <label className="grid gap-1 text-xs font-bold tracking-[0.2em] text-neon">
              OSMIZNAKOVÝ KÓD MÍSTNOSTI
              <input value={code} onChange={(e)=>{setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""));setError("");}} maxLength={8} placeholder="ABCD1234" autoFocus
                className="border border-paper/20 bg-ink px-3 py-2 font-display text-3xl tracking-[0.3em] text-paper focus:border-neon focus:outline-none"/>
            </label>
            {error&&<p className="text-sm font-semibold text-pink">{error}</p>}
            <button type="submit" disabled={code.length!==8||submitting} className="cut-btn border-2 border-pink bg-pink py-3 font-display text-3xl tracking-wider text-ink hover:bg-paper disabled:opacity-40">
              {submitting?"PŘIPOJUJI…":"VSTOUPIT"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
