// Turns one garment (type, fibre mix, tools, skill) into a constraints object:
// what is safe, risky or ruled out. The prompt is built from it, and checkIdea()
// uses it to reject any idea that breaks a rule, whoever wrote the idea.
import { GARMENTS, type GarmentId, type SkillId, type ToolId } from "./config";
import {
  CONSTRUCTION_RULES,
  DENIM_RULES,
  FELT_MIN_WOOL,
  FIBRE_RULES,
  GARMENT_RULES,
  SAFETY_MIN_PERCENT,
  SKILL_RULES,
  TOOL_RULES,
  fibreLabel,
  heatAllows,
  heatAtMost,
  partsToText,
  type Construction,
  type FibreId,
  type FibrePart,
  type Heat,
} from "./fabricRules";

export type ConstraintInput = { garment: GarmentId; parts: FibrePart[]; tools: ToolId[]; skill: SkillId };

export type Constraints = {
  garment: GarmentId;
  garmentLabel: string;
  parts: FibrePart[]; // merged, no zeros, largest first
  composition: string; // "98% cotton, 2% elastane"
  mainFibre: FibreId;
  construction: Construction;
  isDenim: boolean;
  maxIron: Heat;
  heatLimitedBy: FibreId; // the fibre that sets maxIron
  frays: number; // 0 to 2, weighted by percentage
  canFelt: boolean;
  slippery: boolean;
  stretch: boolean;
  tools: Exclude<ToolId, "none">[]; // what they own
  has: { machine: boolean; needle: boolean; iron: boolean; glue: boolean; scissors: boolean; patches: boolean; paint: boolean };
  canSew: boolean;
  skill: SkillId;
  maxDifficulty: number;
  avoidTechniques: string[];
  safe: string[]; // good directions for this fabric and toolkit
  risky: string[]; // allowed, but needs a warning
  forbidden: string[]; // never suggest
  notes: string[]; // fabric facts for the prompt
  warnings: string[]; // shown to the person
};

export function normaliseParts(parts: FibrePart[]): FibrePart[] {
  const merged = new Map<FibreId, number>();
  for (const p of parts) if (p.percent > 0) merged.set(p.fibre, (merged.get(p.fibre) ?? 0) + p.percent);
  return [...merged].map(([fibre, percent]) => ({ fibre, percent })).sort((a, b) => b.percent - a.percent);
}

