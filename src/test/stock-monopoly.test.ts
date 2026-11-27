import {describe,expect,it} from "vitest";
import {STOCKS,STOCK_BOARD,calculateStockNetWorth,createInitialStockState,formatCredits} from "@/lib/games/stock-monopoly";
describe("Akciové Monopoly",()=>{
it("initializes players with equal starting cash",()=>{const s=createInitialStockState(["a","b","c"]);expect(s.cash).toEqual({a:1500,b:1500,c:1500});expect(s.currentTurn).toBe("a");expect(s.maxTurns).toBe(36);});
it("calculates cash plus current holding value",()=>{const s=createInitialStockState(["a","b"]);s.cash["a"]=500;s.holdings["a"]={NOVA:2,CHIP:1};s.prices["NOVA"]=150;expect(calculateStockNetWorth(s,"a")).toBe(980);});
it("has a 20-space board with unique positions",()=>{expect(STOCK_BOARD).toHaveLength(20);expect(new Set(STOCK_BOARD.map(x=>x.index)).size).toBe(20);expect(new Set(STOCK_BOARD.map(x=>x.row+":"+x.col)).size).toBe(20);});
it("defines eight fictional listed companies",()=>{expect(STOCKS).toHaveLength(8);expect(new Set(STOCKS.map(s=>s.ticker)).size).toBe(8);expect(STOCKS.every(s=>s.price>0)).toBe(true);});
it("formats in-game credits",()=>expect(formatCredits(1500)).toContain("₵"));
});
