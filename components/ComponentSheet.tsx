// "The studio kit": the design's component sheet, shown in the presentation.
import { SAMPLE_IDEAS } from "@/lib/demo";
import { IdeaCard } from "./screens/ResultScreens";
import { FibreChip, OptionRow, PrimaryButton, SecondaryButton, Stepper } from "./ui";

const noop = () => {};

export function ComponentSheet() {
  return (
    <div className="component-sheet">
      <div className="sheet-heading">
        <span className="eyebrow">THE STUDIO KIT / 01</span>
        <h2>Little things, made well.</h2>
        <p>A small set of pieces that make every step feel considered.</p>
      </div>
      <div className="sheet-grid">
        <div className="sheet-block"><span className="tiny-label">01 / BUTTONS</span><PrimaryButton>Continue</PrimaryButton><SecondaryButton>Secondary action</SecondaryButton></div>
        <div className="sheet-block"><span className="tiny-label">02 / SELECTABLE ROW</span><OptionRow title="Needle & thread" selected /><OptionRow title="Fabric glue" /></div>
        <div className="sheet-block">
          <span className="tiny-label">03 / FIBRE CHIP + STEPPER</span>
          <div className="sheet-chips"><FibreChip name="Cotton" selected onClick={noop} /><FibreChip name="Linen" selected={false} onClick={noop} /></div>
          <Stepper name="Cotton" value={80} onChange={noop} />
        </div>
        <div className="sheet-block sheet-colors">
          <span className="tiny-label">04 / COLOUR VARIABLES</span>
          <div><i style={{ background: "var(--paper)" }} />Paper <code>#F6F3EC</code></div>
          <div><i style={{ background: "var(--ink)" }} />Ink <code>#222724</code></div>
          <div><i style={{ background: "var(--accent)" }} />Madder <code>#A54537</code></div>
        </div>
        <div className="sheet-block sheet-type">
          <span className="tiny-label">05 / TYPE VARIABLES</span>
          <div className="type-display">A second life.</div><p>Display / Fraunces · 36 / 1.04</p>
          <div className="type-ui">Made for making.</div><p>UI / DM Sans · 14 / 1.5</p>
        </div>
        <div className="sheet-block"><span className="tiny-label">06 / IDEA CARD</span><IdeaCard idea={SAMPLE_IDEAS[2]} index={0} open={false} onToggle={noop} onService={noop} /></div>
      </div>
    </div>
  );
}
