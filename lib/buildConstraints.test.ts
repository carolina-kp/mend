import { describe, expect, it } from "vitest";
import { buildConstraints, checkIdea, normaliseParts, type CheckableIdea } from "./buildConstraints";

const idea = (steps: string[], extra: Partial<CheckableIdea> = {}): CheckableIdea => ({
  title: "Test idea",
  difficulty: 1,
  tools: [],
  materials: [],
  steps,
  ...extra,
});

describe("normaliseParts", () => {
  it("merges duplicates, drops zeros and sorts largest first", () => {
    expect(
      normaliseParts([
        { fibre: "cotton", percent: 40 },
        { fibre: "wool", percent: 0 },
        { fibre: "polyester", percent: 20 },
        { fibre: "cotton", percent: 40 },
      ]),
    ).toEqual([
      { fibre: "cotton", percent: 80 },
      { fibre: "polyester", percent: 20 },
    ]);
  });
});

describe("acrylic sweater (demo sample 4)", () => {
  const c = buildConstraints({ garment: "sweater", parts: [{ fibre: "acrylic", percent: 100 }], tools: ["iron", "hand_sewing"], skill: "beginner" });

  it("allows no iron at all and says why", () => {
    expect(c.maxIron).toBe("none");
    expect(c.forbidden.join(" ")).toMatch(/acrylic melts under a hot iron/);
    expect(c.warnings.join(" ")).toMatch(/melts/);
  });

  it("is a knit that cannot felt", () => {
    expect(c.construction).toBe("knit");
    expect(c.canFelt).toBe(false);
  });

  it("rejects hot ironing, iron-on patches and pressing", () => {
    expect(checkIdea(idea(["Press the hem with a hot iron."]), c)).not.toEqual([]);
    expect(checkIdea(idea(["Add an iron-on patch over the hole."]), c)).not.toEqual([]);
    expect(checkIdea(idea(["Iron the seams flat."]), c)).not.toEqual([]);
    expect(checkIdea(idea(["Fold it"], { tools: ["Iron"] }), c)).not.toEqual([]);
  });

  it("accepts hand stitching and an explicit no-iron note", () => {
    expect(checkIdea(idea(["Hand stitch a patch over the hole.", "Do not iron it: acrylic melts."], { tools: ["Needle and thread"] }), c)).toEqual([]);
  });

  it("rejects cutting because there are no scissors", () => {
    expect(checkIdea(idea(["Cut the sleeves off."]), c)).toContain("Needs cutting without scissors");
  });
});

describe("jeans with needle and thread only", () => {
  const c = buildConstraints({
    garment: "jeans",
    parts: [
      { fibre: "cotton", percent: 98 },
      { fibre: "elastane", percent: 2 },
    ],
    tools: ["hand_sewing", "scissors"],
    skill: "beginner",
  });

  it("is denim, stretchy, and capped at medium heat by the elastane", () => {
    expect(c.isDenim).toBe(true);
    expect(c.stretch).toBe(true);
    expect(c.maxIron).toBe("medium");
    expect(c.heatLimitedBy).toBe("elastane");
  });

  it("forbids anything that needs a machine", () => {
    expect(c.forbidden).toContain("Anything that needs a sewing machine.");
    expect(checkIdea(idea(["Sew the side seams on your sewing machine."]), c)).toContain("Needs a sewing machine they do not own");
    expect(checkIdea(idea(["Machine stitch the strap."]), c)).not.toEqual([]);
    expect(checkIdea(idea(["Fold"], { tools: ["Sewing machine"] }), c)).not.toEqual([]);
  });

  it("does not count 'no machine needed' as needing one", () => {
    expect(checkIdea(idea(["No sewing machine needed: hand stitch with a thimble."], { tools: ["Needle and thread", "Scissors"] }), c)).toEqual([]);
  });

  it("warns about hand sewing thick denim", () => {
    expect(c.risky.join(" ")).toMatch(/thimble/);
  });

  it("does not flag 'machine wash'", () => {
    expect(checkIdea(idea(["Cut a raw hem, then machine wash to fray it."]), c)).toEqual([]);
  });
});

describe("jeans with a sewing machine (demo sample 2)", () => {
  const c = buildConstraints({
    garment: "jeans",
    parts: [
      { fibre: "cotton", percent: 98 },
      { fibre: "elastane", percent: 2 },
    ],
    tools: ["sewing_machine", "scissors"],
    skill: "comfortable",
  });
  it("allows the machine but warns about denim layers and needle size", () => {
    expect(checkIdea(idea(["Sew the seams on your sewing machine."], { tools: ["Sewing machine"], difficulty: 3 }), c)).toEqual([]);
    expect(c.risky.join(" ")).toMatch(/100\/16/);
  });
});

