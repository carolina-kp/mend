"use client";
// Lab: describe a garment, run mend. and the plain chatbot side by side, then rate blind.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GARMENTS, SKILLS, TOOLS, type GarmentId, type SkillId, type ToolId } from "@/lib/config";
import { FIBRES, type FibreId } from "@/lib/fabricRules";

type Part = { fibre: FibreId; percent: number };

export function CompareForm() {
  const router = useRouter();
  const [garment, setGarment] = useState<GarmentId>("sweater");
  const [parts, setParts] = useState<Part[]>([{ fibre: "wool", percent: 100 }]);
  const [tools, setTools] = useState<ToolId[]>(["hand_sewing", "scissors"]);
  const [skill, setSkill] = useState<SkillId>("beginner");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const total = parts.reduce((s, p) => s + p.percent, 0);

  const setPart = (i: number, patch: Partial<Part>) => setParts(parts.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const toggleTool = (t: ToolId) => setTools(tools.includes(t) ? tools.filter((x) => x !== t) : [...tools.filter((x) => x !== "none"), t]);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/lab/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ garment, parts, tools: tools.length ? tools : ["none"], skill }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.push(`/lab/rate/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form className="lab-form" onSubmit={run}>
      <label>Garment
        <select value={garment} onChange={(e) => setGarment(e.target.value as GarmentId)}>
          {GARMENTS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
        </select>
      </label>
      <fieldset>
        <legend>Fibre mix <span className={total === 100 ? "ok" : "lab-error"}>{total}% of 100%</span></legend>
        {parts.map((p, i) => (
          <div key={i} className="lab-part">
            <select aria-label={`Fibre ${i + 1}`} value={p.fibre} onChange={(e) => setPart(i, { fibre: e.target.value as FibreId })}>
              {FIBRES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            <input aria-label={`Fibre ${i + 1} percent`} type="number" min={1} max={100} value={p.percent} onChange={(e) => setPart(i, { percent: Math.round(Number(e.target.value) || 0) })} />
            {parts.length > 1 && <button type="button" onClick={() => setParts(parts.filter((_, j) => j !== i))} aria-label={`Remove fibre ${i + 1}`}>Remove</button>}
          </div>
        ))}
        {parts.length < 4 && <button type="button" className="nav-reset" onClick={() => setParts([...parts, { fibre: "elastane", percent: 0 }])}>Add a fibre</button>}
      </fieldset>
      <fieldset>
        <legend>Tools</legend>
        <div className="lab-checks">
          {TOOLS.filter((t) => t.id !== "none").map((t) => (
            <label key={t.id}><input type="checkbox" checked={tools.includes(t.id)} onChange={() => toggleTool(t.id)} /> {t.label}</label>
          ))}
        </div>
      </fieldset>
      <label>Skill
        <select value={skill} onChange={(e) => setSkill(e.target.value as SkillId)}>
          {SKILLS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </label>
      {error && <p className="lab-error" role="alert">{error}</p>}
      <button type="submit" className="primary-button" disabled={busy || total !== 100}><span>{busy ? "Asking both… (up to 30 s)" : "Run blind comparison"}</span></button>
    </form>
  );
}
