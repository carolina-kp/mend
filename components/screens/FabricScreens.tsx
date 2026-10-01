"use client";
// Step 3: fabric. Either photograph the care label (AI reads the %s) or enter fibres by hand.
import { useRef, useState } from "react";
import { readLabel } from "@/lib/api";
import { FABRICS, FIBRES, fabricFromParts, partsToText, type FibreId } from "@/lib/fabrics";
import { resizeImage } from "@/lib/resizeImage";
import type { Answers } from "../flow";
import { FibreChip, Footer, Icon, PrimaryButton, SectionHeading, Stepper } from "../ui";

type Props = { a: Answers; set: (patch: Partial<Answers>) => void; next: () => void };

export function FabricChoiceScreen({ set, next, onManual }: Props & { onManual: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "reading" | "error">("idle");
  const [error, setError] = useState("");

  async function onLabel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setStatus("reading");
    try {
      const r = await readLabel(await resizeImage(file));
      if (!r.parts.length) throw new Error("We couldn't read that label. Try a sharper photo, or enter it yourself.");
      set({ parts: r.parts.map((p) => ({ ...p, percent: Math.round(p.percent) })) });
      setStatus("idle");
      next();
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
    }
  }

  return (
    <div className="screen-content">
      <SectionHeading eyebrow="03 / 05  ·  THE FABRIC" title="What is it made of?" description="Check the little label inside your garment. The fibres tell us what it can become." />
      <div className="choice-illustration">
        <div className="label-paper">
          <span>THE CARE LABEL</span>
          <div className="label-stitches" />
          <strong>100%<br />POSSIBILITY</strong>
          <small>THE MATERIAL COMES FIRST</small>
        </div>
        <span className="choice-side-note">LOOK INSIDE<br />YOUR GARMENT ↗</span>
      </div>
      <div className="choice-list">
        <button type="button" onClick={() => input.current?.click()} disabled={status === "reading"}>
          <span className="choice-icon"><Icon name="label" size={24} /></span>
          <span><strong>{status === "reading" ? "Reading your label…" : "Photo of the care label"}</strong><small>Use your camera or gallery</small></span>
          <Icon name="arrow" size={19} />
        </button>
        <button type="button" onClick={onManual}>
          <span className="choice-icon"><Icon name="edit" size={24} /></span>
          <span><strong>Enter it myself</strong><small>Pick the fibres and percentages</small></span>
          <Icon name="arrow" size={19} />
        </button>
      </div>
      <input className="hidden-input" ref={input} type="file" accept="image/*" onChange={onLabel} />
      {status === "error" && <p className="inline-note">{error}</p>}
      <p className="choice-footnote">Not sure? Make your best guess. You can always change it later.</p>
    </div>
  );
}

export function FabricMixScreen({ a, set, next, fromLabel }: Props & { fromLabel: boolean }) {
  const parts = a.parts;
  const total = parts.reduce((s, p) => s + p.percent, 0);
  const fabric = fabricFromParts(parts, a.garment);

  function toggle(fibre: FibreId) {
    if (parts.some((p) => p.fibre === fibre)) return set({ parts: parts.filter((p) => p.fibre !== fibre) });
    set({ parts: [...parts, { fibre, percent: parts.length ? 0 : 100 }] });
  }
  const change = (fibre: FibreId, percent: number) => set({ parts: parts.map((p) => (p.fibre === fibre ? { ...p, percent } : p)) });
  const label = (id: FibreId) => FIBRES.find((f) => f.id === id)?.label ?? id;
  const ready = total === 100 && parts.length > 0;

  return (
    <div className="screen-content fabric-screen">
      <SectionHeading eyebrow="03 / 05  ·  THE FABRIC" title="Build your fabric mix." description="Tap the fibres on your label, then set their percentages." />
      {fromLabel && <div className="inline-note">Care label added. Please confirm the fibres below.</div>}
      <div className="selection-label">TAP TO ADD FIBRES</div>
      <div className="fibre-grid">
        {FIBRES.map((f) => <FibreChip key={f.id} name={f.label} selected={parts.some((p) => p.fibre === f.id)} onClick={() => toggle(f.id)} />)}
      </div>
      <div className="fibre-divider" />
      <div className="selection-label">YOUR COMPOSITION</div>
      <div className="stepper-list">
        {parts.map((p) => <Stepper key={p.fibre} name={label(p.fibre)} value={p.percent} onChange={(v) => change(p.fibre, v)} />)}
        {!parts.length && <p className="empty-note">Choose at least one fibre above.</p>}
      </div>
      <div className={`total-line ${total === 100 ? "complete" : ""}`}>
        <span>TOTAL</span>
        <strong>{total}% <span>/ 100%</span></strong>
      </div>
      <div className="care-tag">
        <span className="tag-hole" />
        <span>FABRIC ID / 001</span>
        <strong>Treated as: {FABRICS[fabric].label}</strong>
        <small>We start with the fibre that makes up most of your garment.</small>
      </div>
      <Footer note={ready ? "Your fabric mix is ready." : `${Math.abs(100 - total)}% ${total < 100 ? "to go" : "over"} before you can continue`}>
        <PrimaryButton disabled={!ready} onClick={() => (set({ fabric, composition: partsToText(parts) }), next())}>Continue</PrimaryButton>
      </Footer>
    </div>
  );
}