describe("blends", () => {
  it("uses the most restrictive fibre for heat", () => {
    const c = buildConstraints({
      garment: "shirt",
      parts: [
        { fibre: "cotton", percent: 60 },
        { fibre: "polyester", percent: 40 },
      ],
      tools: ["iron"],
      skill: "beginner",
    });
    expect(c.mainFibre).toBe("cotton");
    expect(c.maxIron).toBe("low");
    expect(c.heatLimitedBy).toBe("polyester");
    expect(checkIdea(idea(["Iron on high heat."]), c)).not.toEqual([]);
  });

  it("ignores a trace fibre under 5% for heat, but never ignores elastane", () => {
    const trace = buildConstraints({
      garment: "shirt",
      parts: [
        { fibre: "cotton", percent: 97 },
        { fibre: "polyester", percent: 3 },
      ],
      tools: [],
      skill: "beginner",
    });
    expect(trace.maxIron).toBe("high");
    const stretchy = buildConstraints({
      garment: "shirt",
      parts: [
        { fibre: "cotton", percent: 99 },
        { fibre: "elastane", percent: 1 },
      ],
      tools: [],
      skill: "beginner",
    });
    expect(stretchy.maxIron).toBe("medium");
  });

  it("only lets mostly-wool garments felt", () => {
    const wool = buildConstraints({ garment: "sweater", parts: [{ fibre: "wool", percent: 100 }], tools: ["hand_sewing", "scissors"], skill: "beginner" });
    expect(wool.canFelt).toBe(true);
    expect(checkIdea(idea(["Felt the sweater in a hot wash, then cut mittens."]), wool)).toEqual([]);

    const mix = buildConstraints({
      garment: "sweater",
      parts: [
        { fibre: "wool", percent: 70 },
        { fibre: "acrylic", percent: 30 },
      ],
      tools: ["scissors"],
      skill: "beginner",
    });
    expect(mix.canFelt).toBe(false);
    expect(mix.maxIron).toBe("none");
    expect(checkIdea(idea(["Felt the sweater in a hot wash."]), mix)).toContain("Suggests felting a fabric that will not felt");
  });

  it("weights fraying by percentage", () => {
    const c = buildConstraints({
      garment: "dress",
      parts: [
        { fibre: "linen", percent: 50 },
        { fibre: "elastane", percent: 50 },
      ],
      tools: [],
      skill: "beginner",
    });
    expect(c.frays).toBe(1);
  });
});

describe("tools and skill", () => {
  it("with no tools, forbids cutting and sewing", () => {
    const c = buildConstraints({ garment: "shirt", parts: [{ fibre: "cotton", percent: 100 }], tools: ["none"], skill: "beginner" });
    expect(c.tools).toEqual([]);
    expect(c.canSew).toBe(false);
    expect(checkIdea(idea(["Stitch the cuffs."]), c)).toContain("Needs sewing without a needle or machine");
    expect(checkIdea(idea(["Knot the shirt tails at the front."]), c)).toEqual([]);
  });

  it("forbids iron-on patches on heat-sensitive fabric even if they own some", () => {
    const c = buildConstraints({ garment: "skirt", parts: [{ fibre: "polyester", percent: 100 }], tools: ["iron", "iron_on_patches"], skill: "beginner" });
    expect(c.forbidden.join(" ")).toMatch(/iron-on patches on this fabric/);
    expect(checkIdea(idea(["Apply an iron-on patch."], { tools: ["Iron-on patches"] }), c)).not.toEqual([]);
  });

  it("caps difficulty and blocks advanced techniques for beginners only", () => {
    const beginner = buildConstraints({ garment: "dress", parts: [{ fibre: "cotton", percent: 100 }], tools: ["sewing_machine", "scissors"], skill: "beginner" });
    expect(checkIdea(idea(["Sew"], { difficulty: 4 }), beginner)).not.toEqual([]);
    expect(checkIdea(idea(["Replace the zip."]), beginner)).not.toEqual([]);

    const confident = buildConstraints({ garment: "dress", parts: [{ fibre: "cotton", percent: 100 }], tools: ["sewing_machine", "scissors"], skill: "confident" });
    expect(checkIdea(idea(["Replace the zip on your sewing machine."], { difficulty: 5 }), confident)).toEqual([]);
  });

  it("treats skirts and dresses as knit only for knit-type fibres", () => {
    expect(buildConstraints({ garment: "skirt", parts: [{ fibre: "wool", percent: 100 }], tools: [], skill: "beginner" }).construction).toBe("knit");
    expect(buildConstraints({ garment: "skirt", parts: [{ fibre: "linen", percent: 100 }], tools: [], skill: "beginner" }).construction).toBe("woven");
  });
});
