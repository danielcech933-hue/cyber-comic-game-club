import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-room-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const API_KEYS = [
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY"),
  Deno.env.get("SUPABASE_ANON_KEY"),
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50emppcnNlamZ2Z3Z1aG1icXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NTk1NDYsImV4cCI6MjEwMjEzNTU0Nn0.kcFxKvyxqYL0c7EcCnJ8SYhBDp-gdOeUgQ-toOK5sfI",
  "sb_publishable_h6OPGkq8kd5c1wvqLlQ02g_VdQ9Vjw1"
].filter((key): key is string => Boolean(key));
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

type Player = { room_code: string; player_id: string; display_name: string; token_hash: string; is_host: boolean; online: boolean };
type Question = { id: string; asker: string; text: string; yes?: boolean; answered: boolean };
type Guess = { id: string; asker: string; target: string; characterId: number; correct?: boolean; answered: boolean };
type RoomState = {
  app: "cyber-comic-game-club";
  game: GameId;
  status: "waiting" | "playing";
  maxPlayers: number;
  secrets: Record<string, number>;
  selectedPlayers: string[];
  questions: Record<string, Question[]>;
  guesses: Guess[];
  stock: StockGameState | null;
};


type GameId = "guess-who" | "stock-monopoly";
type StockGameState = {
  turnOrder:string[];
  currentTurn:string;
  positions:Record<string,number>;
  cash:Record<string,number>;
  holdings:Record<string,Record<string,number>>;
  prices:Record<string,number>;
  properties:Record<string,{ownerId:string;level:number}>;
  bankrupt:string[];
  jailed:string[];
  jailTurns:Record<string,number>;
  doublesCount:Record<string,number>;
  hasRolled:boolean;
  lastRoll:[number,number]|null;
  turn:number;
  maxTurns:number;
  pendingPurchase:{tileIndex:number;ticker:string;price:number}|null;
  pendingUpgrade:{tileIndex:number;ticker:string;price:number}|null;
  pendingOffer:{ticker:string;discount:number}|null;
  marketOpen:boolean;
  marketTradeUsed:boolean;
  extraTurn:boolean;
  lastLandedTile:number|null;
  freeParkingPool:number;
  log:Array<{id:string;turn:number;text:string}>;
  gameOver:boolean;
  winner:string|null;
};
type StockTile = {type:"start"|"company"|"news"|"tax"|"dividend"|"market"|"ipo"|"jail"|"parking"|"go_to_jail"|"bonus";ticker?:string};
const STOCKS = [
  {ticker:"NOVA",name:"Nova Dynamics",price:120},
  {ticker:"VOLT",name:"Volt Energy",price:95},
  {ticker:"AERO",name:"AeroWorks",price:145},
  {ticker:"CHIP",name:"ChipForge",price:180},
  {ticker:"ORBT",name:"Orbit Labs",price:110},
  {ticker:"GRIN",name:"GreenCore",price:85},
  {ticker:"BYTE",name:"ByteBank",price:130},
  {ticker:"NEXO",name:"Nexo Mobility",price:105},
] as const;
const STOCK_TILES:StockTile[] = [
  {type:"start"},{type:"company",ticker:"NOVA"},{type:"news"},{type:"company",ticker:"VOLT"},
  {type:"tax"},{type:"company",ticker:"BYTE"},{type:"market"},{type:"company",ticker:"AERO"},
  {type:"dividend"},{type:"company",ticker:"CHIP"},{type:"jail"},{type:"company",ticker:"ORBT"},
  {type:"news"},{type:"company",ticker:"GRIN"},{type:"tax"},{type:"company",ticker:"NEXO"},
  {type:"company",ticker:"NOVA"},{type:"ipo"},{type:"company",ticker:"VOLT"},{type:"company",ticker:"BYTE"},
  {type:"parking"},{type:"company",ticker:"AERO"},{type:"news"},{type:"company",ticker:"CHIP"},
  {type:"tax"},{type:"company",ticker:"ORBT"},{type:"market"},{type:"company",ticker:"GRIN"},
  {type:"dividend"},{type:"company",ticker:"NEXO"},{type:"go_to_jail"},{type:"news"},
  {type:"tax"},{type:"market"},{type:"dividend"},{type:"ipo"},{type:"news"},
  {type:"tax"},{type:"market"},{type:"bonus"},
];
function createStockGame(players:Array<{player_id:string}>):StockGameState {
  const order=players.map(p=>p.player_id);
  const cash:Record<string,number>={},positions:Record<string,number>={},holdings:Record<string,Record<string,number>>={};
  const jailTurns:Record<string,number>={},doublesCount:Record<string,number>={};
  for(const id of order){cash[id]=2500;positions[id]=0;holdings[id]={};jailTurns[id]=0;doublesCount[id]=0;}
  return {
    turnOrder:order,currentTurn:order[0],positions,cash,holdings,
    prices:Object.fromEntries(STOCKS.map(s=>[s.ticker,s.price])),properties:{},
    bankrupt:[],jailed:[],jailTurns,doublesCount,hasRolled:false,lastRoll:null,
    turn:1,maxTurns:order.length*30,pendingPurchase:null,pendingUpgrade:null,pendingOffer:null,
    marketOpen:false,marketTradeUsed:false,extraTurn:false,lastLandedTile:null,freeParkingPool:0,
    log:[{id:crypto.randomUUID(),turn:1,text:"Burza se otevírá. Každý investor dostává 2 500 ₵. Hoď dvěma kostkami a kupuj podíly ve firmách."}],
    gameOver:false,winner:null,
  };
}
function addStockLog(s:StockGameState,text:string){
  s.log.unshift({id:crypto.randomUUID(),turn:s.turn,text});s.log=s.log.slice(0,24);
}
function stockActivePlayers(s:StockGameState){return s.turnOrder.filter(id=>!s.bankrupt.includes(id));}
function stockPropertyMultiplier(s:StockGameState,ticker:string,ownerId:string){
  const matching=STOCK_TILES.map((tile,index)=>tile.type==="company"&&tile.ticker===ticker?String(index):"")
    .filter(Boolean);
  return matching.length>1&&matching.every(index=>s.properties[index]?.ownerId===ownerId)?2:1;
}
function stockNetWorth(s:StockGameState,id:string){
  const shares=Object.entries(s.holdings[id]??{}).reduce((sum,[ticker,qty])=>sum+(s.prices[ticker]??0)*qty,0);
  const deeds=Object.entries(s.properties).filter(([,property])=>property.ownerId===id)
    .reduce((sum,[index,property])=>{
      const ticker=STOCK_TILES[Number(index)]?.ticker??"";
      const price=s.prices[ticker]??0;
      return sum+price*(5+Math.max(0,property.level-1)*2);
    },0);
  return (s.cash[id]??0)+shares+deeds;
}
function finishStockGame(s:StockGameState){
  const active=stockActivePlayers(s);
  if(active.length<=1||s.turn>s.maxTurns){
    s.gameOver=true;
    s.winner=active.length?[...active].sort((a,b)=>stockNetWorth(s,b)-stockNetWorth(s,a))[0]:null;
    addStockLog(s,s.winner?"BURZA UZAVŘENA. Vítěz má nejvyšší čisté jmění.":"BURZA UZAVŘENA. Všichni investoři zkrachovali.");
  }
}
function bankruptStockPlayer(s:StockGameState,id:string){
  if(s.bankrupt.includes(id))return;
  s.bankrupt.push(id);
  for(const property of Object.values(s.properties))if(property.ownerId===id){property.ownerId="";property.level=0;}
  s.holdings[id]={};
  s.jailed=s.jailed.filter(playerId=>playerId!==id);
  addStockLog(s,"Investor vyhlásil bankrot. Jeho firemní podíly se vrací na trh.");
}
function chargeStockPlayer(s:StockGameState,payer:string,recipient:string|null,amount:number,label:string){
  const paid=Math.min(s.cash[payer]??0,amount);
  s.cash[payer]=(s.cash[payer]??0)-paid;
  if(recipient)s.cash[recipient]=(s.cash[recipient]??0)+paid;
  if(paid<amount)bankruptStockPlayer(s,payer);
  addStockLog(s,label+(paid<amount?" — nedostatek kapitálu, BANKROT.":" — zaplaceno "+paid+" ₵."));
}
function validTicker(t:string){return STOCKS.some(s=>s.ticker===t);}
function stockMarketDrift(s:StockGameState){
  for(const company of STOCKS)if(Math.random()<0.8){
    const percent=(Math.floor(Math.random()*5)+1)*(Math.random()<0.5?-1:1);
    s.prices[company.ticker]=Math.max(15,Math.min(600,Math.round((s.prices[company.ticker]??company.price)*(1+percent/100))));
  }
}
function advanceStockTurn(s:StockGameState,fromPlayerId:string){
  s.extraTurn=false;s.hasRolled=false;s.lastRoll=null;s.pendingPurchase=null;s.pendingUpgrade=null;
  s.marketOpen=false;s.marketTradeUsed=false;s.pendingOffer=null;s.turn++;
  stockMarketDrift(s);
  if(s.turn<=s.maxTurns){
    const index=s.turnOrder.indexOf(fromPlayerId);
    for(let step=1;step<=s.turnOrder.length;step++){
      const next=s.turnOrder[(index+step)%s.turnOrder.length];
      if(!s.bankrupt.includes(next)){s.currentTurn=next;break;}
    }
    if(!s.bankrupt.includes(s.currentTurn))addStockLog(s,"NA TAHU: "+(s.turnOrder.indexOf(s.currentTurn)+1)+". investor.");
  }
  finishStockGame(s);
}
function moveStockPlayer(s:StockGameState,id:string,steps:number){
  const old=s.positions[id]??0,total=old+steps,next=total%STOCK_TILES.length;
  if(total>=STOCK_TILES.length){
    s.cash[id]=(s.cash[id]??0)+200;
    addStockLog(s,"PRŮCHOD PŘES START: +200 ₵.");
  }
  s.positions[id]=next;s.lastLandedTile=next;
  return next;
}
function resolveStockTile(s:StockGameState,id:string,position:number){
  const tile=STOCK_TILES[position];
  if(tile.type==="start"){
    addStockLog(s,"DOPAD NA START: vyzvedáváš 200 ₵ za průchod přes start.");
  }else if(tile.type==="company"&&tile.ticker){
    const property=s.properties[String(position)];
    const price=s.prices[tile.ticker]??100;
    if(!property||!property.ownerId){
      const purchasePrice=price*5;
      s.pendingPurchase={tileIndex:position,ticker:tile.ticker,price:purchasePrice};
      addStockLog(s,tile.ticker+" je na prodej. Můžeš koupit firemní podíl za "+purchasePrice+" ₵.");
    }else if(property.ownerId===id){
      if(property.level<3){
        const upgradePrice=price*2;
        s.pendingUpgrade={tileIndex:position,ticker:tile.ticker,price:upgradePrice};
        addStockLog(s,"Jsi na své firmě "+tile.ticker+". Můžeš přikoupit podíl a zvýšit nájem.");
      }else addStockLog(s,"Tato firma už má maximální investiční úroveň.");
    }else{
      const rent=Math.max(20,Math.round(price*0.45*property.level*stockPropertyMultiplier(s,tile.ticker,property.ownerId)));
      chargeStockPlayer(s,id,property.ownerId,rent,"NÁJEM U "+tile.ticker+" zaplacen vlastníkovi");
    }
  }else if(tile.type==="tax"){
    const tax=130;s.freeParkingPool+=Math.min(s.cash[id]??0,tax);chargeStockPlayer(s,id,null,tax,"Regulační daň odvedena do společného banku");
  }else if(tile.type==="news"){
    const company=STOCKS[Math.floor(Math.random()*STOCKS.length)];
    const percent=Math.floor(Math.random()*13)+8,up=Math.random()<0.5;
    s.prices[company.ticker]=Math.max(15,Math.round(s.prices[company.ticker]*(up?1+percent/100:1-percent/100)));
    addStockLog(s,"BURZOVNÍ ZPRÁVA: "+company.ticker+" "+(up?"posílil":"oslabil")+" o "+percent+" %.");
  }else if(tile.type==="dividend"){
    const ownedPropertyValue=Object.entries(s.properties).filter(([,p])=>p.ownerId===id).reduce((sum,[index,p])=>{
      const ticker=STOCK_TILES[Number(index)]?.ticker??"";return sum+(s.prices[ticker]??0)*(5+Math.max(0,p.level-1)*2);
    },0);
    const sharesValue=Object.entries(s.holdings[id]??{}).reduce((sum,[ticker,qty])=>sum+(s.prices[ticker]??0)*qty,0);
    const payout=Math.floor((ownedPropertyValue+sharesValue)*0.05);
    s.cash[id]=(s.cash[id]??0)+payout;
    addStockLog(s,"DIVIDENDY: tvoje portfolio vyplatilo "+payout+" ₵.");
  }else if(tile.type==="market"){
    s.marketOpen=true;
    addStockLog(s,"BURZA: terminál otevřen. Můžeš nakoupit nebo prodat volně obchodované akcie.");
  }else if(tile.type==="ipo"){
    const company=STOCKS[Math.floor(Math.random()*STOCKS.length)];
    s.marketOpen=true;s.pendingOffer={ticker:company.ticker,discount:0.2};
    addStockLog(s,"IPO: "+company.ticker+" nabízí akcie se slevou 20 %.");
  }else if(tile.type==="parking"){
    const reward=s.freeParkingPool;s.freeParkingPool=0;s.cash[id]=(s.cash[id]??0)+reward;
    addStockLog(s,"VOLNÉ PARKOVÁNÍ: vybíráš společný bank "+reward+" ₵.");
  }else if(tile.type==="go_to_jail"){
    s.positions[id]=10;s.jailed.push(id);s.jailTurns[id]=0;s.doublesCount[id]=0;
    s.extraTurn=false;addStockLog(s,"INSPEKCE BURZY: jdeš do vězení. Zkus hodit dvojici nebo zaplať kauci 100 ₵.");
  }else if(tile.type==="jail"){
    addStockLog(s,"NÁVŠTĚVA VĚZENÍ: nic se neděje.");
  }else if(tile.type==="bonus"){
    s.cash[id]=(s.cash[id]??0)+100;addStockLog(s,"TRŽNÍ BONUS: +100 ₵.");
  }
}

