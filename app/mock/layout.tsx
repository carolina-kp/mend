// Concept mock-ups of the long-term mender and community side. Static seed data
// (lib/mockMenders.ts), no accounts, no following, no posting. Every screen carries the badge.
import type { Metadata } from "next";
import Link from "next/link";
import { MockTabs } from "./MockTabs";

export const metadata: Metadata = { title: "mend. concept: menders and community", robots: { index: false } };

export default function MockLayout({ children }: LayoutProps<"/mock">) {
  return (
    <main className="standalone mock">
      <div className="app-nav">
        <Link href="/" className="app-logo">mend<span>.</span></Link>
        <span className="mock-badge" role="note">Concept mock-up, not live</span>
      </div>
      <MockTabs />
      <div className="mock-body">{children}</div>
    </main>
  );
}
