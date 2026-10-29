// Stores tester feedback and "make it myself" / "get it made" choices (see lib/store.ts).
// Fails quietly for the user: the app never waits on this or shows an error.
import { NextResponse } from "next/server";
import { AppEvent } from "@/lib/events";
import { isRateLimited } from "@/lib/rateLimit";
import { saveEvent } from "@/lib/store";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (isRateLimited(`feedback:${ip}`)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const parsed = AppEvent.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  try {
    await saveEvent(parsed.data);
  } catch (e) {
    // Keep the event in the server log so nothing is lost if the database is down.
    console.error("store failed:", (e as Error).message, "[event]", JSON.stringify(parsed.data));
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
