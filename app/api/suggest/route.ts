// Care label reading. Holds the API key; the browser never sees it.
// The photo is passed straight to the provider: never stored, never logged.
// Ideas have their own route: app/api/ideas/route.ts.
import { NextResponse } from "next/server";
import { LabelRequest } from "@/lib/schema";
import { readCareLabel, InvalidOutputError } from "@/lib/providers";
import { ModelTimeoutError, RateLimitError } from "@/lib/providers/types";
import { isRateLimited } from "@/lib/rateLimit";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (isRateLimited(ip)) return fail("Too many requests. Please try again in a minute.", 429);

  const parsed = LabelRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("That photo could not be read. Please enter the fibres yourself.", 400);

  try {
    return NextResponse.json(await readCareLabel(parsed.data.labelImage));
  } catch (e) {
    if (e instanceof RateLimitError || e instanceof ModelTimeoutError) return fail("The AI is busy right now. Please enter the fibres yourself.", 429);
    if (e instanceof InvalidOutputError) return fail("We couldn't read that label. Try a sharper photo, or enter it yourself.", 502);
    console.error("label failed:", (e as Error).message); // message only, never the request body
    return fail("Something went wrong. Please enter the fibres yourself.", 500);
  }
}
