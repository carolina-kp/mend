// Where the prototype keeps its data (server only).
// With SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set: Supabase tables (supabase/migrations/), over plain REST, no SDK.
// Without them: one JSONL file per table in data/ on this computer (local dev only; Vercel's disk is read-only).
import { randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import type { AppEvent } from "./events";

export type Table = "events" | "lab_runs" | "lab_ratings" | "quotes" | "quote_contacts" | "trials";
type Row = Record<string, unknown>;

const supabase = (table: Table) => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return undefined;
  // Legacy service_role keys are JWTs and also go in Authorization; new sb_secret_ keys only go in apikey.
  const auth: Record<string, string> = key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {};
  return { url: `${url.replace(/\/$/, "")}/rest/v1/${table}`, headers: { apikey: key, ...auth, "Content-Type": "application/json" } };
};

export const storeName = () => (supabase("events") ? "Supabase" : "local files (data/*.jsonl)");

const file = (table: Table) => `data/${table}.jsonl`;
async function readLocal(table: Table): Promise<Row[]> {
  const text = await readFile(file(table), "utf8").catch(() => "");
  return text
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as Row);
}

async function check(res: Response) {
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

// Inserts one row. Rows get an id (uuid unless given) and created_at, like the database defaults.
export async function insertRow(table: Table, row: Row): Promise<Row> {
  const db = supabase(table);
  if (!db) {
    const full = { id: randomUUID(), created_at: new Date().toISOString(), ...row };
    await mkdir("data", { recursive: true });
    await appendFile(file(table), JSON.stringify(full) + "\n");
    return full;
  }
  const res = await check(
    await fetch(db.url, { method: "POST", headers: { ...db.headers, Prefer: "return=representation" }, body: JSON.stringify(row), signal: AbortSignal.timeout(8000) }),
  );
  return ((await res.json()) as Row[])[0];
}

// Inserts or replaces a row by its primary key column.
export async function upsertRow(table: Table, key: string, row: Row): Promise<void> {
  const db = supabase(table);
  if (!db) {
    const rows = await readLocal(table);
    const i = rows.findIndex((r) => r[key] === row[key]);
    const next = { ...(i >= 0 ? rows[i] : { created_at: new Date().toISOString() }), ...row, updated_at: new Date().toISOString() };
    if (i >= 0) rows[i] = next;
    else rows.push(next);
    await mkdir("data", { recursive: true });
    await writeFile(file(table), rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
    return;
  }
  await check(
    await fetch(`${db.url}?on_conflict=${key}`, {
      method: "POST",
      headers: { ...db.headers, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ ...row, updated_at: new Date().toISOString() }),
      signal: AbortSignal.timeout(8000),
    }),
  );
}

// Newest first. `eq` filters on exact column values (used to fetch one run, one quote, one session).
export async function listRows(table: Table, { eq = {}, limit = 5000 }: { eq?: Record<string, string>; limit?: number } = {}): Promise<Row[]> {
  const db = supabase(table);
  if (!db) {
    return (await readLocal(table))
      .filter((r) => Object.entries(eq).every(([k, v]) => String(r[k]) === v))
      .reverse()
      .slice(0, limit);
  }
  const filters = Object.entries(eq)
    .map(([k, v]) => `&${encodeURIComponent(k)}=eq.${encodeURIComponent(v)}`)
    .join("");
  const res = await check(await fetch(`${db.url}?select=*${filters}&order=created_at.desc&limit=${limit}`, { headers: db.headers, cache: "no-store", signal: AbortSignal.timeout(8000) }));
  return (await res.json()) as Row[];
}

export const getRow = async (table: Table, id: string) => (await listRows(table, { eq: { id }, limit: 1 }))[0];

// ---------- Events (feedback, choices, follow-ups) ----------

export type StoredEvent = AppEvent & { at: string };

export async function saveEvent(e: AppEvent): Promise<void> {
  const { type, sessionId, garment, skill, source, sample, ...data } = e;
  await insertRow("events", {
    type,
    session_id: sessionId,
    garment,
    skill,
    source,
    sample,
    rating: e.type === "feedback" ? e.rating : null,
    would_try: e.type === "feedback" ? e.wouldTry : null,
    data,
  });
}

export async function listEvents(limit = 5000): Promise<StoredEvent[]> {
  const rows = await listRows("events", { limit });
  return rows.map((r) => {
    // Older local rows were stored flat, before the table shape existed.
    if (!("data" in r)) return r as unknown as StoredEvent;
    const data = (r.data ?? {}) as Row;
    const opt = (v: unknown) => (v ?? undefined) as string | undefined;
    return { at: r.created_at, type: r.type, sessionId: r.session_id, garment: opt(r.garment), skill: opt(r.skill), source: opt(r.source), sample: opt(r.sample), ...data } as StoredEvent;
  });
}
