// Lab mode for the project tests: blind A/B against a plain chatbot (H1), tester
// feedback (H2, H3), the test log and CSV exports.
import type { Metadata } from "next";
import { winner } from "@/lib/compare";
import { eventRow, isLabUser, labEnabled, loadComparisons, loadQuotes, summarise, type QuoteRow } from "@/lib/lab";
import { listEvents, storeName, type StoredEvent } from "@/lib/store";
import { login, logout } from "./actions";
import { CompareForm } from "./CompareForm";
import { Shell } from "./Shell";

export const metadata: Metadata = { title: "mend. lab", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LabPage({ searchParams }: PageProps<"/lab">) {
  if (!labEnabled())
    return (
      <Shell>
        <h1>Lab is switched off.</h1>
        <p>Set <code>LAB_PASSCODE</code> in the environment variables to use it.</p>
      </Shell>
    );

  if (!(await isLabUser())) {
    const wrong = (await searchParams).wrong;
    return (
      <Shell>
        <h1>Lab mode.</h1>
        <p>For Carolina and Poppy: test results and the feedback export.</p>
        <form action={login} className="lab-login">
          <label htmlFor="passcode">PASSCODE</label>
          <input id="passcode" name="passcode" type="password" autoComplete="current-password" required />
          {wrong && <p className="lab-error" role="alert">That passcode is not right.</p>}
          <button type="submit" className="primary-button"><span>Open the lab</span></button>
        </form>
      </Shell>
    );
  }

  let events: StoredEvent[] = [];
  let comparisons: Awaited<ReturnType<typeof loadComparisons>> | undefined;
  let quotes: QuoteRow[] = [];
  let error = "";
  try {
    [events, comparisons, quotes] = await Promise.all([listEvents(), loadComparisons(), loadQuotes()]);
  } catch (e) {
    error = (e as Error).message;
  }
  const m = comparisons?.mend;
  const c = comparisons?.chatbot;
  const gap = m?.feasiblePct != null && c?.feasiblePct != null ? m.feasiblePct - c.feasiblePct : null;
  const s = summarise(events);
  const rows = events.slice(0, 200).map(eventRow);

  return (
    <Shell wide>
      <div className="lab-top">
        <h1>Lab mode.</h1>
        <form action={logout}><button type="submit" className="nav-reset">Log out</button></form>
      </div>
      <p>Stored in: {storeName()}. {events.length} events.</p>
      {error && <p className="lab-error" role="alert">Could not read the store: {error}</p>}

      <h2>H1: blind comparison with a plain chatbot</h2>
      <p>Each run asks mend. and the same Gemini model with a plain prompt (&quot;Suggest three upcycling ideas for this garment&quot;, no fabric rules). The rating page shows them as Set 1 and Set 2 in random order. Hand the rating page to the sewer; this page shows the true mapping.</p>
      <section className="lab-summary" aria-label="Comparison summary">
        <div><span className="tiny-label">RUNS / RATED</span><strong>{comparisons?.all.length ?? 0} / {comparisons?.all.filter((x) => x.ratings.length).length ?? 0}</strong></div>
        <div><span className="tiny-label">RATED FEASIBLE (4 OR 5)</span><strong>{m?.feasiblePct ?? "-"}% <small>mend.</small></strong><small>Chatbot: {c?.feasiblePct ?? "-"}%</small></div>
        <div><span className="tiny-label">GAP</span><strong>{gap == null ? "-" : `${gap > 0 ? "+" : ""}${gap} pts`}</strong><small>{gap == null ? "No ratings yet" : gap >= 20 ? "H1 target met" : "Below the 20 point target"}</small></div>
        <div><span className="tiny-label">AVERAGE SCORE</span><strong>{m?.overall ?? "-"} <small>mend.</small></strong><small>Chatbot: {c?.overall ?? "-"}</small></div>
        <div><span className="tiny-label">MARKED UNSAFE</span><strong>{m?.unsafe ?? 0} <small>mend.</small></strong><small>Chatbot: {c?.unsafe ?? 0}</small></div>
      </section>
      <p className="lab-target">Target (H1): mend. ideas rated feasible at least 20 percentage points more often than the chatbot&apos;s.</p>

      <h3 className="lab-h3">New comparison</h3>
      <CompareForm />

      {comparisons && comparisons.all.length > 0 && (
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead><tr><th>When</th><th>Garment</th><th>Fabric</th><th>Tools</th><th>Skill</th><th>mend. is</th><th>Ratings</th><th>Winner</th><th></th></tr></thead>
            <tbody>
              {comparisons.all.map(({ run, ratings }) => (
                <tr key={run.id}>
                  <td>{run.created_at.slice(0, 16).replace("T", " ")}</td><td>{run.garment}</td>
                  <td>{run.input.parts.map((p) => `${p.percent}% ${p.fibre}`).join(", ")}</td><td>{run.input.tools.join(", ")}</td><td>{run.skill}</td>
                  <td>Set {run.mend_set}{run.mend_source === "fallback" && " (standard set)"}</td><td>{ratings.length}</td>
                  <td>{ratings.map((r) => winner(run, r)).join(", ") || "-"}</td>
                  <td><a href={`/lab/rate/${run.id}`}>Rate</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="lab-actions">
        <a className="secondary-button" href="/api/lab/export?kind=ratings" download>Export blind ratings CSV <span aria-hidden>↓</span></a>
      </div>

      <h2>H3: get it made</h2>
      <section className="lab-summary" aria-label="Get it made summary">
        <div><span className="tiny-label">TAPPED GET IT MADE</span><strong>{s.getMadePct}%</strong><small>Target: at least 15% of testers</small></div>
        <div><span className="tiny-label">LEFT AN EMAIL</span><strong>{s.contactPct}%</strong><small>Target: at least 5% of testers</small></div>
        <div><span className="tiny-label">QUOTE REQUESTS</span><strong>{quotes.length}</strong></div>
      </section>
      {quotes.length > 0 && (
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead><tr><th>When</th><th>Garment</th><th>Fabric</th><th>Idea</th><th>Budget</th><th>Wanted by</th><th>Email</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td>{q.created_at.slice(0, 16).replace("T", " ")}</td><td>{q.garment}</td><td>{q.parts.map((p) => `${p.percent}% ${p.fibre}`).join(", ")}</td>
                  <td>{q.idea.title} ({q.idea.difficulty}/5)</td><td>{q.budget != null ? `${q.budget} kr` : ""}</td><td>{q.desired_date ?? ""}</td>
                  <td>{q.email ? <a href={`mailto:${q.email}`}>{q.email}</a> : ""}</td><td>{q.notes ?? ""}</td><td><a href={`/brief/${q.id}`}>Brief</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>Tester feedback</h2>
      <section className="lab-summary" aria-label="Summary">
        <div><span className="tiny-label">TESTERS (SESSIONS)</span><strong>{s.sessions}</strong></div>
        <div><span className="tiny-label">FEEDBACK</span><strong>{s.feedbackCount}</strong></div>
        <div><span className="tiny-label">AVERAGE RATING</span><strong>{s.averageRating || "-"} <small>/ 5</small></strong><small>AI ideas only: {s.averageRatingAi || "-"}</small></div>
        <div><span className="tiny-label">WOULD TRY ONE</span><strong>{s.wouldTryPct}%</strong></div>
        <div><span className="tiny-label">MAKE IT / GET IT MADE</span><strong>{s.makeCount} / {s.getMadeCount}</strong></div>
      </section>
      <p className="lab-target">Target: at least 25% tried an idea. &quot;Tried&quot; is measured by the one-week follow-up (second pass); until then, &quot;would try one&quot; is the closest signal.</p>

      <div className="lab-actions">
        <a className="secondary-button" href="/api/lab/export" download>Export feedback CSV <span aria-hidden>↓</span></a>
      </div>
      <h3 className="lab-h3">Test log</h3>
      <div className="lab-table-wrap">
        <table className="lab-table">
          <thead>
            <tr><th>When</th><th>Type</th><th>Garment</th><th>Fabric</th><th>Tools</th><th>Skill</th><th>Source</th><th>Rating</th><th>Would try</th><th>Choice</th><th>Comment</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.at.slice(0, 16).replace("T", " ")}</td><td>{r.type}</td><td>{r.garment}{r.sample && " (sample)"}</td><td>{r.fabric}</td><td>{r.tools}</td><td>{r.skill}</td><td>{r.source}</td>
                <td>{r.rating}</td><td>{r.would_try}</td><td>{r.choice && `${r.choice.replace(/_/g, " ")}: ${r.idea}`}</td><td>{r.comment}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={11}>No feedback yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
