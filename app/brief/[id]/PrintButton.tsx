"use client";
export function PrintButton() {
  return (
    <button type="button" className="secondary-button no-print" onClick={() => window.print()}>
      Print or save as PDF <span aria-hidden>↓</span>
    </button>
  );
}
