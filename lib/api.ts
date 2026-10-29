// Browser-side helpers for calling our server routes.
import type { ToolId } from "./config";
import { pickFallbackIdeas } from "./fallbackIdeas";
import type { IdeasInput, IdeasResponse, LabelResult } from "./schema";

const BUSY_NOTE = "Showing a standard idea set because the AI is busy.";

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data as T;
}

export const readLabel = (labelImage: string) => post<LabelResult>("/api/suggest", { mode: "label", labelImage });

// The server always answers with three ideas. If even the server cannot be reached
// (no signal in the classroom), the same rule-based bank runs here in the browser.
export async function getIdeas(input: IdeasInput): Promise<IdeasResponse> {
  try {
    return await post<IdeasResponse>("/api/ideas", input);
  } catch {
    const tools = input.tools.length ? input.tools : (["none"] as ToolId[]);
    return { ideas: pickFallbackIdeas({ ...input, tools }), source: "fallback", note: BUSY_NOTE };
  }
}

// Fire-and-forget logging of feedback and choices.
export const sendEvent = (event: Record<string, unknown>) =>
  fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(event) }).catch(() => {});

// Anonymous id for this browser tab, so feedback rows from one run can be grouped. Reset makes a new one.
export function sessionId(reset = false): string {
  try {
    let id = sessionStorage.getItem("mend-session");
    if (!id || reset) {
      id = crypto.randomUUID();
      sessionStorage.setItem("mend-session", id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}
