// Lab mode helpers (server only): passcode check, CSV export and the summary numbers.
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { StoredEvent } from "./store";

export const LAB_COOKIE = "mend_lab";
const hash = (s: string) => createHash("sha256").update(`mend-lab:${s}`).digest();

export const labEnabled = () => !!process.env.LAB_PASSCODE;

export function passcodeMatches(attempt: string): boolean {
  const code = process.env.LAB_PASSCODE;
  return !!code && timingSafeEqual(hash(attempt), hash(code));
}
// The cookie holds a hash of the passcode, so changing LAB_PASSCODE logs everyone out.
export const labCookieValue = () => hash(process.env.LAB_PASSCODE ?? "").toString("hex");

export async function isLabUser(): Promise<boolean> {
  const value = (await cookies()).get(LAB_COOKIE)?.value;
  return labEnabled() && !!value && value === labCookieValue();
}

const parts = (e: StoredEvent) => (e.parts ?? []).map((p) => `${p.percent}% ${p.fibre}`).join(", ");

export const CSV_COLUMNS = ["at", "type", "session_id", "sample", "garment", "fabric", "tools", "skill", "source", "ideas_shown", "rating", "would_try", "chosen_idea", "choice", "idea", "has_notes", "budget", "comment"] as const;

export function eventRow(e: StoredEvent): Record<(typeof CSV_COLUMNS)[number], string> {
  const f = e.type === "feedback" ? e : undefined;
  const c = e.type === "choice" ? e : undefined;
  return {
    at: e.at,
    type: e.type,
    session_id: e.sessionId,
    sample: e.sample ?? "",
    garment: e.garment ?? "",
    fabric: parts(e),
    tools: (e.tools ?? []).join("; "),
    skill: e.skill ?? "",
    source: e.source ?? "",
    ideas_shown: (e.ideas ?? []).join(" | "),
    rating: f ? String(f.rating) : "",
    would_try: f ? (f.wouldTry ? "yes" : "no") : "",
    chosen_idea: f?.chosenIdea ?? "",
    choice: c?.choice ?? "",
    idea: c?.idea ?? "",
    has_notes: c?.hasNotes === undefined ? "" : c.hasNotes ? "yes" : "no",
    budget: c?.budget === undefined ? "" : String(c.budget),
    comment: f?.comment ?? "",
  };
}

// Quotes every cell, and stops spreadsheet apps from running a cell that starts like a formula.
const cell = (v: string) => `"${(/^[=+\-@\t\r]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;

export const toCsv = (events: StoredEvent[]) =>
  [CSV_COLUMNS.join(","), ...events.map((e) => CSV_COLUMNS.map((k) => cell(eventRow(e)[k])).join(","))].join("\r\n") + "\r\n";

export function summarise(events: StoredEvent[]) {
  const feedback = events.filter((e) => e.type === "feedback");
  const choices = events.filter((e) => e.type === "choice");
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10 : 0);
  return {
    sessions: new Set(events.map((e) => e.sessionId)).size,
    feedbackCount: feedback.length,
    averageRating: avg(feedback.map((e) => e.rating)),
    averageRatingAi: avg(feedback.filter((e) => e.source === "ai").map((e) => e.rating)),
    wouldTryPct: pct(feedback.filter((e) => e.wouldTry).length, feedback.length),
    makeCount: choices.filter((e) => e.choice === "make").length,
    getMadeCount: choices.filter((e) => e.choice === "get_it_made").length,
  };
}
