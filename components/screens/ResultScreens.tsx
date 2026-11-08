"use client";
// After the steps: loading, the three ideas, one idea in detail, make it myself,
// get it made (the ready brief), and feedback.
import { useEffect, useState } from "react";
import { GARMENTS, SKILLS } from "@/lib/config";
import { fibreLabel } from "@/lib/fabricRules";
import { demoQuote } from "@/lib/mockMenders";
import type { Idea, IdeasResponse } from "@/lib/schema";
import { ambition, formatMinutes, type Answers } from "../flow";
import { Footer, Icon, PrimaryButton, SecondaryButton, SectionHeading, ThanksState } from "../ui";

const garmentLabel = (a: Answers) => GARMENTS.find((g) => g.id === a.garment)?.label ?? "Garment";
const mixLabel = (a: Answers) =>
  a.parts
    .filter((p) => p.percent > 0)
    .map((p) => `${p.percent}% ${fibreLabel(p.fibre).toLowerCase()}`)
    .join(", ");
const ideaNumber = (i: number) => String(i + 1).padStart(2, "0");

const MESSAGES = ["Reading your fibre mix", "Checking what your fabric can take", "Matching ideas to your tools", "Picking one quick, one medium, one stretch"];

export function LoadingScreen() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, MESSAGES.length - 1)), 1600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="screen-content loading-screen">
      <div className="loading-art">
        <div className="loading-orbit orbit-one" />
        <div className="loading-orbit orbit-two" />
        <div className="loading-center"><Icon name="scissors" size={45} /></div>
      </div>
      <div className="eyebrow">A LITTLE PATIENCE, A LOT OF POSSIBILITY</div>
      <h1>Finding ideas for your fabric<span>…</span></h1>
      <p>Fabric rules first, then ideas that fit your tools and skill.</p>
      <div className="loading-bottom" role="status" aria-live="polite">
        <span className="loading-line"><i /></span>
        <span>{MESSAGES[step].toUpperCase()}</span>
      </div>
    </div>
  );
}

export function IdeaCard({ idea, index, onOpen }: { idea: Idea; index: number; onOpen: () => void }) {
  return (
    <article className="idea-card">
      <div className="idea-topline"><span>IDEA {ideaNumber(index)}</span><span>{ambition(index)}</span></div>
      <h3>{idea.title}</h3>
      <p className="idea-summary">{idea.summary}</p>
      <div className="idea-meta"><span>DIFFICULTY <b>{idea.difficulty}/5</b></span><span>TIME <b>{formatMinutes(idea.timeMinutes)}</b></span></div>
      <div className="fabric-why"><span className="tiny-label">WHY IT SUITS YOUR FABRIC</span><p>{idea.fabricReason}</p></div>
      <button className="service-link" type="button" onClick={onOpen}>See this idea <Icon name="arrow" size={17} /></button>
    </article>
  );
}

export function ResultsScreen({ a, result, onOpen, onFeedback }: {
  a: Answers; result: IdeasResponse; onOpen: (i: number) => void; onFeedback: () => void;
}) {
  const skill = SKILLS.find((s) => s.id === a.skill)?.label ?? "Beginner";
  return (
    <div className="screen-content results-screen">
      <SectionHeading eyebrow="MADE FOR YOUR MATERIAL" title="A second life, three ways." description={`Ideas for your ${garmentLabel(a).toLowerCase()}, led by the fabric.`} />
      {result.note && <p className="sample-note" role="status">{result.note}</p>}
      <div className="results-summary">
        <span className="summary-stitch">FABRIC / 001</span>
        <strong>{mixLabel(a)}</strong>
        <span>{garmentLabel(a)} <span className="summary-separator">/</span> {skill}</span>
      </div>
      <div className="results-count"><span>YOUR THREE IDEAS</span><span>QUICK, MEDIUM, STRETCH</span></div>
      <div className="idea-list">
        {result.ideas.map((idea, i) => <IdeaCard key={idea.id} idea={idea} index={i} onOpen={() => onOpen(i)} />)}
      </div>
      <div className="results-end">
        <p>Start with the easiest one. The rest can wait.</p>
        <SecondaryButton onClick={onFeedback}>Rate these ideas <Icon name="arrow" size={17} /></SecondaryButton>
      </div>
    </div>
  );
}

