// Stores a quote request (the ready brief) and tells the team if email is set up.
// Spam guard: a hidden honeypot field and a per-IP rate limit.
import { NextResponse } from "next/server";
import { notifyTeam, QuoteRequest, saveQuote } from "@/lib/quote";
import { isRateLimited } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (isRateLimited(`quote:${ip}`)) return NextResponse.json({ error: "Too many requests. Please try again in a minute." }, { status: 429 });

  const parsed = QuoteRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the email address and try again." }, { status: 400 });
  // Bots fill every field. Pretend it worked and keep nothing.
  if (parsed.data.website) return NextResponse.json({ ok: true });

  try {
    const id = await saveQuote(parsed.data);
    await notifyTeam(id, parsed.data, new URL(req.url).origin);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("quote failed:", (e as Error).message);
    return NextResponse.json({ error: "We couldn't send it just now. Copy the brief instead and try again later." }, { status: 503 });
  }
}
