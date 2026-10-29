// Where feedback and choices are stored (server only).
// With SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set: the Supabase "events" table
// (supabase/migrations/001_events.sql), over plain REST, no SDK.
// Without them: data/events.jsonl on this computer (local dev only; Vercel's disk is read-only).
import { appendFile, mkdir, readFile } from "node:fs/promises";
import type { AppEvent } from "./events";

export type StoredEvent = AppEvent & { at: string };

const FILE = "data/events.jsonl";
const supabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return undefined;
  // Legacy service_role keys are JWTs and also go in Authorization; new sb_secret_ keys only go in apikey.
  const auth: Record<string, string> = key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {};
  return { url: `${url.replace(/\/$/, "")}/rest/v1/events`, headers: { apikey: key, ...auth, "Content-Type": "application/json" } };
};

export const storeName = () => (supabase() ? "Supabase" : "local file (data/events.jsonl)");

export async function saveEvent(e: AppEvent): Promise<void> {
  const db = supabase();
  if (!db) {
    await mkdir("data", { recursive: true });
    await appendFile(FILE, JSON.stringify({ at: new Date().toISOString(), ...e }) + "\n");
    return;
  }
  const { type, sessionId, garment, skill, source, sample, ...data } = e;
  const row = {
    type,
    session_id: sessionId,
    garment,
    skill,
    source,
    sample,
    rating: e.type === "feedback" ? e.rating : null,
    would_try: e.type === "feedback" ? e.wouldTry : null,
    data,
  };
  const res = await fetch(db.url, { method: "POST", headers: { ...db.headers, Prefer: "return=minimal" }, body: JSON.stringify(row), signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

export async function listEvents(limit = 5000): Promise<StoredEvent[]> {
  const db = supabase();
  if (!db) {
    const text = await readFile(FILE, "utf8").catch(() => "");
    return text
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l) as StoredEvent)
      .reverse()
      .slice(0, limit);
  }
  const res = await fetch(`${db.url}?select=*&order=created_at.desc&limit=${limit}`, { headers: db.headers, cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const rows: { created_at: string; type: string; session_id: string; garment?: string; skill?: string; source?: string; sample?: string; data: Record<string, unknown> }[] = await res.json();
  return rows.map((r) => ({ at: r.created_at, type: r.type, sessionId: r.session_id, garment: r.garment ?? undefined, skill: r.skill ?? undefined, source: r.source ?? undefined, sample: r.sample ?? undefined, ...r.data }) as StoredEvent);
}
