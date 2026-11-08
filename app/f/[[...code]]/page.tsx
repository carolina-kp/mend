// The one-week follow-up, at a short link: /f/<first 8 characters of the tester's session id>.
// Plain /f works too, for testers whose code got lost.
import type { Metadata } from "next";
import Link from "next/link";
import { listRows, toEvent } from "@/lib/store";
import { FollowupForm } from "./FollowupForm";

export const metadata: Metadata = { title: "mend. Did you make it?", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function FollowupPage({ params }: PageProps<"/f/[[...code]]">) {
  const code = ((await params).code?.[0] ?? "").toLowerCase();
  let sessionId = "followup-no-code";
  let garment: string | undefined;
  let ideas: string[] = [];

  if (/^[0-9a-f]{8}$/.test(code)) {
    sessionId = `followup-${code}`;
    // Find the session the code came from, to offer the ideas that person saw. Fails quietly.
    const events = (await listRows("events", { prefix: ["session_id", code], limit: 20 }).catch(() => [])).map(toEvent);
    const seen = events.find((e) => e.ideas?.length);
    if (events.length) sessionId = events[0].sessionId;
    garment = seen?.garment ?? events[0]?.garment;
    ideas = seen?.ideas ?? [];
  }

  return (
    <main className="standalone">
      <div className="app-nav standalone-nav"><Link href="/" className="app-logo">mend<span>.</span></Link></div>
      <FollowupForm sessionId={sessionId} garment={garment} ideas={ideas} />
    </main>
  );
}
