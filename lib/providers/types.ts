// What every provider must implement: send a prompt + one image, get back raw text (JSON).
export type ModelCall = { system: string; user: string; image?: string /* data URL */ };
export type Complete = (call: ModelCall, model: string) => Promise<string>;

// Thrown when the provider says "too many requests" (common on free tiers).
export class RateLimitError extends Error {}

export const splitDataUrl = (dataUrl: string) => {
  const [head, data] = dataUrl.split(",");
  return { mime_type: head.slice(5, head.indexOf(";")), data };
};
