// Lab mode for the project tests. Pass 1: summary, test log and CSV export.
// The blind A/B comparison with a plain chatbot comes in the second pass.
import type { Metadata } from "next";
import { eventRow, isLabUser, labEnabled, summarise } from "@/lib/lab";
import { listEvents, storeName, type StoredEvent } from "@/lib/store";
import { login, logout } from "./actions";

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
  let error = "";
  try {
    events = await listEvents();
  } catch (e) {
    error = (e as Error).message;
  }
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

      <section className="lab-summary" aria-label="Summary">
        <div><span className="tiny-label">TESTERS (SESSIONS)</span><strong>{s.sessions}</strong></div>
        <div><span className="tiny-label">FEEDBACK</span><strong>{s.feedbackCount}</strong></div>
        <div><span className="tiny-label">AVERAGE RATING</span><strong>{s.averageRating || "-"} <small>/ 5</small></strong><small>AI ideas only: {s.averageRatingAi || "-"}</small></div>
        <div><span className="tiny-label">WOULD TRY ONE</span><strong>{s.wouldTryPct}%</strong></div>
        <div><span className="tiny-label">MAKE IT / GET IT MADE</span><strong>{s.makeCount} / {s.getMadeCount}</strong></div>
      </section>
      <p className="lab-target">Target: at least 25% tried an idea. &quot;Tried&quot; is measured by the one-week follow-up (second pass); until then, &quot;would try one&quot; is the closest signal.</p>

      <div className="lab-actions">
        <a className="secondary-button" href="/api/lab/export" download>Export CSV <span aria-hidden>↓</span></a>
      </div>

      <h2>Test log</h2>
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

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className={`lab ${wide ? "lab-wide" : ""}`}>
      <a href="/" className="app-logo">mend<span>.</span></a>
      <span className="eyebrow lab-eyebrow">LAB / TESTING TOOLS</span>
      {children}
    </main>
  );
}
