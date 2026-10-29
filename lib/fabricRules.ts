// Fabric knowledge base: the core of mend.
// Ideas start from these rules, not from the model's imagination.
// lib/buildConstraints.ts turns them into a constraints object for one garment,
// and the same constraints are used to check every idea before it is shown.
//
// Edit freely. Each rule has a comment with the reason, in plain English.
import type { GarmentId, SkillId, ToolId } from "./config";

// ---------- Fibres (what a care label lists) ----------

export const FIBRES = [
  { id: "cotton", label: "Cotton" },
  { id: "wool", label: "Wool" },
  { id: "polyester", label: "Polyester" },
  { id: "acrylic", label: "Acrylic" },
  { id: "linen", label: "Linen" },
  { id: "viscose", label: "Viscose" },
  { id: "nylon", label: "Nylon" },
  { id: "elastane", label: "Elastane" },
] as const;

export type FibreId = (typeof FIBRES)[number]["id"];
export type FibrePart = { fibre: FibreId; percent: number };

// Iron heat, from coolest to hottest. "none" means keep the iron away.
export const HEAT = ["none", "low", "medium", "high"] as const;
export type Heat = (typeof HEAT)[number];

export type FibreRule = {
  maxIron: Heat; // hottest safe iron setting
  frays: 0 | 1 | 2; // 0 barely, 1 some, 2 heavily at cut edges
  felts: boolean; // shrinks and mats into dense fabric with heat and agitation
  slippery: boolean; // hard to cut straight and sew evenly
  stretch: boolean; // needs stretch stitches and a ballpoint needle
  glue: "good" | "poor"; // how well ordinary fabric glue holds
  notes: string[]; // facts the model must respect
  warnings: string[]; // shown to the person when this fibre is present
  goodFor: string[]; // project types this fibre suits
};

export const FIBRE_RULES: Record<FibreId, FibreRule> = {
  cotton: {
    // Natural plant fibre: takes high heat, but cut edges unravel and hot washes shrink it.
    maxIron: "high",
    frays: 2,
    felts: false,
    slippery: false,
    stretch: false,
    glue: "good",
    notes: [
      "Cotton is easy to sew and can be ironed on high heat.",
      "Cut edges fray, so finish them or use the fray as a feature.",
      "Shrinks if washed hot: pre-wash any patch fabric.",
    ],
    warnings: ["Cotton frays at cut edges: finish them or keep the fray on purpose."],
    goodFor: ["patches", "hems", "tote bags", "dyeing", "fabric paint"],
  },
  wool: {
    // Animal fibre: scales lock together with heat and agitation (felting). Great when intended, a disaster by accident.
    maxIron: "medium",
    frays: 1,
    felts: true,
    slippery: false,
    stretch: false,
    glue: "poor",
    notes: [
      "Wool can be felted on purpose with a hot wash: it becomes dense and does not fray when cut.",
      "Do not iron hot. Steam through a damp pressing cloth instead.",
      "Unfelted knit edges unravel: stitch twice along a line before cutting.",
      "Needle and thread work well on wool.",
    ],
    warnings: ["Hot water and rubbing will felt and shrink wool. Only do it on purpose."],
    goodFor: ["patches", "mittens from felted cuffs", "pouches", "cushion covers", "visible mending"],
  },
  acrylic: {
    // Plastic fibre: softens and melts under a hot iron, the knit goes flat and shiny for good.
    maxIron: "none",
    frays: 2,
    felts: false,
    slippery: false,
    stretch: true,
    glue: "poor",
    notes: [
      "Acrylic melts under a hot iron. No ironing, no iron-on patches, no heat-set glue.",
      "Acrylic does not felt, unlike wool.",
      "Pills and goes fuzzy with rubbing.",
      "Knit edges unravel: stitch twice along a line before cutting.",
    ],
    warnings: ["Acrylic melts under a hot iron. Keep heat away from it."],
    goodFor: ["sew-on patches", "embroidery", "cropping with a stitched hem", "cushion covers", "pom-poms and ties"],
  },
  polyester: {
    // Plastic fibre: heat sensitive and slick, so it shifts under the needle.
    maxIron: "low",
    frays: 1,
    felts: false,
    slippery: true,
    stretch: false,
    glue: "poor",
    notes: [
      "Polyester is heat sensitive: low iron only, through a cloth.",
      "Slippery to cut and sew: pin often.",
      "Frays less than cotton.",
      "Fabric glue works poorly on some finishes.",
    ],
    warnings: ["Polyester can melt or go shiny with a hot iron. Use low heat only."],
    goodFor: ["scrunchies", "bags", "linings", "drawstring pouches"],
  },
  nylon: {
    // Plastic fibre: strong, but heat sensitive and slippery.
    maxIron: "low",
    frays: 1,
    felts: false,
    slippery: true,
    stretch: false,
    glue: "poor",
    notes: ["Nylon is strong but heat sensitive: low iron only.", "Slippery to sew: pin often."],
    warnings: ["Nylon can melt with a hot iron. Use low heat only."],
    goodFor: ["pouches", "bags", "straps"],
  },
  linen: {
    // Plant fibre like cotton: takes high heat, but frays more and creases easily.
    maxIron: "high",
    frays: 2,
    felts: false,
    slippery: false,
    stretch: false,
    glue: "good",
    notes: ["Linen frays heavily: finish every raw edge.", "Wrinkles easily, takes high heat and presses crisply."],
    warnings: ["Linen frays heavily. Finish every cut edge."],
    goodFor: ["pleats", "napkins", "tote bags", "hems"],
  },
  viscose: {
    // Regenerated plant fibre: weak when wet, shrinks, drapes and slides.
    maxIron: "medium",
    frays: 2,
    felts: false,
    slippery: true,
    stretch: false,
    glue: "poor",
    notes: [
      "Viscose is weak when wet and shrinks: hand wash only.",
      "Drapes and frays, delicate to sew: use a fine needle.",
      "Glue can soak through and stiffen it.",
    ],
    warnings: ["Viscose is weak when wet and can shrink. Hand wash it."],
    goodFor: ["scarves", "scrunchies", "headbands", "soft pouches"],
  },
  elastane: {
    // Any amount of elastane makes the fabric stretch; heat breaks the elastic fibres.
    maxIron: "medium",
    frays: 0,
    felts: false,
    slippery: false,
    stretch: true,
    glue: "poor",
    notes: [
      "Contains elastane, so it stretches: a machine needs a stretch or ballpoint needle.",
      "Do not iron on high heat: it damages the elastic.",
      "The garment can lose its shape once cut.",
    ],
    warnings: ["Stretch fabric: high heat ruins the elastic."],
    goodFor: ["scrunchies", "headbands"],
  },
};

