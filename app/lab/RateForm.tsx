"use client";
// Blind rating view for an outside sewer: Set 1 and Set 2, no hint of which is mend.
import { useState } from "react";
import type { NeutralIdea } from "@/lib/compare";

type Score = { feasibility?: number; creativity?: number; fabric?: number; unsafe: boolean };
const CRITERIA = [
  ["feasibility", "Feasible for this person"],
  ["creativity", "Creative"],
  ["fabric", "Suits the fabric"],
] as const;

export function RateForm({ runId, sets }: { runId: string; sets: [NeutralIdea[], NeutralIdea[]] }) {
  const [scores, setScores] = useState<Score[][]>(sets.map((s) => s.map(() => ({ unsafe: false }))));
  const [comments, setComments] = useState({ set1: "", set2: "" });
  const [rater, setRater] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  const set = (si: number, ii: number, patch: Partial<Score>) => setScores(scores.map((s, a) => s.map((x, b) => (a === si && b === ii ? { ...x, ...patch } : x))));
  const complete = scores.every((s) => s.every((x) => x.feasibility && x.creativity && x.fabric));

  async function save() {
    setState("saving");
    setError("");
    const ratings = scores.flatMap((s, si) => s.map((x, index) => ({ set: si + 1, index, feasibility: x.feasibility, creativity: x.creativity, fabric: x.fabric, unsafe: x.unsafe })));
    const res = await fetch("/api/lab/rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId, rater: rater || undefined, ratings, comments: { set1: comments.set1 || undefined, set2: comments.set2 || undefined } }),
    }).catch(() => undefined);
    if (res?.ok) return setState("saved");
    setError((await res?.json().catch(() => ({})))?.error ?? "Could not save. Check the connection.");
    setState("idle");
  }

  if (state === "saved")
    return (
      <div className="lab-saved" role="status">
        <h2>Thank you, ratings saved.</h2>
        <p><a href="/lab">Back to the lab</a></p>
      </div>
    );

  return (
    <div>
      <div className="lab-sets">
        {sets.map((ideas, si) => (
          <section key={si} className="lab-set" aria-labelledby={`set-${si}`}>
            <h2 id={`set-${si}`}>Set {si + 1}</h2>
            {ideas.map((idea, ii) => (
              <article key={ii} className="lab-idea">
                <h3>{ii + 1}. {idea.title}</h3>
                <p>{idea.description}</p>
                {idea.materials.length > 0 && <p><b>Materials:</b> {idea.materials.join(", ")}</p>}
                <ol>{idea.steps.map((s, k) => <li key={k}>{s}</li>)}</ol>
                {idea.tips.length > 0 && <ul className="lab-tips">{idea.tips.map((t, k) => <li key={k}>{t}</li>)}</ul>}
                <div className="lab-scores">
                  {CRITERIA.map(([key, text]) => (
                    <fieldset key={key}>
                      <legend>{text}</legend>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <label key={n} className={scores[si][ii][key] === n ? "on" : ""}>
                          <input type="radio" name={`${si}-${ii}-${key}`} checked={scores[si][ii][key] === n} onChange={() => set(si, ii, { [key]: n })} />
                          {n}
                        </label>
                      ))}
                    </fieldset>
                  ))}
                  <label className="lab-unsafe"><input type="checkbox" checked={scores[si][ii].unsafe} onChange={(e) => set(si, ii, { unsafe: e.target.checked })} /> Unsafe or damaging for this fabric</label>
                </div>
              </article>
            ))}
            <label className="lab-comment">Comment on Set {si + 1}
              <textarea rows={3} maxLength={1000} value={si === 0 ? comments.set1 : comments.set2} onChange={(e) => setComments({ ...comments, [si === 0 ? "set1" : "set2"]: e.target.value })} />
            </label>
          </section>
        ))}
      </div>
      <div className="lab-submit">
        <label>Your label (for example &quot;Sewer A&quot;, not your full name)
          <input value={rater} maxLength={40} onChange={(e) => setRater(e.target.value)} />
        </label>
        {error && <p className="lab-error" role="alert">{error}</p>}
        <button type="button" className="primary-button" disabled={!complete || state === "saving"} onClick={save}>
          <span>{complete ? (state === "saving" ? "Saving…" : "Save ratings") : "Rate every idea on all three scores"}</span>
        </button>
      </div>
    </div>
  );
}
