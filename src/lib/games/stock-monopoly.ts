export type StockGameState = {
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

export const STOCKS = [
  {ticker:"NOVA",name:"Nova Dynamics",sector:"TECH",price:120,color:"#8b5cf6",mark:"N"},
  {ticker:"VOLT",name:"Volt Energy",sector:"ENERGY",price:95,color:"#f59e0b",mark:"V"},
  {ticker:"AERO",name:"AeroWorks",sector:"INDUSTRY",price:145,color:"#38bdf8",mark:"A"},
  {ticker:"CHIP",name:"ChipForge",sector:"TECH",price:180,color:"#f472b6",mark:"C"},
  {ticker:"ORBT",name:"Orbit Labs",sector:"SPACE",price:110,color:"#a78bfa",mark:"O"},
  {ticker:"GRIN",name:"GreenCore",sector:"ENERGY",price:85,color:"#4ade80",mark:"G"},
  {ticker:"BYTE",name:"ByteBank",sector:"FINANCE",price:130,color:"#22d3ee",mark:"B"},
  {ticker:"NEXO",name:"Nexo Mobility",sector:"MOBILITY",price:105,color:"#fb7185",mark:"X"},
] as const;
export type StockTicker=(typeof STOCKS)[number]["ticker"];
export type StockTileType="start"|"company"|"news"|"tax"|"dividend"|"market"|"ipo"|"jail"|"parking"|"go_to_jail"|"bonus";
type TileDef={type:StockTileType;ticker?:StockTicker;label:string;note:string};
const TILE_DEFS:TileDef[]=[
 {type:"start",label:"START",note:"Za průchod +200 ₵"},
 {type:"company",ticker:"NOVA",label:"NOVA",note:"Nova Dynamics"},
 {type:"news",label:"ZPRÁVY",note:"Tržní událost"},
 {type:"company",ticker:"VOLT",label:"VOLT",note:"Volt Energy"},
 {type:"tax",label:"DAŇ",note:"Odvod 130 ₵ do banku"},
 {type:"company",ticker:"BYTE",label:"BYTE",note:"ByteBank"},
 {type:"market",label:"BURZA",note:"Obchoduj s akciemi"},
 {type:"company",ticker:"AERO",label:"AERO",note:"AeroWorks"},
 {type:"dividend",label:"DIVIDENDA",note:"Výplata z portfolia"},
 {type:"company",ticker:"CHIP",label:"CHIP",note:"ChipForge"},
 {type:"jail",label:"VĚZENÍ",note:"Pouze návštěva"},
 {type:"company",ticker:"ORBT",label:"ORBT",note:"Orbit Labs"},
 {type:"news",label:"ZPRÁVY",note:"Tržní událost"},
 {type:"company",ticker:"GRIN",label:"GRIN",note:"GreenCore"},
 {type:"tax",label:"DAŇ",note:"Odvod 130 ₵ do banku"},
 {type:"company",ticker:"NEXO",label:"NEXO",note:"Nexo Mobility"},
 {type:"company",ticker:"NOVA",label:"NOVA",note:"Druhý podíl Nova Dynamics"},
 {type:"ipo",label:"IPO",note:"Akcie se slevou 20 %"},
 {type:"company",ticker:"VOLT",label:"VOLT",note:"Druhý podíl Volt Energy"},
 {type:"company",ticker:"BYTE",label:"BYTE",note:"Druhý podíl ByteBank"},
 {type:"parking",label:"PARKING",note:"Vezmi peníze ze společného banku"},
 {type:"company",ticker:"AERO",label:"AERO",note:"Druhý podíl AeroWorks"},
 {type:"news",label:"ZPRÁVY",note:"Tržní událost"},
 {type:"company",ticker:"CHIP",label:"CHIP",note:"Druhý podíl ChipForge"},
 {type:"tax",label:"DAŇ",note:"Odvod 130 ₵ do banku"},
 {type:"company",ticker:"ORBT",label:"ORBT",note:"Druhý podíl Orbit Labs"},
 {type:"market",label:"BURZA",note:"Obchoduj s akciemi"},
 {type:"company",ticker:"GRIN",label:"GRIN",note:"Druhý podíl GreenCore"},
 {type:"dividend",label:"DIVIDENDA",note:"Výplata z portfolia"},
 {type:"company",ticker:"NEXO",label:"NEXO",note:"Druhý podíl Nexo Mobility"},
 {type:"go_to_jail",label:"DO VĚZENÍ",note:"Jdi rovnou do vězení"},
 {type:"news",label:"ZPRÁVY",note:"Tržní událost"},
 {type:"tax",label:"DAŇ",note:"Odvod 130 ₵ do banku"},
 {type:"market",label:"BURZA",note:"Obchoduj s akciemi"},
 {type:"dividend",label:"DIVIDENDA",note:"Výplata z portfolia"},
 {type:"ipo",label:"IPO",note:"Akcie se slevou 20 %"},
 {type:"news",label:"ZPRÁVY",note:"Tržní událost"},
 {type:"tax",label:"DAŇ",note:"Odvod 130 ₵ do banku"},
 {type:"market",label:"BURZA",note:"Obchoduj s akciemi"},
 {type:"bonus",label:"BONUS",note:"Získej 100 ₵"},
];
function boardCoordinates(index:number){
 if(index===0)return {row:11,col:1};
 if(index>=1&&index<=9)return {row:11,col:index+1};
 if(index===10)return {row:11,col:11};
 if(index>=11&&index<=19)return {row:21-index,col:11};
 if(index===20)return {row:1,col:11};
 if(index>=21&&index<=29)return {row:1,col:31-index};
 if(index===30)return {row:1,col:1};
 return {row:index-29,col:1};
}
export const STOCK_BOARD=TILE_DEFS.map((tile,index)=>({index,...tile,...boardCoordinates(index)}));
export const PLAYER_COLORS=["#c4f82a","#f472b6","#38bdf8","#f59e0b","#a78bfa","#fb7185"];
export const DICE_GLYPHS=["","⚀","⚁","⚂","⚃","⚄","⚅"];
export function formatCredits(value:number){return `${Math.round(value).toLocaleString("cs-CZ")} ₵`;}
export function calculateStockNetWorth(state:StockGameState,playerId:string){
 const shares=Object.entries(state.holdings[playerId]??{}).reduce((sum,[ticker,qty])=>sum+(state.prices[ticker]??0)*qty,0);
 const properties=Object.entries(state.properties??{}).filter(([,property])=>property.ownerId===playerId).reduce((sum,[index,property])=>{
  const ticker=STOCK_BOARD[Number(index)]?.ticker??"";
  return sum+(state.prices[ticker]??0)*(5+Math.max(0,property.level-1)*2);
 },0);
 return (state.cash[playerId]??0)+shares+properties;
}
export function createInitialStockState(ids:string[]):StockGameState{
 const cash:Record<string,number>={},positions:Record<string,number>={},holdings:Record<string,Record<string,number>>={},jailTurns:Record<string,number>={},doublesCount:Record<string,number>={};
 for(const id of ids){cash[id]=2500;positions[id]=0;holdings[id]={};jailTurns[id]=0;doublesCount[id]=0;}
 return {turnOrder:[...ids],currentTurn:ids[0]??"",positions,cash,holdings,
  prices:Object.fromEntries(STOCKS.map(stock=>[stock.ticker,stock.price])),properties:{},bankrupt:[],jailed:[],jailTurns,doublesCount,
  hasRolled:false,lastRoll:null,turn:1,maxTurns:ids.length*30,pendingPurchase:null,pendingUpgrade:null,pendingOffer:null,
  marketOpen:false,marketTradeUsed:false,extraTurn:false,lastLandedTile:null,freeParkingPool:0,
  log:[{id:"game-start",turn:1,text:"Burza se otevírá. Každý investor dostává 2 500 ₵. Hoď dvěma kostkami a kupuj podíly ve firmách."}],
  gameOver:false,winner:null};
}
export function isCompanyTile(index:number){return STOCK_BOARD[index]?.type==="company";}
export function getCompanyOwner(state:StockGameState,index:number){return state.properties[String(index)]?.ownerId??null;}
export function getCompanyRent(state:StockGameState,index:number){
 const tile=STOCK_BOARD[index],property=state.properties[String(index)];
 if(!tile?.ticker||!property)return 0;
 const price=state.prices[tile.ticker]??0;
 const pair=STOCK_BOARD.some(other=>other.type==="company"&&other.index!==index&&other.ticker===tile.ticker&&state.properties[String(other.index)]?.ownerId===property.ownerId);
 return Math.max(20,Math.round(price*0.45*property.level*(pair?2:1)));
}