const CHARACTERS = [
  { name:"Ada", hair:"blond", glasses:true, cap:false, beard:false, headband:false, jersey:"neon" },
  { name:"Boris", hair:"černé", glasses:false, cap:true, beard:true, headband:false, jersey:"pink" },
  { name:"Cyril", hair:"holá", glasses:true, cap:false, beard:true, headband:false, jersey:"neon" },
  { name:"Dana", hair:"zrzavé", glasses:false, cap:false, beard:false, headband:true, jersey:"pink" },
  { name:"Emil", hair:"blond", glasses:false, cap:true, beard:false, headband:false, jersey:"neon" },
  { name:"Fany", hair:"černé", glasses:true, cap:false, beard:false, headband:true, jersey:"neon" },
  { name:"Gusta", hair:"zrzavé", glasses:false, cap:false, beard:true, headband:false, jersey:"neon" },
  { name:"Hela", hair:"blond", glasses:false, cap:false, beard:false, headband:true, jersey:"pink" },
  { name:"Igor", hair:"holá", glasses:false, cap:true, beard:false, headband:false, jersey:"pink" },
  { name:"Jana", hair:"černé", glasses:false, cap:false, beard:false, headband:false, jersey:"pink" },
  { name:"Kuba", hair:"zrzavé", glasses:true, cap:true, beard:false, headband:false, jersey:"pink" },
  { name:"Lola", hair:"blond", glasses:true, cap:true, beard:false, headband:false, jersey:"pink" },
  { name:"Mates", hair:"černé", glasses:false, cap:false, beard:true, headband:true, jersey:"neon" },
  { name:"Nora", hair:"zrzavé", glasses:true, cap:false, beard:false, headband:false, jersey:"neon" },
  { name:"Otto", hair:"holá", glasses:false, cap:false, beard:true, headband:false, jersey:"pink" },
  { name:"Pája", hair:"blond", glasses:false, cap:false, beard:false, headband:false, jersey:"neon" },
] as const;

