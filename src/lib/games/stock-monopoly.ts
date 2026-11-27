export type StockGameState={turnOrder:string[];currentTurn:string;positions:Record<string,number>;cash:Record<string,number>;holdings:Record<string,Record<string,number>>;prices:Record<string,number>;bankrupt:string[];hasRolled:boolean;lastRoll:number|null;turn:number;maxTurns:number;pendingOffer:{ticker:string;discount:number}|null;log:Array<{id:string;turn:number;text:string}>;gameOver:boolean;winner:string|null};
export const STOCKS=[
{ticker:"NOVA",name:"Nova Dynamics",sector:"TECH",price:120,color:"#8b5cf6",mark:"N"},
{ticker:"VOLT",name:"Volt Energy",sector:"ENERGY",price:95,color:"#f59e0b",mark:"V"},
{ticker:"AERO",name:"AeroWorks",sector:"INDUSTRY",price:145,color:"#38bdf8",mark:"A"},
{ticker:"CHIP",name:"ChipForge",sector:"TECH",price:180,color:"#f472b6",mark:"C"},
{ticker:"ORBT",name:"Orbit Labs",sector:"SPACE",price:110,color:"#a78bfa",mark:"O"},
{ticker:"GRIN",name:"GreenCore",sector:"ENERGY",price:85,color:"#4ade80",mark:"G"},
{ticker:"BYTE",name:"ByteBank",sector:"FINANCE",price:130,color:"#22d3ee",mark:"B"},
{ticker:"NEXO",name:"Nexo Mobility",sector:"MOBILITY",price:105,color:"#fb7185",mark:"X"}] as const;
export type StockTicker=(typeof STOCKS)[number]["ticker"];
export type StockBoardTile={index:number;type:"start"|"stock"|"news"|"tax"|"dividend"|"ipo"|"market";ticker?:StockTicker;label:string;note:string;row:number;col:number};
export const STOCK_BOARD:StockBoardTile[]=[
{index:0,type:"start",label:"START",note:"+200 ₵ za průchod",row:1,col:1},{index:1,type:"stock",ticker:"NOVA",label:"NOVA",note:"Nova Dynamics",row:1,col:2},{index:2,type:"news",label:"ZPRÁVY",note:"Tržní impuls",row:1,col:3},{index:3,type:"stock",ticker:"VOLT",label:"VOLT",note:"Volt Energy",row:1,col:4},{index:4,type:"tax",label:"REGULACE",note:"Poplatek 90 ₵",row:1,col:5},{index:5,type:"stock",ticker:"AERO",label:"AERO",note:"AeroWorks",row:1,col:6},
{index:6,type:"dividend",label:"DIVIDENDA",note:"Výnos portfolia",row:2,col:6},{index:7,type:"stock",ticker:"CHIP",label:"CHIP",note:"ChipForge",row:3,col:6},{index:8,type:"news",label:"ZPRÁVY",note:"Tržní impuls",row:4,col:6},{index:9,type:"stock",ticker:"ORBT",label:"ORBT",note:"Orbit Labs",row:5,col:6},{index:10,type:"market",label:"BURZA",note:"Volatilita trhu",row:6,col:6},
{index:11,type:"stock",ticker:"GRIN",label:"GRIN",note:"GreenCore",row:6,col:5},{index:12,type:"tax",label:"REGULACE",note:"Poplatek 90 ₵",row:6,col:4},{index:13,type:"stock",ticker:"BYTE",label:"BYTE",note:"ByteBank",row:6,col:3},{index:14,type:"ipo",label:"IPO",note:"Sleva 20 %",row:6,col:2},{index:15,type:"stock",ticker:"NEXO",label:"NEXO",note:"Nexo Mobility",row:6,col:1},{index:16,type:"news",label:"ZPRÁVY",note:"Tržní impuls",row:5,col:1},{index:17,type:"stock",ticker:"VOLT",label:"VOLT",note:"Volt Energy",row:4,col:1},{index:18,type:"dividend",label:"DIVIDENDA",note:"Výnos portfolia",row:3,col:1},{index:19,type:"stock",ticker:"NOVA",label:"NOVA",note:"Nova Dynamics",row:2,col:1}];
export const PLAYER_COLORS=["#c4f82a","#f472b6","#38bdf8","#f59e0b","#a78bfa","#fb7185"];
export function formatCredits(n:number){return `${Math.round(n).toLocaleString("cs-CZ")} ₵`;}
export function calculateStockNetWorth(s:StockGameState,id:string){return (s.cash[id]??0)+Object.entries(s.holdings[id]??{}).reduce((sum,[t,q])=>sum+(s.prices[t]??0)*q,0);}
export function createInitialStockState(ids:string[]):StockGameState{const cash:Record<string,number>={},positions:Record<string,number>={},holdings:Record<string,Record<string,number>>={};for(const id of ids){cash[id]=1500;positions[id]=0;holdings[id]={};}return{turnOrder:[...ids],currentTurn:ids[0]??"",positions,cash,holdings,prices:Object.fromEntries(STOCKS.map(s=>[s.ticker,s.price])),bankrupt:[],hasRolled:false,lastRoll:null,turn:1,maxTurns:ids.length*12,pendingOffer:null,log:[{id:"game-start",turn:1,text:"Burza je otevřená. Každý investor dostává 1 500 ₵."}],gameOver:false,winner:null};}
