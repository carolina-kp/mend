// Google Gemini via plain REST (no SDK needed). Retries and fallbacks live in lib/ideas.ts.
import { ModelTimeoutError, RateLimitError, splitDataUrl, type Complete } from "./types";

export const complete: Complete = async ({ system, user, image, jsonSchema, temperature = 0.5, timeoutMs = 45_000 }, model) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }, ...(image ? [{ inline_data: splitDataUrl(image) }] : [])] }],
      // Low "thinking" keeps answers fast; quality is still fine for 3 short ideas.
      generationConfig: {
        responseMimeType: "application/json",
        ...(jsonSchema ? { responseJsonSchema: jsonSchema } : {}),
        temperature,
        thinkingConfig: { thinkingLevel: process.env.GEMINI_THINKING || "minimal" },
      },
    }),
    signal: AbortSignal.timeout(timeoutMs), // never leave a tester staring at the spinner
  }).catch((e: Error) => {
    if (e.name === "TimeoutError") throw new ModelTimeoutError();
    throw e;
  });

  if (res.status === 429 || res.status === 503) throw new RateLimitError(); // free-tier limit or overloaded
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);

  const json = await res.json();
  const parts: { text?: string }[] = json.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p.text ?? "").join("");
};
