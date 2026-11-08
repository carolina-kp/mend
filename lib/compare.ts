// Lab mode A/B (server only): mend.'s full pipeline against a plain chatbot answer from the
// same Gemini model, shown to an outside sewer as "Set 1" and "Set 2" in random order.
import { randomInt } from "node:crypto";
import { z } from "zod";
import { GARMENTS, SKILLS, TOOLS } from "./config";
import { fibreLabel } from "./fabricRules";
import { getIdeas } from "./ideas";
import { parseJson, provider } from "./providers";
import type { Idea, IdeasInput } from "./schema";

// What raters see for every idea, from either side. Same fields, same order, so the format gives nothing away.
export const NeutralIdea = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(2).max(400),
  materials: z.array(z.string().max(120)).max(15),
  steps: z.array(z.string().max(500)).min(1).max(12),
  tips: z.array(z.string().max(300)).max(6),
});
export type NeutralIdea = z.infer<typeof NeutralIdea>;
const NeutralSet = z.object({ ideas: z.array(NeutralIdea).min(3) });

const label = (list: readonly { id: string; label: string }[], id: string) => list.find((x) => x.id === id)?.label ?? id;

// The plain chatbot gets only what a person would type into a free chatbot: the facts, no rules.
export function plainPrompt(input: IdeasInput) {
  const fabric = input.parts.map((p) => `${p.percent}% ${fibreLabel(p.fibre).toLowerCase()}`).join(", ");
  const tools = input.tools.filter((t) => t !== "none").map((t) => label(TOOLS, t).toLowerCase());
  return {
    system: "You are a helpful assistant.",
    user: `Suggest three upcycling ideas for this garment.
Garment: ${label(GARMENTS, input.garment).toLowerCase()}
Fabric: ${fabric}
Tools I have: ${tools.length ? tools.join(", ") : "none"}
My skill level: ${label(SKILLS, input.skill).toLowerCase()}

For each idea give a title, a short description, materials, steps and any tips. Reply as JSON.`,
  };
}

const PLAIN_SCHEMA = (() => {
  const s = z.toJSONSchema(NeutralSet) as Record<string, unknown>;
  delete s.$schema;
  return s;
})();

export async function plainChatbotIdeas(input: IdeasInput): Promise<NeutralIdea[]> {
  const { complete, model } = provider();
  for (let attempt = 1; attempt <= 2; attempt++) {
    // Same model and temperature as mend., a longer timeout: the lab is not on stage.
    const text = await complete({ ...plainPrompt(input), jsonSchema: PLAIN_SCHEMA, temperature: 0.5, timeoutMs: 25_000 }, model).catch((e: Error) => {
      if (attempt === 2) throw e;
      return "";
    });
    const parsed = NeutralSet.safeParse(parseJson(text));
    if (parsed.success) return parsed.data.ideas.slice(0, 3);
  }
  throw new Error("The plain chatbot did not return three ideas. Try again in a minute.");
}

export const toNeutral = (i: Idea): NeutralIdea => ({
  title: i.title,
  description: i.summary,
  materials: [...i.tools, ...i.materials],
  steps: i.steps,
  tips: [i.fabricReason, ...i.warnings],
});

export async function runComparison(input: IdeasInput) {
  const [mend, plain] = await Promise.all([getIdeas(input), plainChatbotIdeas(input)]);
  const mendSet = (randomInt(2) + 1) as 1 | 2; // coin flip, kept secret from raters
  const mendIdeas = mend.ideas.map(toNeutral);
  return {
    garment: input.garment,
    skill: input.skill,
    input,
    set1: mendSet === 1 ? mendIdeas : plain,
    set2: mendSet === 2 ? mendIdeas : plain,
    mend_set: mendSet,
    mend_source: mend.source,
  };
}

// ---------- Ratings ----------

const score = z.number().int().min(1).max(5);
export const IdeaRating = z.object({ set: z.union([z.literal(1), z.literal(2)]), index: z.number().int().min(0).max(2), feasibility: score, creativity: score, fabric: score, unsafe: z.boolean() });
export type IdeaRating = z.infer<typeof IdeaRating>;
export const RatingRequest = z.object({
  runId: z.uuid(),
  rater: z.string().trim().max(40).optional(),
  ratings: z.array(IdeaRating).length(6),
  comments: z.object({ set1: z.string().max(1000).optional(), set2: z.string().max(1000).optional() }),
});

export type LabRun = { id: string; created_at: string; garment: string; skill: string; input: IdeasInput; set1: NeutralIdea[]; set2: NeutralIdea[]; mend_set: 1 | 2; mend_source: string };
export type LabRating = { id: string; created_at: string; run_id: string; rater?: string; ratings: IdeaRating[]; comments: { set1?: string; set2?: string } };

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 100) / 100 : null);

// Per side ("mend" or "chatbot"): averages, feasible share (rated 4 or 5), unsafe count.
export function sideStats(pairs: { run: LabRun; rating: LabRating }[], side: "mend" | "chatbot") {
  const ideas = pairs.flatMap(({ run, rating }) => rating.ratings.filter((r) => (r.set === run.mend_set) === (side === "mend")));
  return {
    ideas: ideas.length,
    feasibility: avg(ideas.map((r) => r.feasibility)),
    creativity: avg(ideas.map((r) => r.creativity)),
    fabric: avg(ideas.map((r) => r.fabric)),
    overall: avg(ideas.map((r) => (r.feasibility + r.creativity + r.fabric) / 3)),
    feasiblePct: ideas.length ? Math.round((ideas.filter((r) => r.feasibility >= 4).length / ideas.length) * 100) : null,
    unsafe: ideas.filter((r) => r.unsafe).length,
  };
}

// Which side one rater preferred on one run, by the average of all three scores.
export function winner(run: LabRun, rating: LabRating): "mend" | "chatbot" | "tie" {
  const m = sideStats([{ run, rating }], "mend").overall ?? 0;
  const c = sideStats([{ run, rating }], "chatbot").overall ?? 0;
  return m === c ? "tie" : m > c ? "mend" : "chatbot";
}
