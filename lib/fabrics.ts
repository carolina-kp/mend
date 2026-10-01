// Fabric knowledge base — the core of the app.
// The material decides what is possible, so these notes are injected into the
// prompt for the fabric the user picked (see lib/prompt.ts).
//
// To add a fabric: copy one entry, give it a new id, fill in the fields.
// It then shows up in the dropdown automatically. Plain English is fine:
// the notes are read by the AI, not by code.

export type FabricNotes = {
  label: string; // shown in the dropdown
  iron: "hot" | "medium" | "low" | "no"; // max safe iron heat (affects iron-on patches, fusing)
  frays: "a lot" | "a little" | "no"; // raw edges unravel? decides if edges must be finished
  stretch: "none" | "some" | "a lot"; // affects seams, cutting, and how glue/paint crack
  dyeable: "yes" | "partly" | "no"; // with normal household fabric dye
  takesGlue: "yes" | "partly" | "no"; // fabric glue holds well?
  takesPaint: "yes" | "partly" | "no"; // fabric paint bonds well?
  notes: string[]; // anything else the AI must respect
};

export const FABRICS = {
  cotton: {
    label: "Cotton",
    iron: "hot",
    frays: "a lot",
    stretch: "none",
    dyeable: "yes",
    takesGlue: "yes",
    takesPaint: "yes",
    notes: [
      "Very forgiving for beginners: easy to cut, sew, press and paint.",
      "Shrinks in hot washes — pre-wash any patches or added fabric.",
    ],
  },
  wool: {
    label: "Wool",
    iron: "medium",
    frays: "a little",
    stretch: "some",
    dyeable: "yes",
    takesGlue: "partly",
    takesPaint: "partly",
    notes: [
      // Felting is the big risk and also an opportunity.
      "FELTING RISK: hot water + agitation shrinks and mats wool. Never suggest hot washing unless felting is the goal.",
      "Deliberate felting (hot wash) turns a knit into a dense fabric that does not unravel when cut — great for mittens, coasters, patches.",
      "Unfelted knitted wool unravels when cut: stitch twice along the cut line before cutting.",
      "Iron only with a damp pressing cloth; steam, do not press hard.",
      "Visible mending (darning, embroidery) suits wool well.",
    ],
  },
  polyester: {
    label: "Polyester",
    iron: "low",
    frays: "a little",
    stretch: "some",
    dyeable: "no",
    takesGlue: "partly",
    takesPaint: "partly",
    notes: [
      "Does not take normal household dye — avoid dye-based ideas (special disperse dye only).",
      "Melts with high heat: low iron, iron-on patches need a pressing cloth and may not stick well.",
      "Cut edges can be sealed by carefully passing near a flame — advanced only, mention safety.",
    ],
  },
  acrylic: {
    label: "Acrylic",
    iron: "no",
    frays: "a lot",
    stretch: "a lot",
    dyeable: "no",
    takesGlue: "partly",
    takesPaint: "partly",
    notes: [
      "Do NOT iron directly: acrylic knits go limp and shiny permanently ('killed'). No iron-on patches.",
      "Does not felt (unlike wool) and does not take household dye.",
      "Knits unravel when cut: stitch twice along the line before cutting.",
      "Good for sew-on patches, embroidery, adding buttons, cropping with a finished hem.",
    ],
  },
  denim: {
    label: "Denim",
    iron: "hot",
    frays: "a lot",
    stretch: "none",
    dyeable: "partly",
    takesGlue: "yes",
    takesPaint: "yes",
    notes: [
      "Thick: hand sewing through seams is hard; a sewing machine needs a denim needle.",
      "Fraying can be a design feature (raw hems, distressing).",
      "Can be bleached for lighter patterns; dark denim does not dye lighter, only darker.",
      "If it contains elastane (stretch denim), lower the iron heat.",
    ],
  },
  linen: {
    label: "Linen",
    iron: "hot",
    frays: "a lot",
    stretch: "none",
    dyeable: "yes",
    takesGlue: "yes",
    takesPaint: "yes",
    notes: [
      "Frays heavily: finish every raw edge (zigzag, French seam, or fray check).",
      "Wrinkles easily, presses crisply — good for structured edits like pleats.",
    ],
  },
  viscose: {
    label: "Viscose / rayon",
    iron: "medium",
    frays: "a lot",
    stretch: "none",
    dyeable: "yes",
    takesGlue: "partly",
    takesPaint: "partly",
    notes: [
      "Slippery and drapey: hard to cut straight, not ideal for beginners' sewing.",
      "Weak when wet and can shrink a lot: hand wash, never tumble dry.",
      "Fabric glue can show through or stiffen it.",
    ],
  },
  blend: {
    label: "Blend / mixed",
    iron: "low",
    frays: "a little",
    stretch: "some",
    dyeable: "partly",
    takesGlue: "partly",
    takesPaint: "partly",
    notes: [
      "Treat as the most delicate fibre in the mix (e.g. lowest iron temperature).",
      "Synthetic content (polyester, acrylic) reduces how well dye takes.",
      "Test glue, paint, and iron on a hidden area first.",
    ],
  },
} satisfies Record<string, FabricNotes>;

export type FabricId = keyof typeof FABRICS;
export const FABRIC_IDS = Object.keys(FABRICS) as FabricId[];

// ---------- Fibres (what a care label lists) ----------
// Users enter a composition like 80% cotton + 20% polyester. We map that to
// the closest fabric entry above so the right notes get injected.
// Fibres without their own entry (nylon, elastane) only count toward "blend".
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

const DOMINANT = 70; // a fibre at or above this % decides the fabric type

export function fabricFromParts(parts: FibrePart[], garment?: string): FabricId {
  const top = [...parts].sort((a, b) => b.percent - a.percent)[0];
  if (!top || top.percent < DOMINANT || !(top.fibre in FABRICS)) return "blend";
  // Jeans that are mostly cotton are denim (a weave, not a fibre).
  if (top.fibre === "cotton" && garment === "jeans") return "denim";
  return top.fibre as FabricId;
}

export const partsToText = (parts: FibrePart[]) =>
  parts
    .filter((p) => p.percent > 0)
    .map((p) => `${p.percent}% ${p.fibre}`)
    .join(", ");
