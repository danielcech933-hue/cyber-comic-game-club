import {useMemo,useState} from "react";
import {Activity,Banknote,Building2,CircleDollarSign,Dice5,Landmark,Wallet,Trophy,LockKeyhole,Coins} from "lucide-react";
import type {OnlinePlayer,PlayerSession} from "@/lib/online-game";
import {STOCKS,STOCK_BOARD,PLAYER_COLORS,DICE_GLYPHS,calculateStockNetWorth,formatCredits,getCompanyRent,type StockGameState} from "@/lib/games/stock-monopoly";

type Props={
 roomCode:string;players:OnlinePlayer[];session:PlayerSession;gameState:StockGameState;
 onRoll:()=>void;onBuy:()=>void;onPass:()=>void;onUpgrade:()=>void;
 onMarketTrade:(ticker:string,quantity:number,side:"buy"|"sell")=>void;
 onBail:()=>void;onEndTurn:()=>void;
};
const tileTheme:Record<string,string>={
 start:"border-amber-300/60 bg-amber-300/15 text-amber-100",
 company:"border-cyan-300/35 bg-cyan-300/[.07] text-cyan-100",
 news:"border-violet-300/45 bg-violet-300/10 text-violet-100",
 tax:"border-rose-300/45 bg-rose-300/[.08] text-rose-100",
 dividend:"border-lime-300/50 bg-lime-300/[.09] text-lime-100",
 market:"border-sky-300/50 bg-sky-300/[.11] text-sky-100",
 ipo:"border-pink-300/50 bg-pink-300/[.11] text-pink-100",
 jail:"border-slate-400/30 bg-slate-500/10 text-slate-200",
 parking:"border-emerald-300/50 bg-emerald-300/[.1] text-emerald-100",
 go_to_jail:"border-rose-400/60 bg-rose-500/15 text-rose-100",
 bonus:"border-amber-300/40 bg-amber-300/[.08] text-amber-100",
};
const tileIcon:Record<string,string>={start:"🏁",company:"◆",news:"📰",tax:"⚖",dividend:"💸",market:"📈",ipo:"🚀",jail:"🔒",parking:"🅿",go_to_jail:"🚨",bonus:"✦"};

