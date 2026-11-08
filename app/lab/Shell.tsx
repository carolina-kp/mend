// Page frame shared by the lab pages.
import Link from "next/link";
export function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className={`lab ${wide ? "lab-wide" : ""}`}>
      <Link href="/" className="app-logo">mend<span>.</span></Link>
      <span className="eyebrow lab-eyebrow">LAB / TESTING TOOLS</span>
      {children}
    </main>
  );
}