const QUESTIONS = [
  { id:"glasses", text:"Má brýle?", test:(c:typeof CHARACTERS[number])=>c.glasses },
  { id:"cap", text:"Má kšiltovku?", test:(c:typeof CHARACTERS[number])=>c.cap },
  { id:"beard", text:"Má vousy?", test:(c:typeof CHARACTERS[number])=>c.beard },
  { id:"headband", text:"Má čelenku?", test:(c:typeof CHARACTERS[number])=>c.headband },
  { id:"blond", text:"Má blond vlasy?", test:(c:typeof CHARACTERS[number])=>c.hair==="blond" },
  { id:"black", text:"Má černé vlasy?", test:(c:typeof CHARACTERS[number])=>c.hair==="černé" },
  { id:"red", text:"Má zrzavé vlasy?", test:(c:typeof CHARACTERS[number])=>c.hair==="zrzavé" },
  { id:"bald", text:"Je holohlavý/á?", test:(c:typeof CHARACTERS[number])=>c.hair==="holá" },
  { id:"neon", text:"Má zelený dres?", test:(c:typeof CHARACTERS[number])=>c.jersey==="neon" },
];

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type":"application/json" } });
}
function tokenHash(token:string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)).then((hash)=>{
    const bytes = new Uint8Array(hash);
    return Array.from(bytes, (b)=>b.toString(16).padStart(2,"0")).join("");
  });
}
function randomHex(bytes=32) {
  const array = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(array, (b)=>b.toString(16).padStart(2,"0")).join("");
}
function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPRSTUVWXYZ23456789";
  const array = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(array, (b)=>alphabet[b % alphabet.length]).join("");
}
function validName(name:unknown): name is string {
  return typeof name==="string" && name.trim().length>=1 && name.trim().length<=18;
}
function safeState(raw:unknown):RoomState {
  const state=(raw&&typeof raw==="object"?raw:{}) as Partial<RoomState>;
  const game:GameId=state.game==="stock-monopoly"?"stock-monopoly":"guess-who";
  return {app:"cyber-comic-game-club",game,status:state.status==="playing"?"playing":"waiting",
    maxPlayers:Number.isInteger(state.maxPlayers)?Math.min(game==="stock-monopoly"?6:8,Math.max(2,state.maxPlayers!)):4,
    secrets:state.secrets&&typeof state.secrets==="object"?state.secrets:{},
    selectedPlayers:Array.isArray(state.selectedPlayers)?state.selectedPlayers.filter((n):n is string=>typeof n==="string"):Object.keys(state.secrets??{}),
    questions:state.questions&&typeof state.questions==="object"?state.questions:{},guesses:Array.isArray(state.guesses)?state.guesses:[],
    stock:game==="stock-monopoly"&&state.stock&&typeof state.stock==="object"?state.stock:null};
}
async function loadRoom(code:string) {
  const {data,error} = await admin.from("mm_rooms").select("code,room_state,expires_at,updated_at").eq("code",code).maybeSingle();
  if(error) throw error;
  if(!data || data.room_state?.app!=="cyber-comic-game-club" || new Date(data.expires_at).getTime() < Date.now()) return null;
  return { ...data, room_state:safeState(data.room_state) };
}
async function getPlayer(code:string,playerId:string,token:string) {
  if(!playerId || !token) return null;
  const hash = await tokenHash(token);
  const {data,error} = await admin.from("mm_room_players").select("room_code,player_id,display_name,token_hash,is_host,online").eq("room_code",code).eq("player_id",playerId).maybeSingle();
  if(error) throw error;
  if(!data) return null;
  const stored = String(data.token_hash ?? "").replace(/^\\x/i, "").toLowerCase();
  if(stored !== hash) return null;
  return data as Player;
}
async function publicSnapshot(code:string, state:RoomState) {
  const {data,error} = await admin.from("mm_room_players").select("player_id,display_name,is_host,online,joined_at").eq("room_code",code).order("joined_at",{ascending:true});
  if(error) throw error;
  return {
    code,
    game:state.game,
    status:state.status,
    max:state.maxPlayers,
    players:(data??[]).map((p)=>({id:p.player_id,name:p.display_name,isHost:p.is_host,online:p.online})),
  };
}
async function privateSnapshot(code:string,player:Player,state:RoomState) {
  const {data,error} = await admin.from("mm_room_players").select("player_id,display_name,is_host,online,joined_at").eq("room_code",code).order("joined_at",{ascending:true});
  if(error) throw error;
  const myName = player.display_name;
  const questions:Record<string,Question[]> = {};
  for (const [target,items] of Object.entries(state.questions)) {
    const visible = items.filter((q)=>q.asker===myName || target===myName);
    if(visible.length) questions[target]=visible;
  }
  const guesses = state.guesses.filter((g)=>g.asker===myName || g.target===myName || g.answered);
  return {
    code,
    game:state.game,
    status:state.status,
    max:state.maxPlayers,
    players:(data??[]).map((p)=>({id:p.player_id,name:p.display_name,isHost:p.is_host,online:p.online})),
    gameState:state.game==="stock-monopoly"?state.stock:{
      secrets:state.secrets[myName]===undefined?{}:{[myName]:state.secrets[myName]},selectedPlayers:state.selectedPlayers,questions,guesses,
    },
  };
}

