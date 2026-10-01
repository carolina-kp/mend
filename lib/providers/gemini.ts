// Google Gemini via plain REST (no SDK needed).
import { RateLimitError, splitDataUrl, type Complete } from "./types";

export const complete: Complete = async (call, model) => {
  try {
    return await request(call, model);
  } catch (e) {
    // "Overloaded" spikes are usually brief: wait 2s and try once more.
    if (!(e instanceof OverloadedError)) throw e;
    await new Promise((r) => setTimeout(r, 2000));
    return request(call, model).catch(() => {
      throw new RateLimitError();
    });
  }
};

class OverloadedError extends Error {}

const request: Complete = async ({ system, user, image }, model) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }, ...(image ? [{ inline_data: splitDataUrl(image) }] : [])] }],
      // Low "thinking" keeps answers fast; quality is still fine for 3 short ideas.
      generationConfig: { responseMimeType: "application/json", temperature: 0.7, thinkingConfig: { thinkingLevel: "low" } },
    }),
    signal: AbortSignal.timeout(45_000), // never leave a tester staring at the spinner
  }).catch((e: Error) => {
    if (e.name === "TimeoutError") throw new RateLimitError();
    throw e;
  });

  if (res.status === 429) throw new RateLimitError(); // free-tier limit
  if (res.status === 503) throw new OverloadedError();
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);

  const json = await res.json();
  const parts: { text?: string }[] = json.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p.text ?? "").join("");
};