export function DetailScreen({ idea, index, onMake, onMade }: { idea: Idea; index: number; onMake: () => void; onMade: () => void }) {
  return (
    <div className="screen-content detail-screen">
      <SectionHeading eyebrow={`IDEA ${ideaNumber(index)}  ·  ${ambition(index)}`} title={idea.title} description={idea.summary} />
      <div className="idea-meta detail-meta"><span>DIFFICULTY <b>{idea.difficulty}/5</b></span><span>TIME <b>{formatMinutes(idea.timeMinutes)}</b></span></div>

      <div className="detail-block why-block">
        <span className="tiny-label">WHY THIS WORKS FOR YOUR FABRIC</span>
        <p>{idea.fabricReason}</p>
      </div>
      {idea.warnings.length > 0 && (
        <div className="detail-block warning-block">
          <span className="tiny-label"><span aria-hidden>!</span> WATCH OUT</span>
          <ul>{idea.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}
      <div className="detail-block">
        <span className="tiny-label">YOU&apos;LL NEED</span>
        <p>{[...idea.tools, ...idea.materials].join(" · ") || "Nothing but your hands"}</p>
      </div>
      <div className="detail-block">
        <span className="tiny-label">STEP BY STEP</span>
        <ol className="steps-list">{idea.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      </div>
      <p className="scrap-note"><span className="privacy-symbol">i</span>Try on a hidden area or a scrap first.</p>

      <Footer>
        <PrimaryButton onClick={onMake}>Make it myself</PrimaryButton>
        <div className="footer-gap" />
        <SecondaryButton onClick={onMade}>Get it made <Icon name="arrow" size={17} /></SecondaryButton>
      </Footer>
    </div>
  );
}

export function MakeScreen({ idea, onFeedback }: { idea: Idea; onFeedback: () => void }) {
  const [done, setDone] = useState<number[]>([]);
  const toggle = (i: number) => setDone((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));
  return (
    <div className="screen-content">
      <SectionHeading eyebrow="MAKE IT MYSELF" title="Your plan." description={`${idea.title}, about ${formatMinutes(idea.timeMinutes)}. Tick the steps off as you go.`} />
      <div className="checklist">
        {idea.steps.map((s, i) => (
          <label key={s} className={done.includes(i) ? "is-done" : ""}>
            <input type="checkbox" checked={done.includes(i)} onChange={() => toggle(i)} />
            <span className="check-box" aria-hidden>{done.includes(i) && <Icon name="check" size={14} />}</span>
            <span><b>{ideaNumber(i)}</b> {s}</span>
          </label>
        ))}
      </div>
      <p className="scrap-note"><span className="privacy-symbol">i</span>Try on a hidden area or a scrap first.</p>
      <Footer note={`${done.length} of ${idea.steps.length} steps done`}>
        <PrimaryButton onClick={onFeedback}>How good were these ideas?</PrimaryButton>
      </Footer>
    </div>
  );
}

export function briefText(a: Answers, idea: Idea, notes: string, budget: string, date = "") {
  return [
    "mend. ready brief",
    `Garment: ${garmentLabel(a)}`,
    `Fabric: ${mixLabel(a)}`,
    `Idea: ${idea.title}`,
    `Difficulty: ${idea.difficulty}/5, about ${formatMinutes(idea.timeMinutes)}`,
    "Steps:",
    ...idea.steps.map((s, i) => `${i + 1}. ${s}`),
    `For the mender: ${idea.menderBrief}`,
    ...(notes ? [`Notes: ${notes}`] : []),
    ...(budget ? [`Budget: ${budget} kr`] : []),
    ...(date ? [`Wanted by: ${date}`] : []),
  ].join("\n");
}

export type QuoteDetails = { notes?: string; budget?: number; desiredDate?: string; email?: string; website?: string };

export function DemoQuoteCard({ difficulty }: { difficulty: number }) {
  const q = demoQuote(difficulty);
  return (
    <div className="demo-quote">
      <span className="tiny-label">EXAMPLE QUOTE (DEMO)</span>
      <div className="demo-quote-head">
        <span className="avatar" aria-hidden>{q.mender.initials}</span>
        <span><strong>{q.mender.name}, {q.mender.age}</strong><small>{q.mender.bio.split(".")[0]}.</small></span>
      </div>
      <p className="demo-quote-price">{q.range[0]} to {q.range[1]} kr <small>· ready in {q.days}</small></p>
      <p className="demo-quote-note">A made-up quote so you can see the whole loop. Prices are placeholders, not real offers.</p>
    </div>
  );
}

export function MadeScreen({ a, idea, onRequest, onFeedback }: {
  a: Answers; idea: Idea; onRequest: (details: QuoteDetails) => Promise<{ id?: string; error?: string }>; onFeedback: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [budget, setBudget] = useState("");
  const [date, setDate] = useState("");
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState<"form" | "sending" | "sent">("form");
  const [briefId, setBriefId] = useState<string>();
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  async function copy() {
    try {
      await navigator.clipboard.writeText(briefText(a, idea, notes, budget, date));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (state === "sent")
    return (
      <div className="screen-content">
        <SectionHeading eyebrow="GET IT MADE" title="Request sent." description="A mender will reply with a quote. For this demo we match jobs by hand." />
        {briefId && <a className="secondary-button brief-link" href={`/brief/${briefId}`} target="_blank" rel="noopener">Open your brief <Icon name="arrow" size={17} /></a>}
        <DemoQuoteCard difficulty={idea.difficulty} />
        <Footer><PrimaryButton onClick={onFeedback}>Rate these ideas</PrimaryButton></Footer>
      </div>
    );

  return (
    <div className="screen-content">
      <SectionHeading eyebrow="GET IT MADE" title="Your ready brief." description="Everything a mender needs to quote, without photos." />
      <div className="brief-card">
        <span className="tiny-label">BRIEF / {idea.id.toUpperCase()}</span>
        <strong>{idea.title}</strong>
        <dl>
          <dt>Garment</dt><dd>{garmentLabel(a)}</dd>
          <dt>Fabric</dt><dd>{mixLabel(a)}</dd>
          <dt>Difficulty</dt><dd>{idea.difficulty}/5</dd>
          <dt>Time</dt><dd>About {formatMinutes(idea.timeMinutes)}</dd>
        </dl>
        <ol className="steps-list">{idea.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        <p>{idea.menderBrief}</p>
      </div>
      <form
        className="service-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setState("sending");
          setError("");
          const website = String(new FormData(e.currentTarget).get("website") ?? "");
          const r = await onRequest({
            notes: notes.trim() || undefined,
            budget: budget ? Math.round(Number(budget)) : undefined,
            desiredDate: date || undefined,
            email: email.trim() || undefined,
            website: website || undefined,
          });
          if (r.error) {
            setError(r.error);
            setState("form");
          } else {
            setBriefId(r.id);
            setState("sent");
          }
        }}
      >
        <label htmlFor="notes">NOTES FOR THE MENDER <span>OPTIONAL</span></label>
        <textarea id="notes" rows={3} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Size, colour of thread, anything special" />
        <label htmlFor="budget">BUDGET IN KR <span>OPTIONAL</span></label>
        <input id="budget" type="number" inputMode="numeric" min={0} max={10000} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 200" />
        <label htmlFor="date">WANTED BY <span>OPTIONAL</span></label>
        <input id="date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
        <label htmlFor="email">EMAIL FOR THE QUOTE <span>OPTIONAL</span></label>
        <input id="email" type="email" autoComplete="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-describedby="email-note" />
        <p id="email-note" className="field-note">Only used to reply with a quote. Kept apart from your brief.</p>
        {/* Honeypot for bots: hidden from people and screen readers. */}
        <div className="honeypot" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <SecondaryButton onClick={copy}>{copied ? "Copied" : "Copy brief as text"} <Icon name={copied ? "check" : "label"} size={17} /></SecondaryButton>
        <p>In this prototype menders are matched by hand. Your brief is saved without photos.</p>
        {error && <p className="inline-note" role="alert">{error}</p>}
        <PrimaryButton type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Request a quote"}</PrimaryButton>
      </form>
    </div>
  );
}

export function FeedbackScreen({ onSend, onRestart }: {
  onSend: (f: { rating: number; wouldTry: boolean; comment?: string }) => void; onRestart: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [wouldTry, setWouldTry] = useState<boolean>();
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="screen-content">
      <SectionHeading
        eyebrow="ONE LAST THING"
        title={sent ? "Thanks for sharing." : "How good were these ideas?"}
        description={sent ? "Your answers help us make the ideas more useful." : "Your honest answer helps us test mend."}
      />
      {sent ? (
        <ThanksState label="FEEDBACK RECEIVED" text="Here's to making more with what you have." onBack={onRestart} backLabel="Start again" />
      ) : (
        <>
          <fieldset className="stars">
            <legend className="comment-label">YOUR RATING</legend>
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} aria-label={`${n} of 5 stars`} aria-pressed={rating === n} className={n <= rating ? "on" : ""} onClick={() => setRating(n)}>
                {n <= rating ? "★" : "☆"}
              </button>
            ))}
            <span className="stars-value">{rating ? `${rating} / 5` : "Tap a star"}</span>
          </fieldset>
          <span className="comment-label">WOULD YOU TRY ONE?</span>
          <div className="feedback-options">
            {([["Yes", true], ["No", false]] as const).map(([label, value]) => (
              <button type="button" key={label} className={wouldTry === value ? "chosen" : ""} aria-pressed={wouldTry === value} onClick={() => setWouldTry(value)}>
                <span>{label}</span><Icon name={wouldTry === value ? "check" : "arrow"} size={18} />
              </button>
            ))}
          </div>
          <label className="comment-label" htmlFor="comment">ANYTHING ELSE? <span>OPTIONAL</span></label>
          <textarea className="comment-box" id="comment" rows={3} maxLength={1000} placeholder="Tell us what you'd change" value={comment} onChange={(e) => setComment(e.target.value)} />
          <Footer>
            <PrimaryButton
              disabled={!rating || wouldTry === undefined}
              onClick={() => {
                onSend({ rating, wouldTry: wouldTry!, comment: comment.trim() || undefined });
                setSent(true);
              }}
            >
              Send feedback
            </PrimaryButton>
          </Footer>
        </>
      )}
    </div>
  );
}
