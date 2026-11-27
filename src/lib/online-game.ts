const SUPABASE_URL = "https://ntzjirsejfvgvuhmbqvt.supabase.co";
const SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50emppcnNlamZ2Z3Z1aG1icXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NTk1NDYsImV4cCI6MjEwMjEzNTU0Nn0.kcFxKvyxqYL0c7EcCnJ8SYhBDp-gdOeUgQ-toOK5sfI";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/cyber-game`;
const SESSION_PREFIX = "cyber-chmel-player:";
const ROOM_KEY = "cyber-chmel-current-room";

export type OnlinePlayer = { id: string; name: string; isHost: boolean; online: boolean };
export type OnlineRoomSummary = { code: string; game: "guess-who"; status: "waiting" | "playing"; max: number; players: OnlinePlayer[] };
export type OnlineQuestion = { id: string; asker: string; text: string; yes?: boolean; answered: boolean };
export type OnlineGuess = { id: string; asker: string; target: string; characterId: number; correct?: boolean; answered: boolean };
export type OnlineGameState = {
  secrets: Record<string, number>;
  selectedPlayers: string[];
  questions: Record<string, OnlineQuestion[]>;
  guesses: OnlineGuess[];
};
export type OnlineRoom = OnlineRoomSummary & { gameState: OnlineGameState };
export type PlayerSession = { playerId: string; token: string; displayName: string };

export class OnlineGameError extends Error {
  code: string;
  status: number;
  constructor(code:string,status:number) {
    const messages:Record<string,string> = {
      unauthorized:"Server odmítl přístup. Obnov stránku a zkus to znovu.",
      invalid_player_session:"Tvoje relace už není platná. Připoj se znovu.",
      player_session_missing:"Chybí relace hráče. Připoj se do místnosti znovu.",
      room_not_found:"Místnost neexistuje nebo už vypršela.",
      room_full:"Místnost je plná.",
      room_already_started:"Hra už začala.",
      nickname_taken:"Tuto přezdívku už v místnosti někdo používá.",
      invalid_name:"Přezdívka musí mít 1 až 18 znaků.",
      invalid_room_settings:"Neplatné nastavení místnosti.",
      need_two_players:"Ke spuštění hry jsou potřeba alespoň dva hráči.",
      host_only:"Hru může spustit pouze hostitel.",
      player_not_ready:"Soupeř ještě nemá vybranou tajnou postavu.",
      secret_not_selected:"Nejdřív si vyber tajnou postavu.",
      secret_already_selected:"Tajnou postavu už máš vybranou.",
      question_limit_or_duplicate:"Tuto otázku už jsi soupeři položil nebo jsi vyčerpal limit šesti otázek.",
      invalid_character:"Vybraná postava není platná.",
      unknown_question:"Tato otázka ve hře neexistuje.",
      invalid_room_code:"Kód místnosti musí mít osm znaků.",
    };
    super(messages[code] ?? code);
    this.name="OnlineGameError";
    this.code=code;
    this.status=status;
  }
}

function getStorage(key:string):Storage | null {
  try { return typeof localStorage!=="undefined" ? localStorage : null; }
  catch { return null; }
}
export function getPlayerSession(code:string):PlayerSession | null {
  const raw=getStorage(SESSION_PREFIX+code)?.getItem(SESSION_PREFIX+code);
  if(!raw) return null;
  try { return JSON.parse(raw) as PlayerSession; } catch { return null; }
}
export function savePlayerSession(code:string,session:PlayerSession) {
  getStorage(SESSION_PREFIX+code)?.setItem(SESSION_PREFIX+code,JSON.stringify(session));
}
export function forgetPlayerSession(code:string) {
  getStorage(SESSION_PREFIX+code)?.removeItem(SESSION_PREFIX+code);
}
export function setCurrentRoomCode(code:string | null) {
  const storage=getStorage(ROOM_KEY);
  if(code) storage?.setItem(ROOM_KEY,code);
  else storage?.removeItem(ROOM_KEY);
}
export function getCurrentRoomCode() {
  return getStorage(ROOM_KEY)?.getItem(ROOM_KEY) ?? null;
}

async function callApi<T>(action:string,payload:Record<string,unknown> = {},session?:PlayerSession):Promise<T> {
  const headers:Record<string,string> = {
    "Content-Type":"application/json",
    "apikey":SUPABASE_API_KEY,
  };
  if(session) {
    headers["x-room-token"]=session.token;
    payload["playerId"]=session.playerId;
    payload["token"]=session.token;
  }
  const response=await fetch(FUNCTION_URL,{
    method:"POST",
    headers,
    body:JSON.stringify({action,...payload}),
  });
  const json=await response.json().catch(()=>({error:"invalid_server_response"}));
  if(!response.ok) throw new OnlineGameError(String(json.error ?? "request_failed"),response.status);
  return json as T;
}

