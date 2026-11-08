// Blind rating page for one comparison. Never reveals which set is mend.
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { LabRun } from "@/lib/compare";
import { isLabUser } from "@/lib/lab";
import { getRow } from "@/lib/store";
import { GARMENTS, SKILLS, TOOLS } from "@/lib/config";
import { fibreLabel } from "@/lib/fabricRules";
import { RateForm } from "../../RateForm";
import { Shell } from "../../Shell";

export const metadata: Metadata = { title: "mend. lab rating", robots: { index: false } };
export const dynamic = "force-dynamic";

const label = (list: readonly { id: string; label: string }[], id: string) => list.find((x) => x.id === id)?.label ?? id;

export default async function RatePage({ params }: PageProps<"/lab/rate/[id]">) {
  if (!(await isLabUser())) redirect("/lab");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const run = (await getRow("lab_runs", id)) as LabRun | undefined;
  if (!run) notFound();
  const { input } = run;
  const tools = input.tools.filter((t) => t !== "none").map((t) => label(TOOLS, t).toLowerCase());

  return (
    <Shell wide>
      <h1>Rate two idea sets.</h1>
      <p>
        <b>{label(GARMENTS, input.garment)}</b>, {input.parts.map((p) => `${p.percent}% ${fibreLabel(p.fibre).toLowerCase()}`).join(", ")}. Tools: {tools.length ? tools.join(", ") : "none"}. Skill: {label(SKILLS, input.skill).toLowerCase()}.
      </p>
      <p>The two sets come from two different sources, in random order. Rate each idea from 1 (poor) to 5 (excellent) for this person, this fabric and these tools, and tick any idea that would damage the fabric or is unsafe.</p>
      <RateForm runId={run.id} sets={[run.set1, run.set2]} />
    </Shell>
  );
}
