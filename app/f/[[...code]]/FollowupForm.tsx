"use client";
// "Did you make it?" One week after testing. Three questions, no login.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Footer, Icon, PrimaryButton, SectionHeading, ThanksState } from "@/components/ui";

export function FollowupForm({ sessionId, garment, ideas }: { sessionId: string; garment?: string; ideas: string[] }) {
  const router = useRouter();
  const [made, setMade] = useState<boolean>();
  const [idea, setIdea] = useState("");
  const [story, setStory] = useState("");
  const [state, setState] = useState<"form" | "sending" | "sent">("form");
  const [error, setError] = useState("");

  async function send() {
    setState("sending");
    setError("");
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "followup", sessionId, garment, ideas: ideas.length ? ideas : undefined, made, idea: idea || undefined, story: story.trim() || undefined }),
    }).catch(() => undefined);
    if (res?.ok) return setState("sent");
    setError("That didn't send. Please check your connection and try again.");
    setState("form");
  }

  if (state === "sent")
    return (
      <div className="screen-content">
        <SectionHeading eyebrow="ONE WEEK ON" title="Thank you." />
        <ThanksState label="ANSWER RECEIVED" text={made ? "Lovely to hear you made something." : "Thanks for telling us. That helps just as much."} onBack={() => router.push("/")} backLabel="Back to mend." />
      </div>
    );

  return (
    <div className="screen-content">
      <SectionHeading eyebrow="ONE WEEK ON" title="Did you make it?" description="A week ago you tried mend. Three quick questions, then you're done." />
      <span className="comment-label">DID YOU MAKE SOMETHING?</span>
      <div className="feedback-options">
        {([["Yes", true], ["Not yet", false]] as const).map(([label, value]) => (
          <button type="button" key={label} className={made === value ? "chosen" : ""} aria-pressed={made === value} onClick={() => setMade(value)}>
            <span>{label}</span><Icon name={made === value ? "check" : "arrow"} size={18} />
          </button>
        ))}
      </div>
      {made && (
        <>
          <span className="comment-label">WHICH IDEA?</span>
          <div className="tool-list">
            {[...ideas, "Something else"].map((t) => (
              <button type="button" key={t} className={`option-row ${idea === t ? "is-selected" : ""}`} aria-pressed={idea === t} onClick={() => setIdea(t)}>
                <span className="option-copy"><strong>{t}</strong></span>
                <span className="option-selector">{idea === t && <Icon name="check" size={15} />}</span>
              </button>
            ))}
          </div>
        </>
      )}
      <label className="comment-label" htmlFor="story">WHAT HAPPENED? <span>OPTIONAL</span></label>
      <textarea className="comment-box" id="story" rows={4} maxLength={1000} value={story} onChange={(e) => setStory(e.target.value)}
        placeholder={made === false ? "What got in the way?" : "How did it go?"} />
      <p className="field-hint">Anonymous, no login. <Link href="/privacy" className="privacy-link">Privacy</Link></p>
      {error && <p className="inline-note" role="alert">{error}</p>}
      <Footer>
        <PrimaryButton disabled={made === undefined || state === "sending"} onClick={send}>{state === "sending" ? "Sending…" : "Send"}</PrimaryButton>
      </Footer>
    </div>
  );
}
