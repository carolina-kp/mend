// Shapes of data sent to and returned from the API routes, validated with zod.
import { z } from "zod";
import { GARMENTS, SKILLS, TOOLS, ids } from "./config";
import { FIBRES } from "./fabricRules";

const imageDataUrl = z
  .string()
  .regex(/^data:image\/(jpeg|png|webp);base64,/, "Expected a resized image")
  .max(3_000_000); // ~2MB of image, plenty for 1024px JPEG

export const FibrePartSchema = z.object({ fibre: z.enum(ids(FIBRES)), percent: z.number().int().min(0).max(100) });

// ---------- /api/suggest (care label reading) ----------

export const LabelRequest = z.object({ mode: z.literal("label"), labelImage: imageDataUrl });

export const LabelResult = z.object({
  parts: z.array(z.object({ fibre: z.enum(ids(FIBRES)), percent: z.number().min(0).max(100) })),
});
export type LabelResult = z.infer<typeof LabelResult>;

// ---------- /api/ideas ----------

export const IdeasRequest = z.object({
  garment: z.enum(ids(GARMENTS)),
  parts: z
    .array(FibrePartSchema)
    .min(1)
    .max(8)
    .refine((p) => p.reduce((s, x) => s + x.percent, 0) === 100, "Fibres must add up to 100%"),
  tools: z.array(z.enum(ids(TOOLS))).max(8), // empty = none
  skill: z.enum(ids(SKILLS)),
  garmentImage: imageDataUrl.optional(), // optional; ideas then rely on the answers only
});
export type IdeasInput = z.infer<typeof IdeasRequest>;

// One idea, as in section 5.5 of the brief.
export const Idea = z.object({
  id: z.string().max(60),
  title: z.string().min(3).max(80),
  summary: z.string().min(5).max(240), // one sentence
  difficulty: z.number().int().min(1).max(5),
  timeMinutes: z.number().int().min(5).max(2400),
  tools: z.array(z.string().max(60)).max(8),
  materials: z.array(z.string().max(80)).max(12),
  steps: z.array(z.string().min(3).max(400)).min(2).max(10),
  fabricReason: z.string().min(5).max(300), // why this works for this fabric
  warnings: z.array(z.string().max(240)).max(5),
  menderBrief: z.string().min(5).max(500), // short text a mender could quote from
});
export type Idea = z.infer<typeof Idea>;

export const IdeasResult = z.object({ ideas: z.array(Idea).length(3) });

// Where the ideas came from: the model, the rule-based bank, or the cached demo set.
export type IdeasSource = "ai" | "fallback" | "sample";
export type IdeasResponse = { ideas: Idea[]; source: IdeasSource; note?: string };
