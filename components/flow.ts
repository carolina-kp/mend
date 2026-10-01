// The screens of the app, in order, and the answers collected along the way.
import type { GarmentId, SkillId, ToolId } from "@/lib/config";
import type { FabricId, FibrePart } from "@/lib/fabrics";

export const SCREENS = [
  { id: "garment", name: "Garment" },
  { id: "photo", name: "Photo" },
  { id: "fabricChoice", name: "Fabric · choice" },
  { id: "fabric", name: "Fabric · fibres" },
  { id: "tools", name: "Your tools" },
  { id: "skill", name: "Your skill" },
  { id: "loading", name: "Finding ideas" },
  { id: "results", name: "Your ideas" },
  { id: "service", name: "Get it made" },
  { id: "feedback", name: "Feedback" },
] as const;

export type ScreenId = (typeof SCREENS)[number]["id"] | "sheet";

export type Answers = {
  garment?: GarmentId;
  garmentImage?: string;
  fabric?: FabricId;
  composition?: string;
  parts: FibrePart[];
  tools: ToolId[];
  skill?: SkillId;
};

export const EMPTY_ANSWERS: Answers = { parts: [{ fibre: "cotton", percent: 100 }], tools: [] };

export const isComplete = (a: Answers) => !!(a.garment && a.fabric && a.skill);
