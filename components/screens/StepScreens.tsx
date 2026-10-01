"use client";
// Steps 1, 2, 4, 5: garment, photo, tools, skill.
import { useRef, useState } from "react";
import { GARMENTS, SKILLS, TOOLS, type ToolId } from "@/lib/config";
import { resizeImage } from "@/lib/resizeImage";
import type { Answers } from "../flow";
import { Footer, Icon, OptionRow, PrimaryButton, SectionHeading } from "../ui";

type StepProps = { a: Answers; set: (patch: Partial<Answers>) => void; next: () => void };

export function GarmentScreen({ a, set, next }: StepProps) {
  return (
    <div className="screen-content garment-screen">
      <SectionHeading eyebrow="01 / 05  ·  THE GARMENT" title="What do you want to rework?" />
      <div className="garment-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/at-the-cutting-table.png" alt="A well-loved white shirt, scissors, measuring tape and pincushion on a wooden worktable" />
        <div className="image-caption"><span>AT THE CUTTING TABLE / 01</span></div>
      </div>
      <div className="selection-label">CHOOSE ONE <span>01 — {String(GARMENTS.length).padStart(2, "0")}</span></div>
      <div>
        {GARMENTS.map((g, i) => (
          <button type="button" key={g.id} className={`garment-option ${a.garment === g.id ? "active" : ""}`} onClick={() => set({ garment: g.id })}>
            <span className="garment-index">0{i + 1}</span>
            <span>{g.label}</span>
            <span className="garment-mark"><Icon name={a.garment === g.id ? "check" : "arrow"} size={17} /></span>
          </button>
        ))}
      </div>
      <Footer><PrimaryButton disabled={!a.garment} onClick={next}>Continue</PrimaryButton></Footer>
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
        <p>Photos are sent to an AI to generate ideas and aren&apos;t stored. Don&apos;t include faces.</p>
      </div>
      <Footer><PrimaryButton onClick={next}>Continue</PrimaryButton></Footer>
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
