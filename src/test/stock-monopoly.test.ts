import {describe,expect,it} from "vitest";
import {STOCKS,STOCK_BOARD,calculateStockNetWorth,createInitialStockState,formatCredits} from "@/lib/games/stock-monopoly";

describe("Akciové Monopoly — desková hra",()=>{
 it("starts each investor with 2 500 credits and a fair turn order",()=>{
  const s=createInitialStockState(["a","b","c"]);
  expect(s.turnOrder).toEqual(["a","b","c"]);
  expect(s.currentTurn).toBe("a");
  expect(s.cash).toEqual({a:2500,b:2500,c:2500});
  expect(s.maxTurns).toBe(90);
  expect(s.hasRolled).toBe(false);
 });
 it("has a 40-space perimeter with unique coordinates and four classic corners",()=>{
  expect(STOCK_BOARD).toHaveLength(40);
  expect(new Set(STOCK_BOARD.map(t=>t.index)).size).toBe(40);
  expect(new Set(STOCK_BOARD.map(t=>t.row+":"+t.col)).size).toBe(40);
  expect(STOCK_BOARD[0].type).toBe("start");
  expect(STOCK_BOARD[10].type).toBe("jail");
  expect(STOCK_BOARD[20].type).toBe("parking");
  expect(STOCK_BOARD[30].type).toBe("go_to_jail");
 });
 it("provides sixteen purchasable company spaces in eight paired tickers",()=>{
  const companies=STOCK_BOARD.filter(t=>t.type==="company");
  expect(companies).toHaveLength(16);
  for(const stock of STOCKS)expect(companies.filter(t=>t.ticker===stock.ticker)).toHaveLength(2);
 });
 it("calculates cash, market shares and company stakes in net worth",()=>{
  const s=createInitialStockState(["a","b"]);
  s.cash["a"]=500;
  s.holdings["a"]={NOVA:2,CHIP:1};
  s.prices["NOVA"]=150;
  s.properties["1"]={ownerId:"a",level:2};
  expect(calculateStockNetWorth(s,"a")).toBe(500+300+180+120*7);
 });
 it("contains eight fictional companies with unique positive starting prices",()=>{
  expect(STOCKS).toHaveLength(8);
  expect(new Set(STOCKS.map(s=>s.ticker)).size).toBe(8);
  expect(STOCKS.every(s=>s.price>0)).toBe(true);
 });
 it("formats in-game credits in Czech locale",()=>expect(formatCredits(2500)).toContain("₵"));
});