async function saveStockState(code:string,state:RoomState,expectedUpdatedAt:string) {
  const {data,error}=await admin.from("mm_rooms").update({room_state:state,updated_at:new Date().toISOString()})
    .eq("code",code).eq("updated_at",expectedUpdatedAt).select("code").maybeSingle();
  if(error) throw error;
  return Boolean(data);
}

async function saveState(code:string,state:RoomState) {
  const {error} = await admin.from("mm_rooms").update({room_state:state,updated_at:new Date().toISOString()}).eq("code",code);
  if(error) throw error;
}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:corsHeaders});
  if(req.method!=="POST") return response({error:"method_not_allowed"},405);
  try {
    const apiKey = req.headers.get("apikey") ?? "";
    if(!API_KEYS.includes(apiKey)) return response({error:"unauthorized"},401);
    const body = await req.json().catch(()=>({})) as Record<string,unknown>;
    const action = String(body.action ?? "");
    const code = typeof body.code==="string" ? body.code.toUpperCase() : "";
    if(action==="list") {
      const {data,error} = await admin.from("mm_rooms").select("code,room_state,expires_at").gt("expires_at",new Date().toISOString()).order("updated_at",{ascending:false}).limit(60);
      if(error) throw error;
      const rooms = [];
      for(const row of data??[]) {
        if(row.room_state?.app!=="cyber-comic-game-club" || row.room_state?.status!=="waiting") continue;
        rooms.push(await publicSnapshot(row.code,safeState(row.room_state)));
      }
      return response({rooms});
    }
    if(action==="create") {
      const name=typeof body.name==="string"?body.name.trim():"";
      const max=Number(body.maxPlayers);
      const requestedGame:GameId=body.game==="stock-monopoly"?"stock-monopoly":"guess-who";
      const maxAllowed=requestedGame==="stock-monopoly"?6:8;
      if(!validName(name)||!Number.isInteger(max)||max<2||max>maxAllowed)return response({error:"invalid_room_settings"},400);
      let newCode="";
      for(let tries=0;tries<12;tries++) {
        const candidate=randomCode();
        const state:RoomState={app:"cyber-comic-game-club",game:requestedGame,status:"waiting",maxPlayers:max,secrets:{},selectedPlayers:[],questions:{},guesses:[],stock:null};
        const {error} = await admin.from("mm_rooms").insert({code:candidate,host_player_id:"host",room_state:state}).select("code").maybeSingle();
        if(!error) { newCode=candidate; break; }
      }
      if(!newCode) return response({error:"room_code_unavailable"},503);
      const playerId=crypto.randomUUID(), token=randomHex();
      const hash=await tokenHash(token);
      const {error:playerError}=await admin.from("mm_room_players").insert({room_code:newCode,player_id:playerId,display_name:name,token_hash:"\\x"+hash,is_host:true,online:true});
      if(playerError) { await admin.from("mm_rooms").delete().eq("code",newCode); throw playerError; }
      const loaded=await loadRoom(newCode);
      return response({...(await publicSnapshot(newCode,loaded!.room_state)),playerId,token});
    }
    if(!/^[A-Z0-9]{8}$/.test(code)) return response({error:"invalid_room_code"},400);
    if(action==="preview") {
      const loaded=await loadRoom(code);
      if(!loaded) return response({error:"room_not_found"},404);
      return response(await publicSnapshot(code,loaded.room_state));
    }
    const loaded=await loadRoom(code);
    if(!loaded) return response({error:"room_not_found"},404);
    const state=loaded.room_state;

    if(action==="join") {
      if(state.status!=="waiting") return response({error:"room_already_started"},409);
      const name=typeof body.name==="string"?body.name.trim():"";
      if(!validName(name)) return response({error:"invalid_name"},400);
      const {count,error:countError}=await admin.from("mm_room_players").select("*",{count:"exact",head:true}).eq("room_code",code);
      if(countError) throw countError;
      if((count??0)>=state.maxPlayers) return response({error:"room_full"},409);
      const {data:duplicate,error:duplicateError}=await admin.from("mm_room_players").select("player_id").eq("room_code",code).ilike("display_name",name).maybeSingle();
      if(duplicateError) throw duplicateError;
      if(duplicate) return response({error:"nickname_taken"},409);
      const newPlayerId=crypto.randomUUID(),newToken=randomHex(),hash=await tokenHash(newToken);
      const {error}=await admin.from("mm_room_players").insert({room_code:code,player_id:newPlayerId,display_name:name,token_hash:"\\x"+hash,is_host:false,online:true});
      if(error) throw error;
      return response({...(await publicSnapshot(code,state)),playerId:newPlayerId,token:newToken});
    }
    const playerId=String(body.playerId??"");
    const token=String(body.token??"");
    const player=await getPlayer(code,playerId,token);
    if(!player) return response({error:"invalid_player_session"},401);
    if(action==="get") {
      await admin.from("mm_room_players").update({online:true,last_seen_at:new Date().toISOString()}).eq("room_code",code).eq("player_id",playerId);
      return response(await privateSnapshot(code,player,state));
    }
    if(action==="start") {
      if(!player.is_host) return response({error:"host_only"},403);
      const {count,error}=await admin.from("mm_room_players").select("*",{count:"exact",head:true}).eq("room_code",code);
      if(error) throw error;
      if((count??0)<2) return response({error:"need_two_players"},409);
      state.status="playing";
      if(state.game==="stock-monopoly") {
        const {data:members,error:membersError}=await admin.from("mm_room_players").select("player_id").eq("room_code",code).order("joined_at",{ascending:true});
        if(membersError) throw membersError;
        state.stock=createStockGame(members??[]);
      }
      await saveState(code,state);
      return response(await privateSnapshot(code,player,state));
    }
    if(action==="leave") {
      await admin.from("mm_room_players").delete().eq("room_code",code).eq("player_id",playerId);
      const {count,error}=await admin.from("mm_room_players").select("*",{count:"exact",head:true}).eq("room_code",code);
      if(error) throw error;
      if((count??0)===0) await admin.from("mm_rooms").delete().eq("code",code);
      else {
        const {data:remaining}=await admin.from("mm_room_players").select("player_id,is_host").eq("room_code",code).order("joined_at",{ascending:true});
        if(remaining?.length && !remaining.some((p)=>p.is_host)) {
          await admin.from("mm_room_players").update({is_host:true}).eq("room_code",code).eq("player_id",remaining[0].player_id);
        }
      }
      if((count??0)>0 && state.game==="stock-monopoly" && state.stock) {
        const stock=state.stock;
        bankruptStockPlayer(stock,player.player_id);
        if(stock.currentTurn===player.player_id) {
          stock.hasRolled=false;stock.lastRoll=null;stock.extraTurn=false;stock.pendingPurchase=null;stock.pendingUpgrade=null;
          stock.marketOpen=false;stock.marketTradeUsed=false;stock.pendingOffer=null;stock.turn++;
          const startIndex=stock.turnOrder.indexOf(player.player_id);
          for(let step=1;step<=stock.turnOrder.length;step++) {
            const next=stock.turnOrder[(startIndex+step)%stock.turnOrder.length];
            if(!stock.bankrupt.includes(next)){stock.currentTurn=next;break;}
          }
        }
        finishStockGame(stock);
        await saveState(code,state);
      }
      return response({ok:true});
    }
    if(state.status!=="playing") return response({error:"game_not_started"},409);

    if(state.game==="stock-monopoly") {
      const s=state.stock;if(!s)return response({error:"stock_state_missing"},500);
      const mine=s.currentTurn===player.player_id;
      if(action==="stock_roll"){
        if(s.gameOver)return response({error:"game_finished"},409);
        if(!mine)return response({error:"not_your_turn"},409);
        if(s.hasRolled)return response({error:"turn_already_rolled"},409);
        if(s.bankrupt.includes(player.player_id))return response({error:"investor_bankrupt"},409);
        const die1=Math.floor(Math.random()*6)+1,die2=Math.floor(Math.random()*6)+1;
        s.lastRoll=[die1,die2];s.hasRolled=true;s.pendingPurchase=null;s.pendingUpgrade=null;s.marketOpen=false;s.marketTradeUsed=false;s.pendingOffer=null;
        const isDouble=die1===die2;
        if(s.jailed.includes(player.player_id)){
          if(isDouble){
            s.jailed=s.jailed.filter(id=>id!==player.player_id);s.jailTurns[player.player_id]=0;
            s.doublesCount[player.player_id]=0;addStockLog(s,"HODIL JSI DVOJICI A OPOUŠTÍŠ VĚZENÍ.");
          }else{
            s.jailTurns[player.player_id]=(s.jailTurns[player.player_id]??0)+1;
            if((s.jailTurns[player.player_id]??0)>=3){
              chargeStockPlayer(s,player.player_id,null,100,"Po třetím neúspěšném hodu byla stržena kauce 100 ₵");
              s.jailed=s.jailed.filter(id=>id!==player.player_id);s.jailTurns[player.player_id]=0;
              addStockLog(s,"Kauce zaplacena automaticky. Další tah už hraješ normálně.");
            }else addStockLog(s,"VĚZENÍ: nepadla dvojice. Zůstáváš zde ještě "+(3-(s.jailTurns[player.player_id]??0))+" pokus(y). Můžeš zaplatit kauci.");
            if(s.bankrupt.includes(player.player_id))advanceStockTurn(s,player.player_id);
            if(!(await saveStockState(code,state,loaded.updated_at)))return response({error:"state_conflict"},409);
            return response(await privateSnapshot(code,player,state));
          }
        }
        if(!s.jailed.includes(player.player_id)){
          if(isDouble)s.doublesCount[player.player_id]=(s.doublesCount[player.player_id]??0)+1;
          else s.doublesCount[player.player_id]=0;
          if((s.doublesCount[player.player_id]??0)>=3){
            s.positions[player.player_id]=10;s.lastLandedTile=10;s.jailed.push(player.player_id);s.jailTurns[player.player_id]=0;s.doublesCount[player.player_id]=0;
            s.extraTurn=false;addStockLog(s,"TŘI DVOJICE ZA SEBOU. JDEŠ DO VĚZENÍ.");
          }else{
            const landed=moveStockPlayer(s,player.player_id,die1+die2);
            s.extraTurn=isDouble;
            resolveStockTile(s,player.player_id,landed);
            if(isDouble&&!s.jailed.includes(player.player_id))addStockLog(s,"PADLA DVOJICE — po vyřízení políčka házíš ještě jednou.");
          }
        }
        if(s.bankrupt.includes(player.player_id))advanceStockTurn(s,player.player_id);
        finishStockGame(s);
        if(!(await saveStockState(code,state,loaded.updated_at)))return response({error:"state_conflict"},409);
        return response(await privateSnapshot(code,player,state));
      }
      if(action==="stock_buy"){
        if(s.gameOver)return response({error:"game_finished"},409);
        if(!mine||!s.hasRolled||s.bankrupt.includes(player.player_id))return response({error:"not_your_turn"},409);
        const offer=s.pendingPurchase;if(!offer)return response({error:"no_property_offer"},409);
        if((s.cash[player.player_id]??0)<offer.price)return response({error:"not_enough_cash"},409);
        if(s.properties[String(offer.tileIndex)]?.ownerId)return response({error:"property_already_owned"},409);
        s.cash[player.player_id]-=offer.price;
        s.properties[String(offer.tileIndex)]={ownerId:player.player_id,level:1};
        s.pendingPurchase=null;
        addStockLog(s,player.display_name+" koupil podíl ve firmě "+offer.ticker+" za "+offer.price+" ₵.");
        if(!(await saveStockState(code,state,loaded.updated_at)))return response({error:"state_conflict"},409);
        return response(await privateSnapshot(code,player,state));
      }
      if(action==="stock_pass"){
        if(!mine||!s.hasRolled)return response({error:"not_your_turn"},409);
        if(!s.pendingPurchase)return response({error:"no_property_offer"},409);
        addStockLog(s,player.display_name+" odmítl koupit "+s.pendingPurchase.ticker+".");
        s.pendingPurchase=null;
        if(!(await saveStockState(code,state,loaded.updated_at)))return response({error:"state_conflict"},409);
        return response(await privateSnapshot(code,player,state));
      }
      if(action==="stock_upgrade"){
        if(s.gameOver)return response({error:"game_finished"},409);
        if(!mine||!s.hasRolled||s.bankrupt.includes(player.player_id))return response({error:"not_your_turn"},409);
        const offer=s.pendingUpgrade;if(!offer)return response({error:"no_upgrade_offer"},409);
        const property=s.properties[String(offer.tileIndex)];
        if(!property||property.ownerId!==player.player_id||property.level>=3)return response({error:"invalid_upgrade"},409);
        if((s.cash[player.player_id]??0)<offer.price)return response({error:"not_enough_cash"},409);
        s.cash[player.player_id]-=offer.price;property.level++;s.pendingUpgrade=null;
        addStockLog(s,player.display_name+" navýšil svůj podíl ve firmě "+offer.ticker+" na úroveň "+property.level+".");
        if(!(await saveStockState(code,state,loaded.updated_at)))return response({error:"state_conflict"},409);
        return response(await privateSnapshot(code,player,state));
      }
      if(action==="stock_trade"){
        if(s.gameOver)return response({error:"game_finished"},409);
        if(!mine||!s.hasRolled||!s.marketOpen||s.marketTradeUsed||s.bankrupt.includes(player.player_id))return response({error:"market_closed"},409);
        const ticker=String(body.ticker??""),quantity=Number(body.quantity),side=body.side==="sell"?"sell":"buy";
        if(!validTicker(ticker)||!Number.isInteger(quantity)||quantity<1||quantity>20)return response({error:"invalid_trade"},400);
        if(s.pendingOffer&&s.pendingOffer.ticker!==ticker)return response({error:"ipo_ticker_only"},409);
        const discount=s.pendingOffer?.ticker===ticker?s.pendingOffer.discount:0;
        if(side==="buy"){
          const unit=Math.max(1,Math.round((s.prices[ticker]??0)*(1-discount))),total=unit*quantity;
          if(total>(s.cash[player.player_id]??0))return response({error:"not_enough_cash"},409);
          s.cash[player.player_id]-=total;s.holdings[player.player_id]??={};
          s.holdings[player.player_id][ticker]=(s.holdings[player.player_id][ticker]??0)+quantity;
          addStockLog(s,player.display_name+" nakoupil "+quantity+" akcií "+ticker+" za "+total+" ₵.");
        }else{
          const owned=s.holdings[player.player_id]?.[ticker]??0;
          if(quantity>owned)return response({error:"not_enough_shares"},409);
          const proceeds=Math.round((s.prices[ticker]??0)*0.9)*quantity;
          s.holdings[player.player_id][ticker]=owned-quantity;
          if(s.holdings[player.player_id][ticker]===0)delete s.holdings[player.player_id][ticker];
          s.cash[player.player_id]=(s.cash[player.player_id]??0)+proceeds;
          addStockLog(s,player.display_name+" prodal "+quantity+" akcií "+ticker+" za "+proceeds+" ₵.");
        }
        s.marketTradeUsed=true;s.pendingOffer=null;
        if(!(await saveStockState(code,state,loaded.updated_at)))return response({error:"state_conflict"},409);
        return response(await privateSnapshot(code,player,state));
      }
      if(action==="stock_bail"){
        if(!mine||!s.jailed.includes(player.player_id))return response({error:"not_in_jail"},409);
        if((s.cash[player.player_id]??0)<100)return response({error:"not_enough_cash"},409);
        s.cash[player.player_id]-=100;s.jailed=s.jailed.filter(id=>id!==player.player_id);s.jailTurns[player.player_id]=0;
        addStockLog(s,player.display_name+" zaplatil kauci 100 ₵ a opouští vězení.");
        if(!(await saveStockState(code,state,loaded.updated_at)))return response({error:"state_conflict"},409);
        return response(await privateSnapshot(code,player,state));
      }
      if(action==="stock_end_turn"){
        if(s.gameOver)return response({error:"game_finished"},409);
        if(!mine)return response({error:"not_your_turn"},409);
        if(!s.hasRolled)return response({error:"roll_before_end"},409);
        if(s.pendingPurchase)return response({error:"purchase_or_pass"},409);
        if(s.extraTurn&&!s.jailed.includes(player.player_id)&&!s.bankrupt.includes(player.player_id)){
          s.extraTurn=false;s.hasRolled=false;s.pendingUpgrade=null;s.marketOpen=false;s.marketTradeUsed=false;s.pendingOffer=null;
          addStockLog(s,"PADLA DVOJICE — dostáváš další hod.");
        }else advanceStockTurn(s,player.player_id);
        if(!(await saveStockState(code,state,loaded.updated_at)))return response({error:"state_conflict"},409);
        return response(await privateSnapshot(code,player,state));
      }
      return response({error:"unknown_stock_action"},400);
    }
    if(action==="secret") {
      const characterId=Number(body.characterId);
      if(!Number.isInteger(characterId)||characterId<0||characterId>=CHARACTERS.length) return response({error:"invalid_character"},400);
      if(state.secrets[player.display_name]!==undefined) return response({error:"secret_already_selected"},409);
      state.secrets[player.display_name]=characterId;
      state.selectedPlayers=Array.from(new Set([...state.selectedPlayers,player.display_name]));
      await saveState(code,state);
      return response(await privateSnapshot(code,player,state));
    }
    if(action==="ask") {
      const target=String(body.target??"");
      const questionId=String(body.questionId??"");
      if(target===player.display_name || !/^[a-z]+$/.test(questionId)) return response({error:"invalid_target_or_question"},400);
      const {data:targetPlayer,error}=await admin.from("mm_room_players").select("display_name").eq("room_code",code).eq("display_name",target).maybeSingle();
      if(error) throw error;
      if(!targetPlayer || state.secrets[target]===undefined || state.secrets[player.display_name]===undefined) return response({error:"player_not_ready"},409);
      const question=QUESTIONS.find((q)=>q.id===questionId);
      if(!question) return response({error:"unknown_question"},400);
      const prior=state.questions[target]??[];
      if(prior.filter((q)=>q.asker===player.display_name).length>=6 || prior.some((q)=>q.asker===player.display_name && q.text===question.text)) return response({error:"question_limit_or_duplicate"},409);
      state.questions[target]=[...prior,{id:crypto.randomUUID(),asker:player.display_name,text:question.text,answered:false}];
      await saveState(code,state);
      return response(await privateSnapshot(code,player,state));
    }
    if(action==="answer_question") {
      const questionId=String(body.questionId??"");
      const questions=state.questions[player.display_name]??[];
      const question=questions.find((q)=>q.id===questionId && !q.answered);
      if(!question || state.secrets[player.display_name]===undefined) return response({error:"question_not_found"},404);
      const character=CHARACTERS[state.secrets[player.display_name]];
      const expected=QUESTIONS.find((q)=>q.text===question.text)?.test(character)??false;
      question.yes=expected;
      question.answered=true;
      await saveState(code,state);
      return response(await privateSnapshot(code,player,state));
    }
    if(action==="guess") {
      const target=String(body.target??""),characterId=Number(body.characterId);
      if(target===player.display_name || !Number.isInteger(characterId)||characterId<0||characterId>=CHARACTERS.length) return response({error:"invalid_guess"},400);
      const {data:targetPlayer,error}=await admin.from("mm_room_players").select("display_name").eq("room_code",code).eq("display_name",target).maybeSingle();
      if(error) throw error;
      if(!targetPlayer || state.secrets[target]===undefined) return response({error:"target_not_ready"},409);
      if(state.secrets[player.display_name]===undefined) return response({error:"secret_not_selected"},409);
      const guess:Guess={id:crypto.randomUUID(),asker:player.display_name,target,characterId,answered:false};
      state.guesses.push(guess);
      await saveState(code,state);
      return response(await privateSnapshot(code,player,state));
    }
    if(action==="answer_guess") {
      const guessId=String(body.guessId??"");
      const guess=state.guesses.find((g)=>g.id===guessId && g.target===player.display_name && !g.answered);
      if(!guess || state.secrets[player.display_name]===undefined) return response({error:"guess_not_found"},404);
      guess.correct=state.secrets[player.display_name]===guess.characterId;
      guess.answered=true;
      await saveState(code,state);
      return response(await privateSnapshot(code,player,state));
    }
    return response({error:"unknown_action"},400);
  } catch (error) {
    console.error("cyber-game error",error);
    return response({error:error instanceof Error?error.message:"internal_error"},500);
  }
});
