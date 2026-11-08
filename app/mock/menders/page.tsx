// Browse menders (concept). Invented people, placeholder prices.
import Link from "next/link";
import { MENDERS } from "@/lib/mockMenders";

export default function MendersPage() {
  return (
    <div className="screen-content">
      <div className="section-heading">
        <div className="eyebrow">GET IT MADE · COPENHAGEN</div>
        <h1>Menders near you.</h1>
        <p>Experienced sewers, often students earning on the side. In the live prototype we match jobs by hand.</p>
      </div>
      <div className="mender-list">
        {MENDERS.map((m) => (
          <Link key={m.id} href={`/mock/menders/${m.id}`} className="mender-row">
            <span className="avatar" aria-hidden>{m.initials}</span>
            <span className="mender-copy">
              <strong>{m.name}, {m.age} <small>· {m.area}</small></strong>
              <small>{m.specialities.join(" · ")}</small>
              <small>★ {m.rating} ({m.jobs} jobs) · from {m.priceRange[0]} kr</small>
            </span>
            <span aria-hidden>→</span>
          </Link>
        ))}
      </div>
      <p className="disclaimer">Example people and prices, made up to show the idea.</p>
    </div>
  );
}