export async function listOnlineRooms():Promise<OnlineRoomSummary[]> {
  const result=await callApi<{rooms:OnlineRoomSummary[]}>("list");
  return result.rooms ?? [];
}
export async function previewOnlineRoom(code:string):Promise<OnlineRoomSummary> {
  return callApi<OnlineRoomSummary>("preview",{code:code.toUpperCase()});
}
export async function createOnlineRoom(name:string,maxPlayers:number):Promise<{room:OnlineRoomSummary;session:PlayerSession}> {
  const result=await callApi<OnlineRoomSummary & {playerId:string;token:string}>("create",{name,maxPlayers});
  const session={playerId:result.playerId,token:result.token,displayName:name};
  savePlayerSession(result.code,session);
  setCurrentRoomCode(result.code);
  const {playerId:_playerId,token:_token,...room}=result;
  return {room,session};
}
export async function joinOnlineRoom(code:string,name:string):Promise<{room:OnlineRoomSummary;session:PlayerSession}> {
  const result=await callApi<OnlineRoomSummary & {playerId:string;token:string}>("join",{code:code.toUpperCase(),name});
  const session={playerId:result.playerId,token:result.token,displayName:name};
  savePlayerSession(result.code,session);
  setCurrentRoomCode(result.code);
  const {playerId:_playerId,token:_token,...room}=result;
  return {room,session};
}
function isRecord(value:unknown):value is Record<string,unknown> {
  return value!==null && typeof value==="object" && !Array.isArray(value);
}

export function normalizeOnlineRoomResponse(payload:unknown):OnlineRoom {
  if(!isRecord(payload)) throw new OnlineGameError("invalid_room_payload",502);
  // Accept both the old nested shape and the canonical flat room response.
  const room=isRecord(payload["room"])?payload["room"]:payload;
  const rawState=isRecord(payload["gameState"])?payload["gameState"]:{};
  const rawSecrets=rawState["secrets"];
  const secrets=isRecord(rawSecrets)
    ? Object.fromEntries(Object.entries(rawSecrets).filter((entry):entry is [string,number]=>typeof entry[1]==="number"))
    : {};
  const rawPlayers=room["players"];
  const players=Array.isArray(rawPlayers)?rawPlayers:[];
  if(typeof room["code"]!=="string" || !["waiting","playing"].includes(String(room["status"])) || players.length===0) {
    throw new OnlineGameError("invalid_room_payload",502);
  }
  return {
    code:room["code"],
    game:"guess-who",
    status:room["status"] as "waiting"|"playing",
    max:typeof room["max"]==="number"?room["max"]:4,
    players:players.filter(isRecord).map((player)=>({
      id:String(player["id"]??""),
      name:String(player["name"]??""),
      isHost:player["isHost"]===true,
      online:player["online"]===true,
    })),
    gameState:{
      secrets,
      selectedPlayers:Array.isArray(rawState["selectedPlayers"])
        ? rawState["selectedPlayers"].filter((name):name is string=>typeof name==="string")
        : Object.keys(secrets),
      questions:isRecord(rawState["questions"])?rawState["questions"] as OnlineGameState["questions"]:{},
      guesses:Array.isArray(rawState["guesses"])?rawState["guesses"] as OnlineGuess[]:[],
    },
  };
}

export async function getOnlineRoom(code:string,session?:PlayerSession):Promise<OnlineRoom> {
  const current=session ?? getPlayerSession(code);
  if(!current) throw new OnlineGameError("player_session_missing",401);
  const payload=await callApi<unknown>("get",{code:code.toUpperCase()},current);
  return normalizeOnlineRoomResponse(payload);
}
export async function startOnlineGame(code:string,session:PlayerSession) {
  return callApi("start",{code:code.toUpperCase()},session);
}
export async function chooseOnlineSecret(code:string,session:PlayerSession,characterId:number) {
  return callApi("secret",{code:code.toUpperCase(),characterId},session);
}
export async function askOnlineQuestion(code:string,session:PlayerSession,target:string,questionId:string) {
  return callApi("ask",{code:code.toUpperCase(),target,questionId},session);
}
export async function answerOnlineQuestion(code:string,session:PlayerSession,questionId:string) {
  return callApi("answer_question",{code:code.toUpperCase(),questionId},session);
}
export async function guessOnlineCharacter(code:string,session:PlayerSession,target:string,characterId:number) {
  return callApi("guess",{code:code.toUpperCase(),target,characterId},session);
}
export async function answerOnlineGuess(code:string,session:PlayerSession,guessId:string) {
  return callApi("answer_guess",{code:code.toUpperCase(),guessId},session);
}
export async function leaveOnlineRoom(code:string,session:PlayerSession) {
  await callApi("leave",{code:code.toUpperCase()},session);
  forgetPlayerSession(code);
  setCurrentRoomCode(null);
}
