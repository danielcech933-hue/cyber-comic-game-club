const SUPABASE_URL = "https://ntzjirsejfvgvuhmbqvt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_h6OPGkq8kd5c1wvqLlQ02g_VdQ9Vjw1";
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
    super(code);
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
    "apikey":SUPABASE_PUBLISHABLE_KEY,
  };
  if(session) {
    headers["x-room-token"]=session.token;
    payload.playerId=session.playerId;
    payload.token=session.token;
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
export async function getOnlineRoom(code:string,session?:PlayerSession):Promise<OnlineRoom> {
  const current=session ?? getPlayerSession(code);
  if(!current) throw new OnlineGameError("player_session_missing",401);
  return callApi<OnlineRoom>("get",{code:code.toUpperCase()},current);
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
export async function answerOnlineQuestion(code:string,session:PlayerSession,questionId:string,yes:boolean) {
  return callApi("answer_question",{code:code.toUpperCase(),questionId,yes},session);
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
