// Stores tester feedback and "make it myself" / "get it made" choices.
// Local dev: appended to data/feedback.jsonl. On Vercel (read-only disk): server log only.
import { appendFile, mkdir } from "node:fs/promises";
import { NextResponse } from "next/server";
import { AppEvent } from "@/lib/events";

export async function POST(req: Request) {
  const parsed = AppEvent.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const line = JSON.stringify({ at: new Date().toISOString(), ...parsed.data });
  console.log("[event]", line);
  try {
    await mkdir("data", { recursive: true });
    await appendFile("data/feedback.jsonl", line + "\n");
  } catch {
    // read-only filesystem (e.g. Vercel): the console log above is enough
  }
  return NextResponse.json({ ok: true });
}
