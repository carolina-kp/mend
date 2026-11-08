// The events the app stores: feedback and choices. Only what section 8 of the brief allows:
// anonymous session id, garment, fabric mix, tools, skill, ideas shown, ratings, feedback text, timestamps.
// No names, no emails, no photos, no free-text notes from the brief screen.
import { z } from "zod";
import { GARMENTS, SKILLS, TOOLS, ids } from "./config";
import { FibrePartSchema } from "./schema";

const Context = z.object({
  sessionId: z.string().max(64),
  garment: z.enum(ids(GARMENTS)).optional(),
  parts: z.array(FibrePartSchema).max(8).optional(),
  tools: z.array(z.enum(ids(TOOLS))).max(8).optional(),
  skill: z.enum(ids(SKILLS)).optional(),
  source: z.enum(["ai", "fallback", "sample"]).optional(),
  sample: z.string().max(40).optional(), // demo garment id, when one was used
  ideas: z.array(z.string().max(80)).max(3).optional(), // titles of the ideas shown
});

export const AppEvent = z.discriminatedUnion("type", [
  Context.extend({
    type: z.literal("feedback"),
    rating: z.number().int().min(1).max(5),
    wouldTry: z.boolean(),
    comment: z.string().max(1000).optional(),
    chosenIdea: z.string().max(80).optional(),
  }),
  Context.extend({
    type: z.literal("followup"), // the one-week "Did you make it?" page
    made: z.boolean(),
    idea: z.string().max(80).optional(),
    story: z.string().max(1000).optional(),
  }),
  Context.extend({
    type: z.literal("choice"),
    choice: z.enum(["make", "get_it_made"]),
    idea: z.string().max(80),
    hasNotes: z.boolean().optional(),
    hasEmail: z.boolean().optional(), // left contact details on the quote request (H3)
    budget: z.number().min(0).max(10000).optional(),
  }),
]);
export type AppEvent = z.infer<typeof AppEvent>;
