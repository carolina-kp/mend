import { describe, expect, it } from "vitest";
import { summarise, toCsv } from "./lab";
import type { StoredEvent } from "./store";

const base = { at: "2026-10-29T10:00:00Z", sessionId: "s1", garment: "jeans" as const, skill: "beginner" as const, source: "ai" as const, parts: [{ fibre: "cotton" as const, percent: 100 }], tools: ["scissors" as const], ideas: ["A", "B", "C"] };
const events: StoredEvent[] = [
  { ...base, type: "feedback", rating: 4, wouldTry: true, comment: 'Nice, "quoted"' },
  { ...base, sessionId: "s2", type: "feedback", rating: 2, wouldTry: false, comment: "=HYPERLINK(1)" },
  { ...base, type: "choice", choice: "get_it_made", idea: "A", hasNotes: true, budget: 200 },
];

describe("lab", () => {
  it("summarises ratings, would-try and choices", () => {
    expect(summarise(events)).toEqual({ sessions: 2, feedbackCount: 2, averageRating: 3, averageRatingAi: 3, wouldTryPct: 50, makeCount: 0, getMadeCount: 1, getMadePct: 50, contactPct: 0 });
  });

  it("exports CSV with escaped quotes and defused formulas", () => {
    const csv = toCsv(events);
    const lines = csv.trim().split("\r\n");
    expect(lines).toHaveLength(4);
    expect(lines[0]).toMatch(/^at,type,session_id/);
    expect(csv).toContain('"Nice, ""quoted"""');
    expect(csv).toContain(`"'=HYPERLINK(1)"`);
    expect(lines[3]).toContain('"get_it_made"');
  });
});
