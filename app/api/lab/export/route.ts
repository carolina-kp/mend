// CSV of every stored feedback and choice. Lab passcode required.
import { isLabUser, toCsv } from "@/lib/lab";
import { listEvents } from "@/lib/store";

export async function GET() {
  if (!(await isLabUser())) return new Response("Lab passcode required", { status: 401 });
  const csv = toCsv(await listEvents());
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="mend-feedback-${date}.csv"`, "Cache-Control": "no-store" },
  });
}
