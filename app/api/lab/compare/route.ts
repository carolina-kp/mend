// Starts one blind comparison. Returns only the run id: which set is mend. stays on the server.
import { NextResponse } from "next/server";
import { runComparison } from "@/lib/compare";
import { isLabUser } from "@/lib/lab";
import { IdeasRequest } from "@/lib/schema";
import { insertRow } from "@/lib/store";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!(await isLabUser())) return NextResponse.json({ error: "Lab passcode required" }, { status: 401 });
  const parsed = IdeasRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the garment details" }, { status: 400 });
  try {
    const row = await insertRow("lab_runs", await runComparison({ ...parsed.data, garmentImage: undefined }));
    return NextResponse.json({ id: row.id });
  } catch (e) {
    console.error("compare failed:", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
