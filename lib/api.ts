// Browser-side helper for calling our one server route.
import type { IdeasInput, Idea, LabelResult } from "./schema";

async function post<T>(body: unknown): Promise<T> {
  const res = await fetch("/api/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data as T;
}

export const readLabel = (labelImage: string) => post<LabelResult>({ mode: "label", labelImage });

export const getIdeas = (input: Omit<IdeasInput, "mode">) =>
  post<{ ideas: Idea[] }>({ mode: "ideas", ...input });

// Fire-and-forget logging of feedback / service interest.
export const sendEvent = (event: Record<string, unknown>) =>
  fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  }).catch(() => {});
