// App options. Adding a garment type or tool is a change here only.

// Placeholder brand name (shown as "mend." with a red dot). Change it here.
export const APP_NAME = "mend";

export const GARMENTS = [
  { id: "sweater", label: "Sweater" },
  { id: "jeans", label: "Jeans" },
  { id: "shirt", label: "Shirt" },
  { id: "skirt", label: "Skirt" },
  { id: "dress", label: "Dress" },
] as const;

export const TOOLS = [
  { id: "sewing_machine", label: "Sewing machine" },
  { id: "hand_sewing", label: "Needle & thread" },
  { id: "iron", label: "Iron" },
  { id: "fabric_glue", label: "Fabric glue" },
  { id: "scissors", label: "Scissors" },
  { id: "iron_on_patches", label: "Iron-on patches" },
  { id: "fabric_paint", label: "Fabric paint" },
  { id: "none", label: "None of these" }, // exclusive: clears the others
] as const;

export const SKILLS = [
  { id: "beginner", label: "Beginner", hint: "I can cut, glue or hand-stitch." },
  { id: "intermediate", label: "Intermediate", hint: "I can sew a straight seam." },
  { id: "advanced", label: "Advanced", hint: "I can work from a pattern." },
] as const;

export type GarmentId = (typeof GARMENTS)[number]["id"];
export type ToolId = (typeof TOOLS)[number]["id"];
export type SkillId = (typeof SKILLS)[number]["id"];

// Helper for zod enums: ["a", "b", ...] from a config list.
export const ids = <T extends readonly { id: string }[]>(list: T) =>
  list.map((x) => x.id) as unknown as [T[number]["id"], ...T[number]["id"][]];

// Limits
export const MAX_IMAGE_PX = 1024; // client resizes to this before upload
export const RATE_LIMIT = { requests: 10, windowMs: 60_000 }; // per IP
