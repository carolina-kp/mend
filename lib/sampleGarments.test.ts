import { describe, expect, it } from "vitest";
import { buildConstraints, checkIdea } from "./buildConstraints";
import { SAMPLE_GARMENTS } from "./sampleGarments";
import { IdeasResult } from "./schema";

describe("teacher demo samples", () => {
  it("has the four garments from the brief", () => {
    expect(SAMPLE_GARMENTS.map((s) => s.id)).toEqual(["wool-sweater", "stretch-jeans", "cotton-shirt", "acrylic-sweater"]);
  });

  for (const s of SAMPLE_GARMENTS) {
    it(`${s.title}: cached ideas are valid and pass every rule`, () => {
      expect(IdeasResult.safeParse({ ideas: s.ideas }).success).toBe(true);
      const c = buildConstraints(s);
      for (const idea of s.ideas) expect(checkIdea(idea, c), idea.title).toEqual([]);
    });
  }

  it("acrylic sweater never suggests heat and always warns about it", () => {
    const acrylic = SAMPLE_GARMENTS.find((s) => s.id === "acrylic-sweater")!;
    for (const idea of acrylic.ideas) {
      const doing = [...idea.tools, ...idea.materials, ...idea.steps].join(" ").toLowerCase();
      expect(doing).not.toMatch(/iron|heat/);
      expect(idea.warnings.join(" ")).toMatch(/melts under a hot iron/);
    }
  });
});
