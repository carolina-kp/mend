// Picks the provider from LLM_PROVIDER and turns raw model text into validated data.
// Server-only: imported by the API route, never by the browser.
import type { z } from "zod";
import { buildIdeasPrompt, buildLabelPrompt } from "../prompt";
import { IdeasResult, LabelResult, type IdeasInput } from "../schema";
import * as gemini from "./gemini";
import * as ollama from "./ollama";
import type { ModelCall } from "./types";

const PROVIDERS = { gemini, ollama }; // FUTURE: add more providers here

function provider() {
  const name = (process.env.LLM_PROVIDER || "gemini") as keyof typeof PROVIDERS;
  const model = process.env.LLM_MODEL;
  if (!PROVIDERS[name]) throw new Error(`Unknown LLM_PROVIDER "${name}"`);
  if (!model) throw new Error("LLM_MODEL is not set");
  return { complete: PROVIDERS[name].complete, model };
}

// Call the model, parse JSON, validate. If the shape is wrong, retry once.
async function callJson<T>(call: ModelCall, schema: z.ZodType<T>): Promise<T> {
  const { complete, model } = provider();
  for (let attempt = 1; ; attempt++) {
    const text = await complete(call, model);
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, ""); // some models wrap JSON in fences
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {}
    const result = schema.safeParse(parsed);
    if (result.success) return result.data;
    console.warn(`Invalid model output (attempt ${attempt}):`, result.error.issues.slice(0, 3));
    if (attempt >= 2) throw new InvalidOutputError();
  }
}

export class InvalidOutputError extends Error {}

export const generateSuggestions = (input: IdeasInput) =>
  callJson({ ...buildIdeasPrompt(input), image: input.garmentImage }, IdeasResult);

export const readCareLabel = (labelImage: string) =>
  callJson({ ...buildLabelPrompt(), image: labelImage }, LabelResult);
