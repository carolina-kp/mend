"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/mock/menders", label: "Menders" },
  { href: "/mock/community", label: "Community" },
];

export function MockTabs() {
  const path = usePathname();
  return (
    <nav className="mock-tabs" aria-label="Concept screens">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} aria-current={path.startsWith(t.href) ? "page" : undefined}>{t.label}</Link>
      ))}
    </nav>
  );
}
