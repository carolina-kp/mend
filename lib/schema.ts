// Shapes of data sent to and returned from /api/suggest, validated with zod.
import { z } from "zod";
import { GARMENTS, SKILLS, TOOLS, ids } from "./config";
import { FABRIC_IDS, FIBRES, type FabricId } from "./fabrics";

const fabricIds = FABRIC_IDS as [FabricId, ...FabricId[]];

const imageDataUrl = z
  .string()
  .regex(/^data:image\/(jpeg|png|webp);base64,/, "Expected a resized image")
  .max(3_000_000); // ~2MB of image, plenty for 1024px JPEG

// Request: either read a care label, or generate ideas.
export const LabelRequest = z.object({
  mode: z.literal("label"),
  labelImage: imageDataUrl,
});

export const IdeasRequest = z.object({
  mode: z.literal("ideas"),
  garment: z.enum(ids(GARMENTS)),
  fabric: z.enum(fabricIds),
  composition: z.string().max(200).optional(), // e.g. "80% wool, 20% nylon"
  tools: z.array(z.enum(ids(TOOLS))), // empty = none
  skill: z.enum(ids(SKILLS)),
  garmentImage: imageDataUrl.optional(), // photo is optional; ideas then rely on the answers only
});

export const SuggestRequest = z.discriminatedUnion("mode", [LabelRequest, IdeasRequest]);
export type IdeasInput = z.infer<typeof IdeasRequest>;

// Model output: label reading
export const LabelResult = z.object({
  parts: z.array(z.object({ fibre: z.enum(ids(FIBRES)), percent: z.number().min(0).max(100) })),
});
export type LabelResult = z.infer<typeof LabelResult>;

// Model output: exactly 3 ideas
export const Idea = z.object({
  name: z.string(),
  difficulty: z.number().int().min(1).max(5),
  time: z.string(), // e.g. "1-2 hours"
  materials: z.array(z.string()),
  steps: z.array(z.string()).min(1),
  why: z.string(), // one line: why this works for this fabric
});
export const IdeasResult = z.object({ ideas: z.array(Idea).length(3) });
export type Idea = z.infer<typeof Idea>;
