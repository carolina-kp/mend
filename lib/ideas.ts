// The ideas pipeline (server only):
// 1. rules -> constraints  2. prompt  3. Gemini (JSON, low temperature, 8s timeout)
// 4. Zod schema check + rule check, retry once with the broken rules listed
// 5. anything still missing is filled from the rule-based bank. Never throws.
import { z } from "zod";
import { buildConstraints, checkIdea, type Constraints } from "./buildConstraints";
import { pickFallbackIdeas } from "./fallbackIdeas";
import { buildIdeasPrompt } from "./prompt";
import { parseJson, provider } from "./providers";
import { ModelTimeoutError, RateLimitError } from "./providers/types";
import { IdeasResult, type Idea, type IdeasInput, type IdeasResponse } from "./schema";

const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 8_000;
const CACHE_MS = 10 * 60_000; // identical requests reuse the answer for 10 minutes (free-tier limits)
export const BUSY_NOTE = "Showing a standard idea set because the AI is busy.";

// Gemini gets the same shape we validate against.
const IDEAS_JSON_SCHEMA = z.toJSONSchema(IdeasResult) as Record<string, unknown>;
delete IDEAS_JSON_SCHEMA.$schema;

const cache = new Map<string, { at: number; value: IdeasResponse }>();
const inFlight = new Map<string, Promise<IdeasResponse>>();

const cacheKey = (input: IdeasInput) =>
  JSON.stringify([input.garment, [...input.parts].sort((a, b) => a.fibre.localeCompare(b.fibre)), [...input.tools].sort(), input.skill]);

export function fallbackResponse(c: Constraints): IdeasResponse {
  return { ideas: pickFallbackIdeas(c), source: "fallback", note: BUSY_NOTE };
}

export async function getIdeas(input: IdeasInput, { allowAi = true } = {}): Promise<IdeasResponse> {
  const c = buildConstraints(input);
  if (!allowAi) return fallbackResponse(c);

  // Photos make every request unique, so only photo-less requests are cached and shared.
  const key = input.garmentImage ? undefined : cacheKey(input);
  if (key) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
    const pending = inFlight.get(key);
    if (pending) return pending; // same question already on its way: wait for that answer
  }

  const run = askModel(c, input.garmentImage)
    .catch((e) => {
      console.error("ideas pipeline failed:", (e as Error).message);
      return fallbackResponse(c);
    })
    .then((value) => {
      if (key && value.source === "ai") {
        cache.set(key, { at: Date.now(), value });
        if (cache.size > 500) cache.delete(cache.keys().next().value!); // keep memory bounded
      }
      return value;
    })
    .finally(() => key && inFlight.delete(key));
  if (key) inFlight.set(key, run);
  return run;
}

async function askModel(c: Constraints, image?: string): Promise<IdeasResponse> {
  const { complete, model } = provider();
  let keep: Idea[] = []; // ideas from the model that passed every check
  let retryNote: string | undefined;

  for (let attempt = 1; attempt <= 2; attempt++) {
    let text: string;
    try {
      text = await complete({ ...buildIdeasPrompt(c, !!image, retryNote), image, jsonSchema: IDEAS_JSON_SCHEMA, temperature: 0.5, timeoutMs: TIMEOUT_MS }, model);
    } catch (e) {
      // Busy or slow: waiting again would only keep people staring at the spinner.
      if (e instanceof RateLimitError || e instanceof ModelTimeoutError) {
        console.warn(`Gemini ${e instanceof RateLimitError ? "busy" : "timed out"} (attempt ${attempt})`);
        break;
      }
      console.warn(`Gemini error (attempt ${attempt}):`, (e as Error).message);
      continue;
    }

    const parsed = IdeasResult.safeParse(parseJson(text));
    if (!parsed.success) {
      console.warn(`Invalid model output (attempt ${attempt}):`, parsed.error.issues.slice(0, 3));
      retryNote = "- The JSON did not match the required shape. Return exactly 3 complete ideas.";
      continue;
    }

    const problems = parsed.data.ideas.map((idea) => checkIdea(idea, c));
    const passing = parsed.data.ideas.filter((_, i) => problems[i].length === 0);
    if (passing.length > keep.length) keep = passing;
    if (passing.length === 3) break;
    console.warn(`Rule check flagged (attempt ${attempt}):`, problems.flat());
    retryNote = parsed.data.ideas
      .map((idea, i) => (problems[i].length ? `- "${idea.title}": ${problems[i].join("; ")}` : ""))
      .filter(Boolean)
      .join("\n");
  }

  if (!keep.length) return fallbackResponse(c);
  // Top up with rule-based ideas if the model only managed one or two safe ones.
  const topUp = keep.length < 3 ? pickFallbackIdeas(c, 3 - keep.length, keep.map((i) => i.title.toLowerCase())) : [];
  return { ideas: finish([...keep, ...topUp], c), source: "ai" };
}

// Unique ids, fibre warnings on every idea, easiest first.
function finish(ideas: Idea[], c: Constraints): Idea[] {
  const seen = new Set<string>();
  return ideas
    .slice(0, 3)
    .map((idea, i) => {
      let id = idea.id.toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 40) || `idea-${i + 1}`;
      if (seen.has(id)) id = `${id}-${i + 1}`;
      seen.add(id);
      let warnings = idea.warnings.length ? idea.warnings : c.warnings.slice(0, 1);
      // Heat-sensitive fabric: the heat warning is always shown, whatever the model wrote.
      if (c.heatWarning && !warnings.includes(c.heatWarning)) warnings = [c.heatWarning, ...warnings].slice(0, 4);
      return { ...idea, id, warnings };
    })
    .sort((a, b) => a.difficulty - b.difficulty);
}