export function StockMonopolyGame({roomCode,players,session,gameState,onRoll,onBuy,onPass,onUpgrade,onMarketTrade,onBail,onEndTurn}:Props){
 const [quantity,setQuantity]=useState(1);
 const mine=gameState.currentTurn===session.playerId;
 const bankrupt=gameState.bankrupt.includes(session.playerId);
 const jailed=gameState.jailed.includes(session.playerId);
 const canAct=mine&&!bankrupt&&!gameState.gameOver;
 const cash=gameState.cash[session.playerId]??0;
 const holdings=gameState.holdings[session.playerId]??{};
 const current=players.find(p=>p.id===gameState.currentTurn);
 const winner=players.find(p=>p.id===gameState.winner);
 const netWorth=calculateStockNetWorth(gameState,session.playerId);
 const portfolioValue=netWorth-cash;
 const myProperties=STOCK_BOARD.filter(tile=>tile.type==="company"&&gameState.properties[String(tile.index)]?.ownerId===session.playerId);
 const ranking=useMemo(()=>[...players].sort((a,b)=>calculateStockNetWorth(gameState,b.id)-calculateStockNetWorth(gameState,a.id)),[players,gameState]);
 const landed=gameState.lastLandedTile===null?null:STOCK_BOARD[gameState.lastLandedTile];
 const offer=gameState.pendingPurchase;
 const upgrade=gameState.pendingUpgrade;
 const marketCanTrade=canAct&&gameState.hasRolled&&gameState.marketOpen&&!gameState.marketTradeUsed;
 const playerColor=(id:string)=>PLAYER_COLORS[Math.max(0,players.findIndex(p=>p.id===id))%PLAYER_COLORS.length];

 return <div className="mx-auto grid max-w-[1700px] gap-4 text-slate-100">
  <section className="relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-[linear-gradient(120deg,#071522,#0c2632_52%,#131d32)] p-4 shadow-[0_18px_60px_rgba(0,0,0,.3)] sm:p-6">
   <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-cyan-300/[.08] blur-3xl"/>
   <div className="relative flex flex-wrap items-end justify-between gap-4">
    <div><p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.3em] text-cyan-300"><Landmark size={14}/> CYBER CHMEL CAPITAL EXCHANGE</p>
     <h2 className="mt-2 font-display text-3xl tracking-wide sm:text-5xl">AKCIOVÉ <span className="text-lime-300">MONOPOLY</span></h2>
     <p className="mt-1 text-xs text-slate-400">Hoď kostkami. Kupuj podíly. Vybírej nájem. Ovládni celý trh.</p>
    </div>
    <div className="flex gap-2">
     <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"><p className="text-[9px] font-bold tracking-[.2em] text-slate-500">MÍSTNOST</p><p className="font-mono text-lg font-black tracking-widest">{roomCode}</p></div>
     <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"><p className="text-[9px] font-bold tracking-[.2em] text-slate-500">TAH</p><p className="font-mono text-lg font-black">{gameState.turn}<span className="text-slate-500">/{gameState.maxTurns}</span></p></div>
    </div>
   </div>
   <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
    <div className="rounded-xl border border-lime-300/20 bg-black/20 p-3"><p className="text-[9px] font-bold uppercase tracking-[.18em] text-slate-500">HOTOVOST</p><p className="mt-1 font-display text-2xl text-lime-300">{formatCredits(cash)}</p></div>
    <div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-[9px] font-bold uppercase tracking-[.18em] text-slate-500">PORTFOLIO</p><p className="mt-1 font-display text-2xl">{formatCredits(portfolioValue)}</p></div>
    <div className="rounded-xl border border-cyan-300/20 bg-black/20 p-3"><p className="text-[9px] font-bold uppercase tracking-[.18em] text-slate-500">ČISTÉ JMĚNÍ</p><p className="mt-1 font-display text-2xl text-cyan-200">{formatCredits(netWorth)}</p></div>
    <div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-[9px] font-bold uppercase tracking-[.18em] text-slate-500">KOUPENÉ FIRMY</p><p className="mt-1 font-display text-2xl">{myProperties.length}<span className="ml-1 text-xs text-slate-500">/ 16 polí</span></p></div>
   </div>
  </section>

  <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.72fr)]">
   <section className="min-w-0 rounded-2xl border border-white/10 bg-[#08131f] p-3 sm:p-4">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
     <div><p className="text-[10px] font-black uppercase tracking-[.28em] text-cyan-300">HERNÍ PLÁN · 40 POLÍ</p><p className="text-xs text-slate-500">Firemní podíly · nájmy · burzovní události</p></div>
     <div className={`rounded-full border px-3 py-1.5 text-xs font-black tracking-wide ${mine&&!gameState.gameOver?"border-lime-300/30 bg-lime-300/10 text-lime-200":"border-white/10 bg-black/20 text-slate-300"}`}>
      {gameState.gameOver?"BURZA UZAVŘENA":jailed?"VE VĚZENÍ":mine?"TVŮJ TAH":`NA TAHU: ${current?.name??"—"}`}
     </div>
    </div>
    <div className="overflow-x-auto pb-2">
     <div className="relative grid aspect-square min-w-[740px] grid-cols-11 grid-rows-11 gap-1 rounded-xl border border-cyan-300/20 bg-[#040b13] p-2 sm:gap-1.5 sm:p-3">
      {STOCK_BOARD.map(tile=>{
       const company=tile.ticker?STOCKS.find(s=>s.ticker===tile.ticker):undefined;
       const owner=gameState.properties[String(tile.index)];
       const owned=Boolean(owner?.ownerId);
       const ownerName=owned?players.find(p=>p.id===owner?.ownerId)?.name??"investor":null;
       const occupants=players.filter(p=>gameState.positions[p.id]===tile.index&&!gameState.bankrupt.includes(p.id));
       const isLanded=gameState.lastLandedTile===tile.index&&gameState.hasRolled;
       return <div key={tile.index} style={{gridColumnStart:tile.col,gridRowStart:tile.row}} title={tile.note}
        className={`relative flex min-h-0 min-w-0 flex-col items-center justify-between overflow-hidden rounded-md border px-0.5 py-1 text-center ${tileTheme[tile.type]} ${isLanded?"ring-2 ring-lime-300 ring-offset-1 ring-offset-[#040b13]":""}`}>
        {company&&<span className="absolute inset-x-0 top-0 h-1" style={{backgroundColor:company.color}}/>}
        <span className="mt-0.5 text-xs leading-none sm:text-sm">{tileIcon[tile.type]}</span>
        <span className="max-w-full truncate text-[7px] font-black leading-tight tracking-tight sm:text-[9px]">{tile.label}</span>
        {company&&<span className="hidden max-w-full truncate text-[7px] opacity-70 sm:block">{formatCredits(gameState.prices[company.ticker]??company.price)}</span>}
        {owned&&owner&&<span className="flex items-center gap-1 text-[6px] font-bold sm:text-[7px]"><span className="h-1.5 w-1.5 rounded-full" style={{backgroundColor:playerColor(owner.ownerId)}}/>{owner.level===1?"AKCIE":owner.level===2?"PODÍL II":"PODÍL III"}</span>}
        {occupants.length>0&&<span className="flex max-w-full flex-wrap justify-center gap-0.5">{occupants.map(p=><span key={p.id} title={p.name} className="grid h-3.5 w-3.5 place-items-center rounded-full border border-black/50 text-[7px] font-black text-black sm:h-4 sm:w-4 sm:text-[8px]" style={{background:playerColor(p.id)}}>{p.name.slice(0,1).toUpperCase()}</span>)}</span>}
        {owned&&ownerName&&<span className="hidden max-w-full truncate text-[6px] opacity-65 sm:block">{ownerName}</span>}
       </div>;
      })}
      <div className="col-start-2 col-span-9 row-start-2 row-span-9 flex min-w-0 flex-col items-center justify-between overflow-hidden rounded-lg border border-cyan-300/15 bg-[radial-gradient(circle_at_50%_36%,rgba(34,211,238,.14),transparent_60%),linear-gradient(145deg,#102337,#08131e)] p-3 text-center sm:p-5">
       <div className="w-full">
        <p className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[.35em] text-cyan-300/65"><Landmark size={13}/> CHMEL CAPITAL EXCHANGE</p>
        <h3 className="mt-2 font-display text-2xl tracking-wider text-white sm:text-4xl">VYBUDUJ <span className="text-lime-300">IMPÉRIUM</span></h3>
        <p className="mt-1 text-[9px] text-slate-500 sm:text-xs">Kupuj firmy · vybírej nájem · obchoduj s akciemi</p>
       </div>
       {gameState.gameOver?<div className="my-auto"><Trophy className="mx-auto text-lime-300" size={36}/><p className="mt-2 font-display text-3xl text-lime-300">HRA SKONČILA</p><p className="mt-2 text-sm text-slate-300">{winner?`Vítězí ${winner.name}`:"Bez vítěze"}</p><p className="font-display text-2xl text-white">{winner?formatCredits(calculateStockNetWorth(gameState,winner.id)):"—"}</p></div>:<>
        <div className="my-3">
         <p className="font-display text-xl leading-tight text-white sm:text-3xl">{mine?"JSTE NA TAHU":`HRAJE ${current?.name?.toUpperCase()??"—"}`}</p>
         <div className="mt-3 flex items-center justify-center gap-4">
          {[0,1].map(index=><div key={index} className="grid h-14 w-14 place-items-center rounded-xl border border-white/15 bg-[#07111c] text-4xl shadow-[0_8px_20px_rgba(0,0,0,.25)] sm:h-16 sm:w-16">{gameState.lastRoll?DICE_GLYPHS[gameState.lastRoll[index]??0]:"?"}</div>)}
         </div>
         <p className="mt-2 text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">{gameState.lastRoll?`HOD: ${gameState.lastRoll[0]} + ${gameState.lastRoll[1]} = ${gameState.lastRoll[0]+gameState.lastRoll[1]}`:"HOĎ DVĚMA KOSTKAMI"}</p>
        </div>
        <div className="w-full max-w-[390px]">
         {gameState.jailed.includes(session.playerId)&&<div className="mb-3 rounded-lg border border-rose-300/35 bg-rose-300/10 p-3 text-left"><p className="flex items-center gap-2 text-xs font-black text-rose-200"><LockKeyhole size={14}/> JSI VE VĚZENÍ</p><p className="mt-1 text-[10px] text-slate-400">Zkus hodit dvojici kostek, nebo zaplať kauci 100 ₵.</p></div>}
         {offer&&mine&&<div className="mb-3 rounded-lg border border-lime-300/35 bg-lime-300/10 p-3 text-left"><p className="text-[9px] font-black uppercase tracking-[.22em] text-lime-200">FIRMA NA PRODEJ</p><p className="mt-1 text-sm font-bold text-white">{offer.ticker} · {STOCKS.find(s=>s.ticker===offer.ticker)?.name}</p><p className="text-xs text-slate-300">Podíl stojí {formatCredits(offer.price)}. Po koupi budeš vybírat nájem.</p><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" disabled={!canAct||cash<offer.price} onClick={onBuy} className="rounded-lg bg-lime-300 px-3 py-2 text-xs font-black text-[#101a12] disabled:opacity-30">KOUPIT PODÍL</button><button type="button" disabled={!canAct} onClick={onPass} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-black text-white">NEKOUPIT</button></div></div>}
         {upgrade&&mine&&<div className="mb-3 rounded-lg border border-cyan-300/35 bg-cyan-300/10 p-3 text-left"><p className="text-[9px] font-black uppercase tracking-[.22em] text-cyan-200">POSÍLIT VLASTNÍ FIRMU</p><p className="mt-1 text-xs text-white">{upgrade.ticker} · úroveň lze navýšit za {formatCredits(upgrade.price)}.</p><button type="button" disabled={!canAct||cash<upgrade.price} onClick={onUpgrade} className="mt-2 w-full rounded-lg bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 disabled:opacity-30">PŘIKOUPIT PODÍL</button></div>}
         {!gameState.hasRolled&&<button type="button" disabled={!canAct} onClick={onRoll} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-lime-300 px-4 py-2 font-display text-xl tracking-wide text-[#101a12] shadow-[0_8px_24px_rgba(196,248,42,.16)] transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-35"><Dice5 size={19}/>{jailed?"HODIT KOSTKAMI":"HODIT DVĚMA KOSTKAMI"}</button>}
         {jailed&&canAct&&<button type="button" onClick={onBail} disabled={cash<100} className="mt-2 w-full rounded-lg border border-rose-300/40 bg-rose-300/10 px-4 py-2 text-xs font-black text-rose-100 disabled:opacity-30">ZAPLATIT KAUCI 100 ₵</button>}
         {gameState.hasRolled&&mine&&!gameState.gameOver&&<button type="button" onClick={onEndTurn} disabled={!canAct||Boolean(gameState.pendingPurchase)} className="mt-2 min-h-11 w-full rounded-lg border border-white/15 bg-white/[.05] px-4 py-2 text-xs font-black uppercase tracking-[.14em] text-slate-200 transition hover:border-cyan-300/50 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-30">{gameState.extraTurn?"UKONČIT TAH / VYUŽÍT DALŠÍ HOD":"UKONČIT TAH A PŘEJÍT NA DALŠÍHO HRÁČE"}</button>}
         {gameState.marketOpen&&mine&&<p className="mt-2 text-center text-[9px] font-bold uppercase tracking-[.2em] text-sky-200">BURZOVNÍ TERMINÁL OTEVŘEN — V JEDNOM TAHU JEDEN OBCHOD</p>}
        </div>
       </>}
       {landed&&gameState.hasRolled&&!gameState.gameOver&&<div className="mt-3 w-full rounded-lg border border-white/10 bg-black/20 p-2"><p className="text-[9px] font-black uppercase tracking-[.2em] text-slate-500">AKTUÁLNÍ POLÍČKO</p><p className="mt-0.5 text-sm font-bold text-white">{landed.label} <span className="text-slate-400">· {landed.note}</span></p></div>}
       <div className="mt-3 flex flex-wrap justify-center gap-2 text-[8px] font-bold uppercase tracking-wider text-slate-500 sm:text-[9px]"><span>START +200</span><span>·</span><span>VĚZENÍ</span><span>·</span><span>VOLNÉ PARKOVÁNÍ</span><span>·</span><span>BURZA</span></div>
      </div>
     </div>
    </div>
    <p className="mt-1 text-center text-[10px] text-slate-600">Figurky hráčů se pohybují po 40 políčkách po směru hodinových ručiček. Vlastník firmy inkasuje nájem.</p>
   </section>

   <aside className="grid content-start gap-4">
    <section className="rounded-2xl border border-white/10 bg-[#091522] p-4">
     <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Wallet size={16} className="text-lime-300"/><h3 className="font-display text-xl">INVESTOŘI</h3></div><span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">ČISTÉ JMĚNÍ</span></div>
     <div className="grid gap-2">{ranking.map((p,index)=>{
      const out=gameState.bankrupt.includes(p.id),inJail=gameState.jailed.includes(p.id),propertyCount=Object.values(gameState.properties).filter(property=>property.ownerId===p.id).length;
      return <div key={p.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${p.id===gameState.currentTurn?"border-lime-300/40 bg-lime-300/[.06]":"border-white/[.07] bg-black/15"} ${out?"opacity-40":""}`}>
       <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-black text-black" style={{background:playerColor(p.id)}}>{index+1}</span>
       <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{p.name}{p.id===session.playerId?" · ty":""}</p><p className="text-[10px] text-slate-500">{out?"BANKROT":inJail?"VE VĚZENÍ":`${propertyCount} firem · ${Object.values(gameState.holdings[p.id]??{}).reduce((n,q)=>n+q,0)} akcií`}</p></div>
       <span className="font-mono text-xs font-bold text-cyan-200">{formatCredits(calculateStockNetWorth(gameState,p.id))}</span>
      </div>;
     })}</div>
    </section>
    <section className="rounded-2xl border border-white/10 bg-[#091522] p-4">
     <div className="mb-3 flex items-center gap-2"><Building2 size={16} className="text-cyan-300"/><h3 className="font-display text-xl">MOJE FIRMY</h3></div>
     {myProperties.length===0?<p className="rounded-lg border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">Zatím nevlastníš žádnou firmu. Hoď kostkami a kup první podíl.</p>:<div className="grid gap-2">{myProperties.map(tile=>{
       const company=STOCKS.find(stock=>stock.ticker===tile.ticker),property=gameState.properties[String(tile.index)];
       if(!company||!property)return null;
       return <div key={tile.index} className="flex items-center gap-2 rounded-lg border border-white/[.08] bg-black/15 p-2">
        <span className="grid h-8 w-8 place-items-center rounded-md text-xs font-black text-slate-950" style={{background:company.color}}>{company.mark}</span>
        <div className="min-w-0 flex-1"><p className="text-xs font-black">{company.ticker} <span className="font-normal text-slate-500">· úroveň {property.level}</span></p><p className="text-[10px] text-slate-500">Nájem {formatCredits(getCompanyRent(gameState,tile.index))}</p></div>
       </div>;
     })}</div>}
    </section>
    <section className="rounded-2xl border border-white/10 bg-[#091522] p-4">
     <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Coins size={16} className="text-sky-300"/><h3 className="font-display text-xl">BURZOVNÍ KURZY</h3></div><span className="text-[9px] text-slate-500">BANK {formatCredits(gameState.freeParkingPool)}</span></div>
     <div className="grid gap-1.5">{STOCKS.map(stock=>{
       const price=gameState.prices[stock.ticker]??stock.price,shares=holdings[stock.ticker]??0;
       return <div key={stock.ticker} className="flex items-center gap-2 rounded-lg border border-white/[.07] bg-black/15 px-2 py-1.5">
        <span className="grid h-6 w-6 place-items-center rounded text-[10px] font-black text-slate-950" style={{background:stock.color}}>{stock.mark}</span>
        <div className="min-w-0 flex-1"><p className="font-mono text-[10px] font-black">{stock.ticker}</p><p className="text-[9px] text-slate-600">{shares} ks v portfoliu</p></div>
        <span className="font-mono text-[10px] font-bold text-cyan-200">{formatCredits(price)}</span>
       </div>;
     })}</div>
    </section>
    <section className="rounded-2xl border border-white/10 bg-[#091522] p-4">
     <div className="mb-3 flex items-center gap-2"><Activity size={16} className="text-violet-300"/><h3 className="font-display text-xl">DĚNÍ NA TRHU</h3></div>
     <div className="grid gap-2">{gameState.log.slice(0,7).map(entry=><div key={entry.id} className="border-l-2 border-violet-300/45 pl-3"><p className="text-[10px] leading-relaxed text-slate-300">{entry.text}</p><p className="text-[8px] font-bold uppercase tracking-widest text-slate-600">TAH {entry.turn}</p></div>)}</div>
    </section>
   </aside>
  </div>

  {gameState.marketOpen&&mine&&gameState.hasRolled&&<section className="rounded-2xl border border-sky-300/25 bg-[#091522] p-4 sm:p-5">
   <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><CircleDollarSign size={18} className="text-sky-300"/><h3 className="font-display text-xl">BURZOVNÍ PŘEPÁŽKA</h3></div><span className="text-[10px] font-bold uppercase tracking-wider text-sky-200">{gameState.marketTradeUsed?"OBCHOD JIŽ PROVEDEN":"MŮŽEŠ PROVÉST JEDEN OBCHOD"}</span></div>
   {gameState.pendingOffer&&<p className="mb-3 rounded-lg border border-pink-300/25 bg-pink-300/10 p-2 text-xs text-pink-100">IPO nabídka: {gameState.pendingOffer.ticker} se slevou 20 %. Nabídka platí pouze pro tento obchod.</p>}
   <div className="mb-3 flex flex-wrap items-center gap-3"><label htmlFor="stock-trade-quantity" className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">POČET AKCIÍ</label><select id="stock-trade-quantity" value={quantity} onChange={e=>setQuantity(Number(e.target.value))} className="rounded-lg border border-white/10 bg-[#101f2d] px-3 py-1.5 text-xs font-bold text-white">{Array.from({length:20},(_,i)=>i+1).map(n=><option key={n} value={n}>{n} ks</option>)}</select><span className="ml-auto text-[10px] text-slate-500">Nákup za kurz · prodej za 90 % kurzu</span></div>
   <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{STOCKS.filter(stock=>!gameState.pendingOffer||stock.ticker===gameState.pendingOffer.ticker).map(stock=>{
    const price=gameState.prices[stock.ticker]??stock.price,discount=gameState.pendingOffer?.discount??0,buyPrice=Math.round(price*(1-discount))*quantity,owned=holdings[stock.ticker]??0;
    return <article key={stock.ticker} className="rounded-xl border border-white/[.09] bg-black/15 p-3"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-md text-xs font-black text-slate-950" style={{background:stock.color}}>{stock.mark}</span><div><p className="font-mono text-xs font-black">{stock.ticker}</p><p className="text-[9px] text-slate-500">{stock.name}</p></div></div><span className="font-mono text-xs font-bold text-cyan-200">{formatCredits(price)}</span></div>
     <p className="mt-2 text-[10px] text-slate-500">Držíš {owned} ks{discount>0?" · IPO −20 %":""}</p>
     <div className="mt-2 grid grid-cols-2 gap-2"><button type="button" disabled={!marketCanTrade||buyPrice>cash} onClick={()=>onMarketTrade(stock.ticker,quantity,"buy")} className="rounded-lg bg-sky-300/15 px-2 py-2 text-[10px] font-black uppercase text-sky-100 disabled:opacity-25">Koupit</button><button type="button" disabled={!marketCanTrade||owned<quantity} onClick={()=>onMarketTrade(stock.ticker,quantity,"sell")} className="rounded-lg border border-rose-300/20 px-2 py-2 text-[10px] font-black uppercase text-rose-100 disabled:opacity-25">Prodat</button></div>
    </article>;
   })}</div>
  </section>}

  {jailed&&<p className="rounded-xl border border-rose-300/30 bg-rose-300/10 p-3 text-xs text-rose-100">Jsi ve vězení. Hoď dvojici kostek, nebo zaplať kauci 100 ₵. Po třech neúspěšných pokusech se kauce strhne automaticky.</p>}
  {bankrupt&&<p className="rounded-xl border border-rose-300/30 bg-rose-300/10 p-3 text-xs font-bold text-rose-100">Tvůj investor vyhlásil bankrot. Ostatní pokračují v boji o trh.</p>}
  {gameState.gameOver&&<p className="flex items-center gap-2 rounded-xl border border-lime-300/25 bg-lime-300/10 p-4 text-sm font-bold text-lime-100"><Trophy size={18}/> Hra skončila. Vítězí nejvyšší čisté jmění.</p>}
 </div>;
}
