// Ideas: rule engine, then Gemini, then the rule-based fallback.
// Holds the API key; the browser never sees it. Photos are never stored or logged.
// Any valid request gets three ideas back with status 200, even if the AI is down.
import { NextResponse } from "next/server";
import { BUSY_NOTE, getIdeas } from "@/lib/ideas";
import { isRateLimited } from "@/lib/rateLimit";
import { IdeasRequest } from "@/lib/schema";

export const maxDuration = 30;

export async function POST(req: Request) {
  const parsed = IdeasRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Some answers are missing. Please go back and check." }, { status: 400 });

  // Over the per-person limit: answer from the rule bank instead of refusing.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const result = await getIdeas(parsed.data, { allowAi: !isRateLimited(ip) });
  return NextResponse.json(result.source === "fallback" ? { ...result, note: BUSY_NOTE } : result);
}
