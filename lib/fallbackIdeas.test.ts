import { describe, expect, it } from "vitest";
import { buildConstraints, checkIdea } from "./buildConstraints";
import { GARMENTS, SKILLS, TOOLS, type ToolId } from "./config";
import type { FibrePart } from "./fabricRules";
import { pickFallbackIdeas } from "./fallbackIdeas";
import { Idea } from "./schema";

const MIXES: FibrePart[][] = [
  [{ fibre: "cotton", percent: 100 }],
  [{ fibre: "wool", percent: 100 }],
  [{ fibre: "acrylic", percent: 100 }],
  [{ fibre: "polyester", percent: 100 }],
  [{ fibre: "nylon", percent: 100 }],
  [{ fibre: "linen", percent: 100 }],
  [{ fibre: "viscose", percent: 100 }],
  [{ fibre: "cotton", percent: 98 }, { fibre: "elastane", percent: 2 }],
  [{ fibre: "wool", percent: 70 }, { fibre: "acrylic", percent: 30 }],
  [{ fibre: "cotton", percent: 60 }, { fibre: "polyester", percent: 40 }],
];

const OWNABLE = TOOLS.map((t) => t.id).filter((t) => t !== "none") as ToolId[];
// Every subset of the seven tools, plus "none of these".
const TOOLKITS: ToolId[][] = [["none"], ...Array.from({ length: 1 << OWNABLE.length }, (_, m) => OWNABLE.filter((_, i) => m & (1 << i)))];

describe("fallback bank", () => {
  it("always returns three distinct, valid, rule-abiding ideas for every combination", () => {
    let runs = 0;
    for (const garment of GARMENTS.map((g) => g.id))
      for (const parts of MIXES)
        for (const tools of TOOLKITS)
          for (const skill of SKILLS.map((s) => s.id)) {
            const c = buildConstraints({ garment, parts, tools, skill });
            const ideas = pickFallbackIdeas(c);
            const where = `${garment} ${c.composition} [${tools.join(",")}] ${skill}`;
            expect(ideas, where).toHaveLength(3);
            expect(new Set(ideas.map((i) => i.id)).size, where).toBe(3);
            for (const idea of ideas) {
              expect(Idea.safeParse(idea).success, `${where}: ${idea.id}`).toBe(true);
              expect(checkIdea(idea, c), `${where}: ${idea.id}`).toEqual([]);
            }
            runs++;
          }
    expect(runs).toBeGreaterThan(19000);
  });

  it("acrylic sweater sample never involves heat", () => {
    const ideas = pickFallbackIdeas({ garment: "sweater", parts: [{ fibre: "acrylic", percent: 100 }], tools: ["iron", "hand_sewing"], skill: "beginner" });
    const text = JSON.stringify(ideas.map(({ warnings, fabricReason, ...rest }) => rest)).toLowerCase();
    expect(text).not.toMatch(/iron/);
  });

  it("jeans with needle and thread never need a machine", () => {
    const ideas = pickFallbackIdeas({
      garment: "jeans",
      parts: [
        { fibre: "cotton", percent: 98 },
        { fibre: "elastane", percent: 2 },
      ],
      tools: ["hand_sewing"],
      skill: "beginner",
    });
    expect(JSON.stringify(ideas).toLowerCase()).not.toMatch(/machine(?! wash)/);
  });

  it("gives a spread of difficulty when the toolkit allows it", () => {
    const ideas = pickFallbackIdeas({ garment: "jeans", parts: [{ fibre: "cotton", percent: 100 }], tools: ["sewing_machine", "scissors", "hand_sewing"], skill: "confident" });
    expect(new Set(ideas.map((i) => i.difficulty)).size).toBe(3);
  });

  it("suggests felting for a wool sweater", () => {
    const ideas = pickFallbackIdeas({ garment: "sweater", parts: [{ fibre: "wool", percent: 100 }], tools: ["hand_sewing", "scissors"], skill: "beginner" }, 10);
    expect(ideas.map((i) => i.id)).toContain("felted-mittens");
  });
});
