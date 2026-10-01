// Shared building blocks from the Figma design. Styles live in app/globals.css.
import type { ReactNode } from "react";

const PATHS: Record<string, ReactNode> = {
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  back: <path d="M20 12H5m6-6-6 6 6 6" />,
  camera: (<><path d="M3 7h4l2-2h6l2 2h4v12H3z" /><circle cx="12" cy="13" r="3.5" /></>),
  image: (<><rect x="3" y="4" width="18" height="16" rx="1" /><circle cx="8" cy="9" r="1" /><path d="m3 17 5-5 4 4 3-3 6 5" /></>),
  label: <path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5" />,
  edit: <path d="M4 20h16M6 16l10-10 3 3-10 10H6zM14 8l3 3" />,
  check: <path d="m4 12 5 5L20 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  close: <path d="M5 5l14 14M19 5 5 19" />,
  scissors: (<><circle cx="6" cy="17" r="3" /><circle cx="6" cy="7" r="3" /><path d="m9 9 11 12M9 15 20 3" /></>),
  sparkle: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
};

export function Icon({ name, size = 20 }: { name: keyof typeof PATHS | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[name]}
    </svg>
  );
}

export function PrimaryButton({ children, onClick, disabled, type = "button" }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit";
}) {
  return (
    <button type={type} className="primary-button" onClick={onClick} disabled={disabled}>
      <span>{children}</span>
      <Icon name="arrow" />
    </button>
  );
}

export function SecondaryButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return <button type="button" className="secondary-button" onClick={onClick}>{children}</button>;
}

export function OptionRow({ title, subtitle, selected, onClick }: {
  title: string; subtitle?: string; selected?: boolean; onClick?: () => void;
}) {
  return (
    <button type="button" className={`option-row ${selected ? "is-selected" : ""}`} onClick={onClick} aria-pressed={!!selected}>
      <span className="option-copy"><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</span>
      <span className="option-selector">{selected && <Icon name="check" size={15} />}</span>
    </button>
  );
}

export function FibreChip({ name, selected, onClick }: { name: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`fibre-chip ${selected ? "is-selected" : ""}`} onClick={onClick} aria-pressed={selected}>
      {selected && <Icon name="check" size={13} />}{name}
    </button>
  );
}

export function Stepper({ name, value, onChange }: { name: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="stepper-row">
      <span>{name}</span>
      <div className="stepper-control">
        <button type="button" aria-label={`Decrease ${name}`} onClick={() => onChange(Math.max(0, value - 5))}><Icon name="minus" size={15} /></button>
        <strong>{value}<small>%</small></strong>
        <button type="button" aria-label={`Increase ${name}`} onClick={() => onChange(Math.min(100, value + 5))}><Icon name="plus" size={15} /></button>
      </div>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="section-heading">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}

export function Footer({ children, note }: { children: ReactNode; note?: string }) {
  return <div className="screen-footer">{note && <p className="footer-note">{note}</p>}{children}</div>;
}

export function ThanksState({ label, text, onBack }: { label: string; text: string; onBack: () => void }) {
  return (
    <div className="thanks-state">
      <span><Icon name="check" size={36} /></span>
      <strong>{label}</strong>
      <p>{text}</p>
      <SecondaryButton onClick={onBack}>Back to your ideas <Icon name="arrow" size={17} /></SecondaryButton>
    </div>
  );
}
