import { describe, expect, it } from "vitest";
import { CHARACTERS, MASK_QUESTIONS } from "@/lib/games/guess-who";

describe("Hádej kdo – herní data", () => {
  it("contains 16 uniquely identified characters", () => {
    expect(CHARACTERS).toHaveLength(16);
    expect(new Set(CHARACTERS.map((character) => character.id)).size).toBe(16);
    expect(new Set(CHARACTERS.map((character) => character.name)).size).toBe(16);
  });

  it("contains unique yes/no questions with boolean answers for every character", () => {
    expect(MASK_QUESTIONS.length).toBeGreaterThanOrEqual(6);
    expect(new Set(MASK_QUESTIONS.map((question) => question.id)).size).toBe(MASK_QUESTIONS.length);

    for (const question of MASK_QUESTIONS) {
      for (const character of CHARACTERS) {
        expect(typeof question.test(character)).toBe("boolean");
      }
    }
  });

  it("answers character traits consistently", () => {
    const ada = CHARACTERS.find((character) => character.name === "Ada");
    expect(ada).toBeDefined();
    expect(MASK_QUESTIONS.find((question) => question.id === "glasses")?.test(ada!)).toBe(true);
    expect(MASK_QUESTIONS.find((question) => question.id === "blond")?.test(ada!)).toBe(true);
    expect(MASK_QUESTIONS.find((question) => question.id === "cap")?.test(ada!)).toBe(false);
  });
});
