"use client";
// Steps 1, 2, 4, 5: garment, photo, tools, skill.
import { useRef, useState } from "react";
import { GARMENTS, SKILLS, TOOLS, type ToolId } from "@/lib/config";
import { SAMPLE_GARMENTS, type SampleGarment } from "@/lib/sampleGarments";
import { resizeImage } from "@/lib/resizeImage";
import type { Answers } from "../flow";
import { Footer, Icon, OptionRow, PrimaryButton, SectionHeading } from "../ui";

type StepProps = { a: Answers; set: (patch: Partial<Answers>) => void; next: () => void };

export function GarmentScreen({ a, set, next, onSample }: StepProps & { onSample: (s: SampleGarment, live: boolean) => void }) {
  const [samplesOpen, setSamplesOpen] = useState(false);
  const [live, setLive] = useState(false);
  return (
    <div className="screen-content garment-screen">
      <SectionHeading eyebrow="01 / 05  ·  THE GARMENT" title="What do you want to rework?" />
      <div className="sample-panel">
        <button type="button" className="sample-toggle" onClick={() => setSamplesOpen((o) => !o)} aria-expanded={samplesOpen}>
          <span><strong>Try a sample garment</strong><small>No garment to hand? Jump straight to three ideas.</small></span>
          <span className={samplesOpen ? "rotate" : ""}><Icon name="chevron" size={18} /></span>
        </button>
        {samplesOpen && (
          <div className="sample-list">
            {SAMPLE_GARMENTS.map((g) => (
              <button type="button" key={g.id} onClick={() => onSample(g, live)}>
                <span><strong>{g.title}</strong><small>{g.why}</small></span>
                <Icon name="arrow" size={17} />
              </button>
            ))}
            <label className="live-toggle">
              <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
              <span className="check-box" aria-hidden>{live && <Icon name="check" size={13} />}</span>
              <span>Use live AI <small>Off: saved ideas, works offline</small></span>
            </label>
          </div>
        )}
      </div>
      <ol className="how-strip" aria-label="How it works in 3 steps">
        <li><span>01</span>Photograph or pick the garment</li>
        <li><span>02</span>Add the fabric and your tools</li>
        <li><span>03</span>Get three fabric-aware ideas, then make it or get it made</li>
      </ol>
      <div className="garment-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/at-the-cutting-table.png" alt="A well-loved white shirt, scissors, measuring tape and pincushion on a wooden worktable" />
        <div className="image-caption"><span>AT THE CUTTING TABLE / 01</span></div>
      </div>
      <div className="selection-label">CHOOSE ONE <span>{String(GARMENTS.length).padStart(2, "0")} GARMENTS</span></div>
      <div>
        {GARMENTS.map((g, i) => (
          <button type="button" key={g.id} className={`garment-option ${a.garment === g.id ? "active" : ""}`} onClick={() => set({ garment: g.id })} aria-pressed={a.garment === g.id}>
            <span className="garment-index">0{i + 1}</span>
            <span>{g.label}</span>
            <span className="garment-mark"><Icon name={a.garment === g.id ? "check" : "arrow"} size={17} /></span>
          </button>
        ))}
      </div>
      <Footer><PrimaryButton disabled={!a.garment} onClick={next}>Continue</PrimaryButton></Footer>
      <p className="disclaimer">A student prototype. Ideas are AI suggestions, so test on a scrap first.</p>
      <a className="concept-link" href="/mock/menders" target="_blank" rel="noopener">Coming later: menders and community (concept mock-up)</a>
    </div>
  );
}

// Sample photos shown before the user adds their own (from the Figma design).
const SAMPLE_PHOTO: Record<string, string> = {
  sweater: "https://images.unsplash.com/photo-1643015862949-5c8d15a4242e?w=900&q=85",
  jeans: "https://images.unsplash.com/photo-1721637286605-ae9be19d681f?w=900&q=85",
};
const TEXTILE_PHOTO = "https://images.unsplash.com/photo-1631112230741-446762ee05ac?w=900&q=85";

export function PhotoScreen({ a, set, next }: StepProps) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setError("");
      set({ garmentImage: await resizeImage(file) }); // resized to 1024px, never stored
    } catch {
      setError("Couldn't read that photo. Try another one.");
    }
  }

  return (
    <div className="screen-content">
      <SectionHeading eyebrow="02 / 05  ·  THE PHOTO" title="Add a photo of it." description="Lay it flat, find some good light, and show us the whole thing." />
      <div className="photo-preview">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.garmentImage || SAMPLE_PHOTO[a.garment ?? ""] || TEXTILE_PHOTO} alt={a.garmentImage ? "Your photo" : "Sample fabric photograph"} />
        <span className="preview-tag">{a.garmentImage ? "YOUR PHOTO" : "SAMPLE PREVIEW"}</span>
      </div>
      <div className="photo-actions">
        <button type="button" onClick={() => camera.current?.click()}><Icon name="camera" size={23} /><span>Take photo</span></button>
        <button type="button" onClick={() => gallery.current?.click()}><Icon name="image" size={23} /><span>Gallery</span></button>
      </div>
      <input className="hidden-input" ref={camera} type="file" accept="image/*" capture="environment" onChange={onFile} />
      <input className="hidden-input" ref={gallery} type="file" accept="image/*" onChange={onFile} />
      {error && <p className="inline-note">{error}</p>}
      <div className="privacy-note">
        <span className="privacy-symbol">i</span>
        <p>Optional. Your photo is sent once to the AI with your answers and is not saved. Don&apos;t include faces.</p>
      </div>
      <Footer><PrimaryButton onClick={next}>{a.garmentImage ? "Continue" : "Skip the photo"}</PrimaryButton></Footer>
    </div>
  );
}

export function ToolsScreen({ a, set, next }: StepProps) {
  function toggle(id: ToolId) {
    if (id === "none") return set({ tools: a.tools.includes("none") ? [] : ["none"] });
    const rest = a.tools.filter((t) => t !== "none");
    set({ tools: rest.includes(id) ? rest.filter((t) => t !== id) : [...rest, id] });
  }
  return (
    <div className="screen-content">
      <SectionHeading eyebrow="04 / 05  ·  YOUR TOOLKIT" title="What do you have handy?" description="Select everything you could use. We'll keep the ideas realistic." />
      <div className="tool-list">
        {TOOLS.map((t) => <OptionRow key={t.id} title={t.label} selected={a.tools.includes(t.id)} onClick={() => toggle(t.id)} />)}
      </div>
      <Footer note="No fancy equipment required.">
        <PrimaryButton onClick={next}>Continue</PrimaryButton>
      </Footer>
    </div>
  );
}

export function SkillScreen({ a, set, next }: StepProps) {
  return (
    <div className="screen-content">
      <SectionHeading eyebrow="05 / 05  ·  YOUR SKILL" title="How do you like to make?" description="There is no wrong answer. Start wherever you are." />
      <div className="skill-decoration">
        <div className="skill-circle"><Icon name="scissors" size={42} /></div>
        <span>YOU&apos;VE GOT THIS.</span>
      </div>
      <div className="skill-list">
        {SKILLS.map((s) => <OptionRow key={s.id} title={s.label} subtitle={s.hint} selected={a.skill === s.id} onClick={() => set({ skill: s.id })} />)}
      </div>
      <Footer><PrimaryButton disabled={!a.skill} onClick={next}>Find my ideas</PrimaryButton></Footer>
    </div>
  );
}
