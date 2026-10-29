// Teacher demo mode: four sample garments with ideas generated once by the full
// pipeline and stored in sampleIdeas.json, so the demo works with no internet and
// no AI. lib/sampleGarments.test.ts re-checks every cached idea against the rules.
import type { GarmentId, SkillId, ToolId } from "./config";
import type { FibrePart } from "./fabricRules";
import type { Idea } from "./schema";
import cached from "./sampleIdeas.json";

export type SampleGarment = {
  id: keyof typeof cached;
  title: string;
  why: string; // what this sample shows off
  garment: GarmentId;
  parts: FibrePart[];
  tools: ToolId[];
  skill: SkillId;
  ideas: Idea[];
};

export const SAMPLE_GARMENTS: SampleGarment[] = [
  {
    id: "wool-sweater",
    title: "Wool sweater",
    why: "100% wool, needle and thread, scissors, beginner. Wool can be felted on purpose.",
    garment: "sweater",
    parts: [{ fibre: "wool", percent: 100 }],
    tools: ["hand_sewing", "scissors"],
    skill: "beginner",
    ideas: cached["wool-sweater"],
  },
  {
    id: "stretch-jeans",
    title: "Jeans",
    why: "98% cotton, 2% elastane, sewing machine, scissors, comfortable. Thick denim needs the right needle.",
    garment: "jeans",
    parts: [
      { fibre: "cotton", percent: 98 },
      { fibre: "elastane", percent: 2 },
    ],
    tools: ["sewing_machine", "scissors"],
    skill: "comfortable",
    ideas: cached["stretch-jeans"],
  },
  {
    id: "cotton-shirt",
    title: "Cotton shirt",
    why: "100% cotton, iron, fabric glue, scissors, beginner. No sewing at all.",
    garment: "shirt",
    parts: [{ fibre: "cotton", percent: 100 }],
    tools: ["iron", "fabric_glue", "scissors"],
    skill: "beginner",
    ideas: cached["cotton-shirt"],
  },
  {
    id: "acrylic-sweater",
    title: "Acrylic sweater",
    why: "100% acrylic, iron, needle and thread, beginner. Acrylic melts under a hot iron.",
    garment: "sweater",
    parts: [{ fibre: "acrylic", percent: 100 }],
    tools: ["iron", "hand_sewing"],
    skill: "beginner",
    ideas: cached["acrylic-sweater"],
  },
];
