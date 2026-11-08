import { describe, expect, it } from "vitest";
import { plainPrompt, sideStats, toNeutral, winner, type LabRating, type LabRun } from "./compare";
import { SAMPLE_GARMENTS } from "./sampleGarments";

const s = SAMPLE_GARMENTS[3];
const input = { garment: s.garment, parts: s.parts, tools: s.tools, skill: s.skill };

describe("lab comparison", () => {
  it("gives the plain chatbot the facts but none of the fabric rules", () => {
    const { user } = plainPrompt(input);
    expect(user).toMatch(/Suggest three upcycling ideas for this garment/);
    expect(user).toMatch(/100% acrylic/);
    expect(user).toMatch(/iron, needle and thread/);
    expect(user).not.toMatch(/melt|FORBIDDEN|heat/i);
  });

  it("puts mend. ideas in the same neutral shape the chatbot uses", () => {
    const n = toNeutral(s.ideas[0]);
    expect(Object.keys(n)).toEqual(["title", "description", "materials", "steps", "tips"]);
    expect(n.tips[0]).toBe(s.ideas[0].fabricReason);
  });

  it("scores each side by the true mapping, not by set number", () => {
    const run = { mend_set: 2 } as LabRun;
    const r = (set: 1 | 2, f: number, unsafe = false) => ({ set, index: 0, feasibility: f, creativity: 3, fabric: f, unsafe });
    const rating = { ratings: [r(1, 2, true), r(1, 3), r(1, 2), r(2, 5), r(2, 4), r(2, 4)] } as LabRating;
    const mend = sideStats([{ run, rating }], "mend");
    const bot = sideStats([{ run, rating }], "chatbot");
    expect(mend.feasiblePct).toBe(100);
    expect(bot.feasiblePct).toBe(0);
    expect(bot.unsafe).toBe(1);
    expect(winner(run, rating)).toBe("mend");
  });
});
