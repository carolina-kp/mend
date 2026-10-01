// The only server route. Holds the API key; the browser never sees it.
// Images are passed straight to the provider: never stored, never logged.
import { NextResponse } from "next/server";
import { SuggestRequest } from "@/lib/schema";
import { generateSuggestions, readCareLabel, InvalidOutputError } from "@/lib/providers";
import { RateLimitError } from "@/lib/providers/types";
import { isRateLimited } from "@/lib/rateLimit";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (isRateLimited(ip)) return fail("Too many requests. Please try again in a minute.", 429);

  const parsed = SuggestRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Some answers are missing. Please go back and check.", 400);

  try {
    const body = parsed.data;
    const result = body.mode === "label" ? await readCareLabel(body.labelImage) : await generateSuggestions(body);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof RateLimitError) return fail("The AI is busy right now. Please try again in a minute.", 429);
    if (e instanceof InvalidOutputError) return fail("We couldn't come up with good ideas this time. Please try again.", 502);
    console.error("suggest failed:", (e as Error).message); // message only, never the request body
    return fail("Something went wrong. Please try again.", 500);
  }
}
