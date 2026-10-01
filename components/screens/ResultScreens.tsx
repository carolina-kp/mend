"use client";
// After the steps: loading, the 3 ideas, the mocked tailor service, feedback.
import { useState } from "react";
import { GARMENTS, SKILLS } from "@/lib/config";
import { FABRICS } from "@/lib/fabrics";
import { sendEvent } from "@/lib/api";
import type { Idea } from "@/lib/schema";
import type { Answers } from "../flow";
import { Footer, Icon, PrimaryButton, SecondaryButton, SectionHeading, ThanksState } from "../ui";

const garmentLabel = (a: Answers) => GARMENTS.find((g) => g.id === a.garment)?.label ?? "Jeans";
const fabricLabel = (a: Answers) => (a.fabric ? FABRICS[a.fabric].label : "Cotton");

export function LoadingScreen({ error, onRetry }: { error?: string; onRetry: () => void }) {
  return (
    <div className="screen-content loading-screen">
      <div className="loading-art">
        <div className="loading-orbit orbit-one" />
        <div className="loading-orbit orbit-two" />
        <div className="loading-center"><Icon name="scissors" size={45} /></div>
      </div>
      {error ? (
        <>
          <div className="eyebrow">A SMALL SNAG</div>
          <h1>That didn&apos;t work<span>.</span></h1>
          <p>{error}</p>
          <div className="loading-bottom"><PrimaryButton onClick={onRetry}>Try again</PrimaryButton></div>
        </>
      ) : (
        <>
          <div className="eyebrow">A LITTLE PATIENCE, A LOT OF POSSIBILITY</div>
          <h1>Finding ideas for your fabric<span>…</span></h1>
          <p>Looking at the material, your tools, and what you feel like making.</p>
          <div className="loading-bottom"><span className="loading-line"><i /></span><span>CHECKING WHAT YOUR FABRIC CAN DO</span></div>
        </>
      )}
    </div>
  );
}

export function IdeaCard({ idea, index, open, onToggle, onService }: {
  idea: Idea; index: number; open: boolean; onToggle: () => void; onService: () => void;
}) {
  return (
    <article className="idea-card">
      <div className="idea-topline"><span>IDEA {String(index + 1).padStart(2, "0")}</span><span>REWORK RECIPE</span></div>
      <h3>{idea.name}</h3>
      <div className="idea-meta"><span>DIFFICULTY <b>{idea.difficulty}/5</b></span><span>TIME <b>{idea.time}</b></span></div>
      <div className="idea-materials"><span className="tiny-label">YOU&apos;LL NEED</span><p>{idea.materials.join(" · ")}</p></div>
      <button className="steps-toggle" type="button" onClick={onToggle} aria-expanded={open}>
        <span>{open ? "Hide" : "See"} the steps</span>
        <span className={open ? "rotate" : ""}><Icon name="chevron" size={17} /></span>
      </button>
      {open && <ol className="steps-list">{idea.steps.map((s) => <li key={s}>{s}</li>)}</ol>}
      <div className="fabric-why"><span className="tiny-label">WHY THIS WORKS FOR YOUR FABRIC</span><p>{idea.why}</p></div>
      <button className="service-link" type="button" onClick={onService}>Get this done for me <Icon name="arrow" size={17} /></button>
    </article>
  );
}

