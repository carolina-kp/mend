// What every provider must implement: send a prompt (and maybe one image), get back raw text (JSON).
export type ModelCall = {
  system: string;
  user: string;
  image?: string; // data URL
  jsonSchema?: object; // response shape, for providers that support it
  temperature?: number;
  timeoutMs?: number;
};
export type Complete = (call: ModelCall, model: string) => Promise<string>;

// Thrown when the provider says "too many requests" (common on free tiers).
export class RateLimitError extends Error {}
// Thrown when the provider takes longer than the call allows.
export class ModelTimeoutError extends Error {}

export const splitDataUrl = (dataUrl: string) => {
  const [head, data] = dataUrl.split(",");
  return { mime_type: head.slice(5, head.indexOf(";")), data };
};
