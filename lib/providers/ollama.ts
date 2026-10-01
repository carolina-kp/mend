// Local Ollama (free, runs on your computer). Needs a vision model, e.g. `ollama pull llama3.2-vision`.
import { splitDataUrl, type Complete } from "./types";

export const complete: Complete = async ({ system, user, image }, model) => {
  const base = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      format: "json",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user, ...(image ? { images: [splitDataUrl(image).data] } : {}) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()).message?.content ?? "";
};
