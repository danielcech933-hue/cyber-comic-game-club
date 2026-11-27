import { describe, expect, it } from "vitest";
import { hasWon, idx, neighbors } from "@/lib/games/azkviz";

describe("AZ Kvíz pyramid", () => {
  it("wins when one chain touches left, right and bottom", () => {
    // left edge column c=0 all the way down touches left+bottom, top cell is also right edge
    const chain = new Set([0, 1, 3, 6, 10, 15, 21].map((i) => i));
    expect(chain.has(idx(6, 0))).toBe(true);
    expect(hasWon(chain)).toBe(true);
  });
  it("does not win with a bottom row only touching left and right corners", () => {
    const row = new Set([idx(6, 0), idx(6, 6)]);
    expect(hasWon(row)).toBe(false);
  });
  it("middle cell has six neighbours", () => {
    expect(neighbors(idx(4, 2))).toHaveLength(6);
  });
});
