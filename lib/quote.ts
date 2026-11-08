// "Request a quote": the ready brief, stored without photos. The optional email goes in a
// separate table and is only used to reply. Server only.
import { z } from "zod";
import { GARMENTS, ids } from "./config";
import { FibrePartSchema } from "./schema";
import { insertRow } from "./store";

export const QuoteRequest = z.object({
  sessionId: z.string().max(64),
  garment: z.enum(ids(GARMENTS)),
  parts: z.array(FibrePartSchema).min(1).max(8),
  idea: z.object({
    id: z.string().max(60),
    title: z.string().max(80),
    steps: z.array(z.string().max(400)).max(10),
    difficulty: z.number().int().min(1).max(5),
    timeMinutes: z.number().int().min(5).max(2400),
    menderBrief: z.string().max(500),
  }),
  notes: z.string().trim().max(500).optional(),
  budget: z.number().int().min(0).max(10000).optional(),
  desiredDate: z.iso.date().optional(),
  email: z.email().max(254).optional(),
  website: z.string().max(200).optional(), // honeypot: people never see or fill it
});
export type QuoteRequest = z.infer<typeof QuoteRequest>;

export async function saveQuote(q: QuoteRequest): Promise<string> {
  const row = await insertRow("quotes", {
    session_id: q.sessionId,
    garment: q.garment,
    parts: q.parts,
    idea: q.idea,
    notes: q.notes || null,
    budget: q.budget ?? null,
    desired_date: q.desiredDate ?? null,
  });
  const id = String(row.id);
  if (q.email) await insertRow("quote_contacts", { quote_id: id, email: q.email });
  return id;
}

// Optional email to the team through Resend's free tier, only if RESEND_API_KEY and QUOTE_NOTIFY_EMAIL are set.
// The requester's email is never put in the message; the team finds it in /lab.
export async function notifyTeam(id: string, q: QuoteRequest, origin: string) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.QUOTE_NOTIFY_EMAIL;
  if (!key || !to) return;
  const text = [
    `New quote request: ${q.idea.title} (${q.garment}, ${q.parts.map((p) => `${p.percent}% ${p.fibre}`).join(", ")})`,
    `Difficulty ${q.idea.difficulty}/5, about ${q.idea.timeMinutes} minutes.`,
    q.budget != null ? `Budget: ${q.budget} kr` : "",
    q.desiredDate ? `Wanted by: ${q.desiredDate}` : "",
    q.email ? "They left an email: see /lab." : "No email left.",
    `Brief: ${origin}/brief/${id}`,
  ]
    .filter(Boolean)
    .join("\n");
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.QUOTE_FROM_EMAIL || "mend. <onboarding@resend.dev>", to, subject: `mend. quote request: ${q.idea.title}`, text }),
    signal: AbortSignal.timeout(5000),
  })
    .then((r) => !r.ok && console.error("quote email failed:", r.status))
    .catch((e) => console.error("quote email failed:", (e as Error).message));
}
