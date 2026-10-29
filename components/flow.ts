// The screens of the app, in order, and the answers collected along the way.
import type { GarmentId, SkillId, ToolId } from "@/lib/config";
import type { FibrePart } from "@/lib/fabricRules";

export const SCREENS = [
  { id: "garment", name: "Garment" },
  { id: "photo", name: "Photo" },
  { id: "fabricChoice", name: "Fabric · choice" },
  { id: "fabric", name: "Fabric · fibres" },
  { id: "tools", name: "Your tools" },
  { id: "skill", name: "Your skill" },
  { id: "loading", name: "Finding ideas" },
  { id: "results", name: "Your ideas" },
  { id: "detail", name: "Idea detail" },
  { id: "make", name: "Make it myself" },
  { id: "made", name: "Get it made" },
  { id: "feedback", name: "Feedback" },
] as const;

export type ScreenId = (typeof SCREENS)[number]["id"] | "sheet";

export type Answers = {
  garment?: GarmentId;
  garmentImage?: string; // resized photo, memory only
  parts: FibrePart[];
  tools: ToolId[];
  skill?: SkillId;
};

export const EMPTY_ANSWERS: Answers = { parts: [{ fibre: "cotton", percent: 100 }], tools: [] };

export const isComplete = (a: Answers) => !!(a.garment && a.skill && a.parts.reduce((s, p) => s + p.percent, 0) === 100);

export const formatMinutes = (m: number) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} h`);

// Ideas arrive easiest first, so their position says how ambitious they are.
export const ambition = (index: number) => ["QUICK", "MEDIUM", "STRETCH"][index] ?? "";
