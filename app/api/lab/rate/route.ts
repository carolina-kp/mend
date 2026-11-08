// Saves one outside sewer's blind ratings for a comparison.
import { NextResponse } from "next/server";
import { RatingRequest } from "@/lib/compare";
import { isLabUser } from "@/lib/lab";
import { getRow, insertRow } from "@/lib/store";

export async function POST(req: Request) {
  if (!(await isLabUser())) return NextResponse.json({ error: "Lab passcode required" }, { status: 401 });
  const parsed = RatingRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please rate every idea on all three scores." }, { status: 400 });
  const { runId, rater, ratings, comments } = parsed.data;
  if (!(await getRow("lab_runs", runId))) return NextResponse.json({ error: "That comparison no longer exists." }, { status: 404 });
  try {
    await insertRow("lab_ratings", { run_id: runId, rater: rater || null, ratings, comments });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("rating failed:", (e as Error).message);
    return NextResponse.json({ error: "Could not save. Please try again." }, { status: 502 });
  }
}
