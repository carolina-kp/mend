// Lab mode helpers (server only): passcode check, CSV export and the summary numbers.
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { sideStats, winner, type LabRating, type LabRun } from "./compare";
import { listRows, type StoredEvent } from "./store";

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

export const CSV_COLUMNS = ["at", "type", "session_id", "sample", "garment", "fabric", "tools", "skill", "source", "ideas_shown", "rating", "would_try", "chosen_idea", "choice", "idea", "has_notes", "has_email", "budget", "made", "comment"] as const;

export function eventRow(e: StoredEvent): Record<(typeof CSV_COLUMNS)[number], string> {
  const f = e.type === "feedback" ? e : undefined;
  const c = e.type === "choice" ? e : undefined;
  const fu = e.type === "followup" ? e : undefined;
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
    idea: c?.idea ?? fu?.idea ?? "",
    has_notes: c?.hasNotes === undefined ? "" : c.hasNotes ? "yes" : "no",
    has_email: c?.hasEmail === undefined ? "" : c.hasEmail ? "yes" : "no",
    budget: c?.budget === undefined ? "" : String(c.budget),
    made: fu ? (fu.made ? "yes" : "no") : "",
    comment: f?.comment ?? fu?.story ?? "",
  };
}

// Quotes every cell, and stops spreadsheet apps from running a cell that starts like a formula.
const cell = (v: string) => `"${(/^[=+\-@\t\r]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;

export const toCsv = (events: StoredEvent[]) =>
  [CSV_COLUMNS.join(","), ...events.map((e) => CSV_COLUMNS.map((k) => cell(eventRow(e)[k])).join(","))].join("\r\n") + "\r\n";

const sessionCount = (events: StoredEvent[]) => new Set(events.map((e) => e.sessionId)).size;

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
    // H3: share of tester sessions that tapped "get it made", and that left an email for a quote.
    getMadePct: pct(new Set(choices.filter((e) => e.choice === "get_it_made").map((e) => e.sessionId)).size, sessionCount(events)),
    contactPct: pct(new Set(choices.filter((e) => e.choice === "get_it_made" && e.hasEmail).map((e) => e.sessionId)).size, sessionCount(events)),
  };
}

// ---------- Blind comparisons ----------

export async function loadComparisons() {
  const [runs, ratings] = await Promise.all([listRows("lab_runs"), listRows("lab_ratings")]);
  const byRun = new Map<string, LabRating[]>();
  for (const r of ratings as LabRating[]) byRun.set(r.run_id, [...(byRun.get(r.run_id) ?? []), r]);
  const all = (runs as LabRun[]).map((run) => ({ run, ratings: byRun.get(run.id) ?? [] }));
  const pairs = all.flatMap(({ run, ratings }) => ratings.map((rating) => ({ run, rating })));
  return { all, pairs, mend: sideStats(pairs, "mend"), chatbot: sideStats(pairs, "chatbot") };
}

export const RATING_COLUMNS = ["rated_at", "run_id", "run_at", "garment", "fabric", "tools", "skill", "rater", "set", "is_mend", "mend_source", "idea_index", "idea_title", "feasibility", "creativity", "fabric_suitability", "unsafe", "set_comment", "run_winner"] as const;

// One row per rated idea, with the true mapping, for analysis in a spreadsheet.
export function ratingsCsv(pairs: { run: LabRun; rating: LabRating }[]) {
  const rows = pairs.flatMap(({ run, rating }) =>
    rating.ratings.map((r) => {
      const idea = (r.set === 1 ? run.set1 : run.set2)[r.index];
      const row: Record<(typeof RATING_COLUMNS)[number], string> = {
        rated_at: rating.created_at,
        run_id: run.id,
        run_at: run.created_at,
        garment: run.garment,
        fabric: run.input.parts.map((p) => `${p.percent}% ${p.fibre}`).join(", "),
        tools: run.input.tools.join("; "),
        skill: run.skill,
        rater: rating.rater ?? "",
        set: String(r.set),
        is_mend: r.set === run.mend_set ? "yes" : "no",
        mend_source: run.mend_source,
        idea_index: String(r.index + 1),
        idea_title: idea?.title ?? "",
        feasibility: String(r.feasibility),
        creativity: String(r.creativity),
        fabric_suitability: String(r.fabric),
        unsafe: r.unsafe ? "yes" : "no",
        set_comment: (r.set === 1 ? rating.comments.set1 : rating.comments.set2) ?? "",
        run_winner: winner(run, rating),
      };
      return RATING_COLUMNS.map((k) => cell(row[k])).join(",");
    }),
  );
  return [RATING_COLUMNS.join(","), ...rows].join("\r\n") + "\r\n";
}

// ---------- Quote requests ----------

export type QuoteRow = { id: string; created_at: string; garment: string; parts: { fibre: string; percent: number }[]; idea: { title: string; difficulty: number }; budget?: number | null; desired_date?: string | null; notes?: string | null; email?: string };

export async function loadQuotes(): Promise<QuoteRow[]> {
  const [quotes, contacts] = await Promise.all([listRows("quotes", { limit: 500 }), listRows("quote_contacts", { limit: 500 })]);
  const email = new Map(contacts.map((c) => [String(c.quote_id), String(c.email)]));
  return (quotes as QuoteRow[]).map((q) => ({ ...q, email: email.get(q.id) }));
}

// ---------- Trial tracking (H2) ----------

export type Trial = {
  sessionId: string;
  code: string; // first 8 characters, used in the follow-up link
  at: string;
  rating?: number;
  wouldTry?: boolean;
  followupSent: boolean;
  made?: boolean; // from the follow-up answer, or set by hand in the lab
  madeBy?: "tester" | "lab";
  ideaMade?: string;
  story?: string;
};

export async function loadTrials(events: StoredEvent[]): Promise<{ trials: Trial[]; madePct: number }> {
  const marks = new Map((await listRows("trials")).map((t) => [String(t.session_id), t]));
  const followups = events.filter((e) => e.type === "followup");
  const trials = events
    .filter((e) => e.type === "feedback")
    .map((f) => {
      const code = f.sessionId.slice(0, 8);
      // Follow-ups match on the full session id, or on the code when the session was not found.
      const answer = followups.find((e) => e.sessionId === f.sessionId || e.sessionId === `followup-${code}`);
      const mark = marks.get(f.sessionId);
      const lab = typeof mark?.made === "boolean" ? mark.made : undefined;
      return {
        sessionId: f.sessionId,
        code,
        at: f.at,
        rating: f.type === "feedback" ? f.rating : undefined,
        wouldTry: f.type === "feedback" ? f.wouldTry : undefined,
        followupSent: mark?.followup_sent === true,
        made: answer?.type === "followup" ? answer.made : lab,
        madeBy: answer ? ("tester" as const) : lab !== undefined ? ("lab" as const) : undefined,
        ideaMade: answer?.type === "followup" ? answer.idea : undefined,
        story: answer?.type === "followup" ? answer.story : undefined,
      };
    })
    // One row per tester: the most recent feedback wins.
    .filter((t, i, all) => all.findIndex((x) => x.sessionId === t.sessionId) === i);
  const madePct = trials.length ? Math.round((trials.filter((t) => t.made).length / trials.length) * 100) : 0;
  return { trials, madePct };
}