export function buildConstraints(input: ConstraintInput): Constraints {
  const parts = normaliseParts(input.parts);
  if (!parts.length) throw new Error("A fibre mix needs at least one fibre");
  const main = parts[0].fibre;
  const total = parts.reduce((s, p) => s + p.percent, 0);
  const share = (f: FibreId) => parts.find((p) => p.fibre === f)?.percent ?? 0;

  // Safety follows the most restrictive fibre that is really there (elastane at any amount).
  const counts = (p: FibrePart) => p.fibre === "elastane" || p.percent >= SAFETY_MIN_PERCENT;
  let maxIron: Heat = "high";
  let heatLimitedBy: FibreId = main;
  for (const p of parts.filter(counts)) {
    const next = heatAtMost(maxIron, FIBRE_RULES[p.fibre].maxIron);
    if (next !== maxIron) [maxIron, heatLimitedBy] = [next, p.fibre];
  }

  // Handling traits are weighted by how much of each fibre there is.
  const weighted = (fn: (f: FibreId) => number) => parts.reduce((s, p) => s + fn(p.fibre) * p.percent, 0) / total;
  const frays = Math.round(weighted((f) => FIBRE_RULES[f].frays) * 10) / 10;
  const slippery = weighted((f) => (FIBRE_RULES[f].slippery ? 1 : 0)) >= 0.5;
  const stretch = parts.some((p) => counts(p) && FIBRE_RULES[p.fibre].stretch);
  const canFelt = share("wool") >= FELT_MIN_WOOL;

  const garmentRule = GARMENT_RULES[input.garment];
  // Skirts and dresses vary: treat them as knit only when the main fibre is one that is almost always knitted.
  const construction: Construction =
    garmentRule.construction !== "varies" ? garmentRule.construction : main === "acrylic" || main === "wool" ? "knit" : "woven";
  const isDenim = input.garment === "jeans" && main === "cotton";

  const tools = input.tools.filter((t): t is Exclude<ToolId, "none"> => t !== "none");
  const own = (t: ToolId) => tools.includes(t as Exclude<ToolId, "none">);
  const has = {
    machine: own("sewing_machine"),
    needle: own("hand_sewing"),
    iron: own("iron"),
    glue: own("fabric_glue"),
    scissors: own("scissors"),
    patches: own("iron_on_patches"),
    paint: own("fabric_paint"),
  };
  const canSew = has.machine || has.needle;
  const skillRule = SKILL_RULES[input.skill];

  const present = parts.filter(counts).map((p) => p.fibre);
  const limiter = fibreLabel(heatLimitedBy).toLowerCase();
  const notes = [
    ...new Set([
      ...present.flatMap((f) => FIBRE_RULES[f].notes),
      ...CONSTRUCTION_RULES[construction],
      ...(isDenim ? DENIM_RULES.notes : []),
      garmentRule.note,
    ]),
  ];
  const warnings = [...new Set([...present.flatMap((f) => FIBRE_RULES[f].warnings), ...(isDenim ? DENIM_RULES.warnings : [])])];

  const forbidden: string[] = [];
  const risky: string[] = [];
  const safe: string[] = [...new Set([...(isDenim ? DENIM_RULES.goodFor : []), ...FIBRE_RULES[main].goodFor])];

  // Heat
  if (maxIron === "none") forbidden.push(`Any ironing, iron-on patches, fusible tape or heat-set glue: ${limiter} melts under a hot iron.`);
  else if (maxIron === "low") forbidden.push(`A medium or hot iron, and iron-on patches: ${limiter} is heat sensitive. Low iron through a cloth only.`);
  else if (maxIron === "medium") forbidden.push(`Ironing on high heat: ${limiter} is damaged by it. Medium heat through a pressing cloth.`);
  if (has.patches && !heatAllows(maxIron, TOOL_RULES.iron_on_patches.heat!)) {
    forbidden.push("Using their iron-on patches on this fabric. They could be sewn on by hand instead.");
  }
  if (has.patches && !has.iron) forbidden.push("Iron-on patches without an iron.");

  // Felting
  if (canFelt) risky.push("Felting with a hot wash: shrinks the wool a lot, only do it on purpose.");
  else forbidden.push("Felting: this fabric will not felt.");

  // Tools
  if (!has.machine) forbidden.push("Anything that needs a sewing machine.");
  if (!canSew) forbidden.push("Any sewing or stitching: they have no needle or machine.");
  if (!has.scissors) forbidden.push("Cutting the fabric: they have no scissors.");
  const missing = Object.entries(TOOL_RULES)
    .filter(([id]) => !own(id as ToolId))
    .map(([, t]) => t.label.toLowerCase());
  if (missing.length) forbidden.push(`Tools they do not own: ${missing.join(", ")}.`);
  for (const t of tools) safe.push(`${TOOL_RULES[t].label}: ${TOOL_RULES[t].enables}`);

  // Fabric handling
  if (isDenim && has.machine) risky.push("Machine sewing across several denim layers: use a denim needle (100/16 or 110/18) and go slowly.");
  if (isDenim && !has.machine && has.needle) risky.push("Hand sewing denim: use a thimble and strong thread, and keep away from the thick seams.");
  if (construction === "knit") risky.push("Cutting a knit: stitch twice along the line first so it does not unravel.");
  if (stretch) risky.push("Stretch fabric: use a stretch stitch or ballpoint needle, do not pull while sewing.");
  if (slippery) risky.push("Slippery fabric: pin often and cut on a flat table.");
  if (frays >= 1.5) risky.push("Heavy fraying: finish cut edges or make the fray part of the design.");
  if (has.glue && FIBRE_RULES[main].glue === "poor") risky.push("Fabric glue holds poorly on this fibre: test on a hidden spot.");

  // Skill
  for (const technique of skillRule.avoid) forbidden.push(`${technique} (too advanced for a ${input.skill} maker)`);
  forbidden.push(`Difficulty above ${skillRule.maxDifficulty} out of 5.`);

  return {
    garment: input.garment,
    garmentLabel: GARMENTS.find((g) => g.id === input.garment)?.label ?? input.garment,
    parts,
    composition: partsToText(parts),
    mainFibre: main,
    construction,
    isDenim,
    maxIron,
    heatLimitedBy,
    frays,
    canFelt,
    slippery,
    stretch,
    tools,
    has,
    canSew,
    skill: input.skill,
    maxDifficulty: skillRule.maxDifficulty,
    avoidTechniques: skillRule.avoid,
    safe,
    risky,
    forbidden,
    notes,
    warnings,
  };
}

