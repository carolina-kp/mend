// Logs tester feedback and "Get this done for me" interest.
// Local dev: appended to data/feedback.jsonl. On Vercel (read-only disk): server log only.
// Emails and notes are NOT stored — we only count interest. FUTURE: real storage.
import { appendFile, mkdir } from "node:fs/promises";
import { NextResponse } from "next/server";
import { z } from "zod";

const Event = z.discriminatedUnion("type", [
  z.object({ type: z.literal("feedback"), answer: z.enum(["Yes", "Maybe", "No"]), comment: z.string().max(1000).optional(), fabric: z.string().optional(), garment: z.string().optional() }),
  z.object({ type: z.literal("service"), idea: z.string().max(200), hasNote: z.boolean() }),
]);

export async function POST(req: Request) {
  const parsed = Event.safeParse(await req.json().catch(() => null));
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