// A fibre counts for safety limits (heat) once it makes up this share of the garment.
// Elastane counts at any amount, as the brief asks.
export const SAFETY_MIN_PERCENT = 5;

// Felting only works when the garment is mostly wool; synthetic content stops it matting evenly.
export const FELT_MIN_WOOL = 80;

// ---------- Weave and garment rules ----------

export type Construction = "knit" | "woven";

// Knits curl and stretch; wovens fray.
export const CONSTRUCTION_RULES: Record<Construction, string[]> = {
  knit: [
    "Knit fabric: edges curl and can unravel. Stitch twice along a line before cutting.",
    "On a machine, use a ballpoint needle and do not pull the fabric.",
  ],
  woven: ["Woven fabric: cut edges fray, so finish them or fray them on purpose."],
};

// Denim is a heavy cotton twill weave, not a fibre.
export const DENIM_RULES = {
  notes: [
    "Denim is thick. Many home machines struggle across several layers or flat-felled seams.",
    "On a machine, use a denim needle (size 100/16 or 110/18).",
    "Hand sewing denim needs a thimble and strong thread. Avoid stitching through the thick seams.",
    "Denim frays nicely for a raw hem.",
  ],
  warnings: ["Denim is thick: avoid sewing through the side seams and flat-felled seams by hand."],
  goodFor: ["raw hems", "tote bags", "patches", "pockets as organisers"],
};

export const GARMENT_RULES: Record<GarmentId, { construction: Construction | "varies"; note: string }> = {
  sweater: { construction: "knit", note: "Sweaters are usually knit." },
  jeans: { construction: "woven", note: "Jeans are woven denim." },
  shirt: { construction: "woven", note: "Shirts are woven." },
  skirt: { construction: "varies", note: "Skirts vary: check if the fabric stretches like a knit." },
  dress: { construction: "varies", note: "Dresses vary: check if the fabric stretches like a knit." },
};

// ---------- Tool rules ----------

export const TOOL_RULES: Record<Exclude<ToolId, "none">, { label: string; enables: string; heat?: Heat }> = {
  sewing_machine: { label: "Sewing machine", enables: "machine seams, hems, tote bags and anything with long straight seams" },
  hand_sewing: { label: "Needle and thread", enables: "hand stitching, sew-on patches, darning, embroidery, buttons" },
  iron: { label: "Iron", enables: "pressing hems and seams flat", heat: "low" },
  fabric_glue: { label: "Fabric glue", enables: "no-sew hems and appliqué" },
  scissors: { label: "Scissors", enables: "cutting, cropping, raw hems, fringes" },
  // Iron-on patches need a medium to hot iron to bond, so they need an iron and a fabric that can take the heat.
  iron_on_patches: { label: "Iron-on patches", enables: "covering holes and stains without sewing", heat: "medium" },
  fabric_paint: { label: "Fabric paint", enables: "painting, stencilling and stamping designs" },
};

// ---------- Skill rules ----------

export const SKILL_RULES: Record<SkillId, { maxDifficulty: number; avoid: string[] }> = {
  // Beginners: one stretch idea is fine, but no techniques that need fitting or drafting.
  beginner: { maxDifficulty: 3, avoid: ["zip replacement", "set-in sleeves", "pattern drafting", "buttonholes"] },
  comfortable: { maxDifficulty: 4, avoid: ["pattern drafting"] },
  confident: { maxDifficulty: 5, avoid: [] },
};

// ---------- Helpers ----------

export const heatAtMost = (a: Heat, b: Heat) => (HEAT.indexOf(a) <= HEAT.indexOf(b) ? a : b);
export const heatAllows = (max: Heat, needed: Heat) => HEAT.indexOf(needed) <= HEAT.indexOf(max);

export const fibreLabel = (id: FibreId) => FIBRES.find((f) => f.id === id)?.label ?? id;

export const partsToText = (parts: FibrePart[]) =>
  parts
    .filter((p) => p.percent > 0)
    .map((p) => `${p.percent}% ${p.fibre}`)
    .join(", ");
