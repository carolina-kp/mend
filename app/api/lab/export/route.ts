// CSV exports, lab passcode required.
// /api/lab/export: every feedback, choice and follow-up. ?kind=ratings: one row per blind-rated idea.
import { isLabUser, loadComparisons, ratingsCsv, toCsv } from "@/lib/lab";
import { listEvents } from "@/lib/store";

export async function GET(req: Request) {
  if (!(await isLabUser())) return new Response("Lab passcode required", { status: 401 });
  const ratings = new URL(req.url).searchParams.get("kind") === "ratings";
  const csv = ratings ? ratingsCsv((await loadComparisons()).pairs) : toCsv(await listEvents());
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mend-${ratings ? "blind-ratings" : "feedback"}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
