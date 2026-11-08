// Shareable ready brief for a mender. The link is an unguessable id; there is no photo and no contact detail on it.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GARMENTS } from "@/lib/config";
import { fibreLabel, type FibrePart } from "@/lib/fabricRules";
import { getRow } from "@/lib/store";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "mend. ready brief", robots: { index: false } };
export const dynamic = "force-dynamic";

type Quote = {
  id: string;
  created_at: string;
  garment: string;
  parts: FibrePart[];
  idea: { title: string; steps: string[]; difficulty: number; timeMinutes: number; menderBrief: string };
  notes?: string | null;
  budget?: number | null;
  desired_date?: string | null;
};

const minutes = (m: number) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} h`);

export default async function BriefPage({ params }: PageProps<"/brief/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const q = (await getRow("quotes", id).catch(() => undefined)) as Quote | undefined;
  if (!q) notFound();

  return (
    <main className="lab brief-page">
      <Link href="/" className="app-logo">mend<span>.</span></Link>
      <span className="eyebrow lab-eyebrow">READY BRIEF / {q.created_at.slice(0, 10)}</span>
      <h1>{q.idea.title}</h1>
      <div className="brief-card">
        <dl>
          <dt>Garment</dt><dd>{GARMENTS.find((g) => g.id === q.garment)?.label ?? q.garment}</dd>
          <dt>Fabric</dt><dd>{q.parts.map((p) => `${p.percent}% ${fibreLabel(p.fibre).toLowerCase()}`).join(", ")}</dd>
          <dt>Difficulty</dt><dd>{q.idea.difficulty}/5</dd>
          <dt>Time</dt><dd>About {minutes(q.idea.timeMinutes)}</dd>
          {q.budget != null && (<><dt>Budget</dt><dd>{q.budget} kr</dd></>)}
          {q.desired_date && (<><dt>Wanted by</dt><dd>{q.desired_date}</dd></>)}
        </dl>
        <span className="tiny-label">STEPS</span>
        <ol className="steps-list">{q.idea.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        <span className="tiny-label">FOR THE MENDER</span>
        <p>{q.idea.menderBrief}</p>
        {q.notes && (<><span className="tiny-label">NOTES FROM THE OWNER</span><p>{q.notes}</p></>)}
      </div>
      <p>A mender will reply with a quote. For this demo we match jobs by hand.</p>
      <PrintButton />
    </main>
  );
}
