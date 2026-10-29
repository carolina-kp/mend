// Picks the provider from LLM_PROVIDER and turns raw model text into validated data.
// Server-only: imported by API routes, never by the browser.
import type { z } from "zod";
import { buildLabelPrompt } from "../prompt";
import { LabelResult } from "../schema";
import * as gemini from "./gemini";
import * as ollama from "./ollama";
import type { ModelCall } from "./types";

const PROVIDERS = { gemini, ollama }; // FUTURE: add more providers here

export function provider() {
  const name = (process.env.LLM_PROVIDER || "gemini") as keyof typeof PROVIDERS;
  const model = process.env.LLM_MODEL || "gemini-3.5-flash";
  if (!PROVIDERS[name]) throw new Error(`Unknown LLM_PROVIDER "${name}"`);
  return { complete: PROVIDERS[name].complete, model };
}

// Raw model text to JSON, tolerating code fences some models add.
export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    return undefined;
  }
}

// Call the model, parse JSON, validate. If the shape is wrong, retry once.
async function callJson<T>(call: ModelCall, schema: z.ZodType<T>): Promise<T> {
  const { complete, model } = provider();
  for (let attempt = 1; ; attempt++) {
    const result = schema.safeParse(parseJson(await complete(call, model)));
    if (result.success) return result.data;
    console.warn(`Invalid model output (attempt ${attempt}):`, result.error.issues.slice(0, 3));
    if (attempt >= 2) throw new InvalidOutputError();
  }
}

export class InvalidOutputError extends Error {}

export const readCareLabel = (labelImage: string) => callJson({ ...buildLabelPrompt(), image: labelImage }, LabelResult);