// ---------- Rule check ----------

// The parts of an idea the rule check reads. Any idea source (Gemini, fallback, cache) fits this.
export type CheckableIdea = {
  title: string;
  summary?: string;
  difficulty: number;
  tools: string[];
  materials: string[];
  steps: string[];
};

// Phrases like "no machine needed" or "never iron it" must not count as using the thing.
const NEGATION = /\b(no|not|without|never|avoid|instead of|skip|don't|do not|doesn't|does not)\b[^.,;:!?\n]{0,30}/g;

const PATTERNS = {
  machine: /sewing machine|machine[- ]?(sew|stitch)|(sew|stitch)\w* (it |them |this |these )?(on|with|using) (a|the|your) machine|zigzag|overlock|serger/,
  anyIron: /\biron(s|ing|ed)?\b|press(ing)? with (an|the|a) iron|steam press/,
  hotIron: /hot iron|iron (it |them |this )?(on|at) (a )?(high|hot)|high heat|cotton setting|linen setting/,
  ironOn: /iron[- ]on|fusible|fusing|heat ?n ?bond|bondaweb|wonder ?web|heat[- ]set/,
  felt: /felting|felted|\bto felt\b|felt (it|the|your|this)/,
  cut: /\bcut(s|ting)?\b|\btrim(s|ming)?\b|\bsnip|\bcrop(s|ping|ped)?\b|\bchop/,
  sew: /\bsew(s|n|ing)?\b|\bstitch|\bdarn|embroider|\bneedle/,
};

// Beginner-unfriendly techniques from SKILL_RULES, as patterns.
const TECHNIQUE_PATTERNS: Record<string, RegExp> = {
  "zip replacement": /\bzip(per)?s?\b/,
  "set-in sleeves": /set[- ]in sleeve/,
  "pattern drafting": /draft(ing)? (a |your )?pattern|pattern[- ]?draft/,
  buttonholes: /buttonhole/,
};

// Which of the person's tools a tool name in an idea refers to. Order matters: iron-on before iron.
const TOOL_MATCHERS: [Exclude<ToolId, "none">, RegExp][] = [
  ["sewing_machine", /machine/],
  ["iron_on_patches", /iron[- ]on/],
  ["iron", /\biron\b/],
  ["hand_sewing", /needle|hand[- ]?sew/],
  ["fabric_glue", /glue/],
  ["scissors", /scissor|shears/],
  ["fabric_paint", /paint/],
];

export function checkIdea(idea: CheckableIdea, c: Constraints): string[] {
  const raw = [idea.title, idea.summary ?? "", ...idea.tools, ...idea.materials, ...idea.steps].join("\n").toLowerCase();
  const text = raw.replace(NEGATION, " ");
  const v: string[] = [];

  for (const name of idea.tools) {
    const match = TOOL_MATCHERS.find(([, re]) => re.test(name.toLowerCase()));
    if (match && !c.tools.includes(match[0])) v.push(`Uses a tool they do not own: ${name}`);
  }
  if (!c.has.machine && PATTERNS.machine.test(text)) v.push("Needs a sewing machine they do not own");
  if (c.maxIron === "none" && (PATTERNS.anyIron.test(text) || PATTERNS.ironOn.test(text))) v.push(`Uses heat on ${fibreLabel(c.heatLimitedBy).toLowerCase()}`);
  if (c.maxIron === "low" && (PATTERNS.hotIron.test(text) || PATTERNS.ironOn.test(text))) v.push(`Too much heat for ${fibreLabel(c.heatLimitedBy).toLowerCase()}`);
  if (c.maxIron === "medium" && PATTERNS.hotIron.test(text)) v.push(`Hot iron on ${fibreLabel(c.heatLimitedBy).toLowerCase()}`);
  if (!c.canFelt && PATTERNS.felt.test(text)) v.push("Suggests felting a fabric that will not felt");
  if (!c.has.scissors && PATTERNS.cut.test(text)) v.push("Needs cutting without scissors");
  if (!c.canSew && PATTERNS.sew.test(text)) v.push("Needs sewing without a needle or machine");
  if (idea.difficulty > c.maxDifficulty) v.push(`Difficulty ${idea.difficulty} is above ${c.maxDifficulty} for a ${c.skill} maker`);
  for (const t of c.avoidTechniques) if (TECHNIQUE_PATTERNS[t]?.test(text)) v.push(`Uses ${t}, too advanced for a ${c.skill} maker`);

  return v;
}
