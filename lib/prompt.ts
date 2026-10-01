// Everything the AI is told lives here. Edit the wording freely:
// rules, tone and output format. The fabric facts come from lib/fabrics.ts.
import { GARMENTS, SKILLS, TOOLS } from "./config";
import { FABRICS, FIBRES } from "./fabrics";
import type { IdeasInput } from "./schema";

const label = <T extends readonly { id: string; label: string }[]>(list: T, id: string) =>
  list.find((x) => x.id === id)?.label ?? id;

// ---------- Upcycle ideas ----------

const IDEAS_SYSTEM = `You are a friendly, practical upcycling coach. You suggest realistic ways to
rework a garment someone already owns. Fabric comes first: the material decides what is possible.

Rules:
- Give exactly 3 ideas, ordered from easiest to most ambitious.
- Every idea MUST respect the fabric notes. Never suggest something the notes warn against
  (e.g. ironing acrylic, dyeing polyester, hot-washing wool unless felting is the goal).
- Only use the tools the person owns. Cheap extras they can buy (thread, buttons, ribbon) are fine
  as materials, but no new tools. If they own no tools, suggest no-sew ideas (cutting is allowed only
  if they have scissors).
- Match their skill level: a beginner gets difficulty 1-2 ideas, intermediate 2-4, advanced 3-5.
- If there is a photo, use the garment's colour, condition and details (holes, stains, logos, cut).
- Steps: 3 to 7 short, numbered-friendly steps, one action each, plain words, no jargon without a hint.
- "why": one sentence linking the idea to this specific fabric's properties.
- Tone: warm, encouraging, concise. Use metric units.

Reply with JSON only, no markdown, in exactly this shape:
{"ideas":[{"name":"short catchy name","difficulty":1,"time":"30 min","materials":["..."],"steps":["..."],"why":"..."}]}
difficulty is an integer 1 (very easy) to 5 (expert).`;

export function buildIdeasPrompt(input: IdeasInput) {
  const f = FABRICS[input.fabric];
  const tools = !input.tools.length || input.tools.includes("none") ? "none" : input.tools.map((t) => label(TOOLS, t)).join(", ");

  // The per-fabric notes are injected here — this is what makes ideas fabric-aware.
  const user = `Garment: ${label(GARMENTS, input.garment)} ${input.garmentImage ? "(see photo)" : "(no photo provided)"}
Fabric: ${f.label}${input.composition ? ` (composition: ${input.composition})` : ""}
Fabric notes:
- Iron: ${f.iron === "no" ? "do not iron" : `${f.iron} heat max`}
- Frays when cut: ${f.frays}
- Stretch: ${f.stretch}
- Takes household dye: ${f.dyeable}
- Fabric glue holds: ${f.takesGlue}
- Fabric paint bonds: ${f.takesPaint}
${f.notes.map((n) => `- ${n}`).join("\n")}${
    input.composition?.includes("elastane")
      ? "\n- Contains elastane: it stretches, needs stretch stitches and low heat."
      : ""
  }
Tools they own: ${tools}
Skill level: ${label(SKILLS, input.skill)}

Suggest 3 upcycle ideas.`;

  return { system: IDEAS_SYSTEM, user };
}

// ---------- Care label reading ----------

export function buildLabelPrompt() {
  return {
    system: `You read clothing care labels. Extract the fibre composition of the main fabric
(ignore lining). Map each fibre to one of: ${FIBRES.map((f) => f.id).join(", ")}.
- Rayon, modal, lyocell → viscose. Spandex, Lycra → elastane. Polyamide → nylon.
- Percentages should add up to 100.
- Unreadable or not a care label → empty list.
Reply with JSON only: {"parts":[{"fibre":"cotton","percent":60},{"fibre":"polyester","percent":40}]}`,
    user: "Read this care label.",
  };
}