export function ResultsScreen({ a, ideas, sample, onService, onFeedback }: {
  a: Answers; ideas: Idea[]; sample: boolean; onService: (idea: string) => void; onFeedback: () => void;
}) {
  const [open, setOpen] = useState<number | null>(0);
  const skill = SKILLS.find((s) => s.id === a.skill)?.label ?? "Beginner";
  return (
    <div className="screen-content results-screen">
      <SectionHeading eyebrow="MADE FOR YOUR MATERIAL" title="A second life, three ways." description={`Ideas for your ${garmentLabel(a).toLowerCase()}, led by the fabric.`} />
      {sample && <p className="sample-note">SAMPLE IDEAS — GO THROUGH THE STEPS TO GET YOUR OWN</p>}
      <div className="results-summary">
        <span className="summary-stitch">FABRIC / 001</span>
        <strong>{fabricLabel(a)} first.</strong>
        <span>{garmentLabel(a)} <span className="summary-separator">/</span> {skill}</span>
      </div>
      <div className="results-count"><span>YOUR THREE IDEAS</span><span>01 — 03</span></div>
      <div className="idea-list">
        {ideas.map((idea, i) => (
          <IdeaCard key={idea.name} idea={idea} index={i} open={open === i} onToggle={() => setOpen(open === i ? null : i)} onService={() => onService(idea.name)} />
        ))}
      </div>
      <div className="results-end">
        <p>Start with the easiest one. The rest can wait.</p>
        <SecondaryButton onClick={onFeedback}>Would you try this? <Icon name="arrow" size={17} /></SecondaryButton>
      </div>
    </div>
  );
}

// Mocked paid service: measures interest only. Email and note are NOT sent or stored.
export function ServiceScreen({ a, idea, onBack }: { a: Answers; idea: string; onBack: () => void }) {
  const [sent, setSent] = useState(false);
  return (
    <div className="screen-content">
      <SectionHeading
        eyebrow="LET'S MAKE IT HAPPEN"
        title={sent ? "Thank you. We'll be in touch." : "Want a hand with this?"}
        description={sent ? "Your note is in our sewing basket. Keep an eye on your inbox." : "Tell us a little about your piece and we'll follow up."}
      />
      {sent ? (
        <ThanksState label="REQUEST RECEIVED" text="Small steps make a big difference. Thanks for keeping your clothes in use." onBack={onBack} />
      ) : (
        <>
          <div className="selected-project">
            <span className="tiny-label">THE IDEA YOU CHOSE</span>
            <strong>{idea}</strong>
            <span>{garmentLabel(a)} · {fabricLabel(a)}</span>
          </div>
          <form
            className="service-form"
            onSubmit={(e) => {
              e.preventDefault();
              const note = new FormData(e.currentTarget).get("note");
              sendEvent({ type: "service", idea, hasNote: !!note }); // FUTURE: real tailor booking
              setSent(true);
            }}
          >
            <label htmlFor="email">YOUR EMAIL</label>
            <input id="email" name="email" type="email" required placeholder="you@example.com" />
            <label htmlFor="note">A SHORT NOTE <span>OPTIONAL</span></label>
            <textarea id="note" name="note" rows={5} placeholder="Anything we should know about your piece?" />
            <p>No pressure, no spam. Just a conversation about your rework.</p>
            <PrimaryButton type="submit">Send my request</PrimaryButton>
          </form>
        </>
      )}
    </div>
  );
}

export function FeedbackScreen({ a, onBack }: { a: Answers; onBack: () => void }) {
  const [answer, setAnswer] = useState<"Yes" | "Maybe" | "No">();
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="screen-content">
      <SectionHeading
        eyebrow="ONE LAST THING"
        title={sent ? "Thanks for sharing." : "Would you try this?"}
        description={sent ? "Your thoughts help us make better ideas for better use of what we own." : "Your honest answer helps us make more useful ideas."}
      />
      {sent ? (
        <ThanksState label="FEEDBACK RECEIVED" text="Here's to making more with less." onBack={onBack} />
      ) : (
        <>
          <div className="feedback-options">
            {(["Yes", "Maybe", "No"] as const).map((x) => (
              <button type="button" key={x} className={answer === x ? "chosen" : ""} onClick={() => setAnswer(x)}>
                <span>{x}</span><Icon name={answer === x ? "check" : "arrow"} size={18} />
              </button>
            ))}
          </div>
          <label className="comment-label" htmlFor="comment">ANYTHING ELSE? <span>OPTIONAL</span></label>
          <textarea className="comment-box" id="comment" rows={4} placeholder="Tell us what you'd change…" value={comment} onChange={(e) => setComment(e.target.value)} />
          <Footer>
            <PrimaryButton
              disabled={!answer}
              onClick={() => {
                sendEvent({ type: "feedback", answer, comment: comment || undefined, fabric: a.fabric, garment: a.garment });
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
