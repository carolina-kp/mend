// Mender profile (concept).
import Link from "next/link";
import { notFound } from "next/navigation";
import { MENDERS } from "@/lib/mockMenders";

export const generateStaticParams = () => MENDERS.map((m) => ({ id: m.id }));

export default async function MenderProfile({ params }: PageProps<"/mock/menders/[id]">) {
  const { id } = await params;
  const m = MENDERS.find((x) => x.id === id);
  if (!m) notFound();
  return (
    <div className="screen-content">
      <Link href="/mock/menders" className="mock-back">← All menders</Link>
      <div className="profile-head">
        <span className="avatar avatar-lg" aria-hidden>{m.initials}</span>
        <div>
          <h1>{m.name}, {m.age}</h1>
          <p>{m.area} · ★ {m.rating} from {m.jobs} jobs</p>
        </div>
      </div>
      <p className="profile-bio">{m.bio}</p>
      <dl className="profile-facts">
        <dt>Typical price</dt><dd>{m.priceRange[0]} to {m.priceRange[1]} kr <small>(placeholder)</small></dd>
        <dt>Good at</dt><dd>{m.specialities.join(", ")}</dd>
        <dt>Tools</dt><dd>{m.tools.join(", ")}</dd>
      </dl>
      <div className="selection-label">PAST PROJECTS <span>{String(m.projects.length).padStart(2, "0")}</span></div>
      <div className="project-grid">
        {m.projects.map((p) => (
          <figure key={p.title} className="project-tile">
            <span className="swatch" style={{ background: p.swatch }} aria-hidden />
            <figcaption><strong>{p.title}</strong><small>{p.fabric}</small></figcaption>
          </figure>
        ))}
      </div>
      <div className="screen-footer">
        <button type="button" className="primary-button" disabled><span>Ask {m.name} for a quote</span></button>
        <p className="footer-note">Not live. In the prototype, &quot;Get it made&quot; sends your brief to us and we match it by hand.</p>
      </div>
    </div>
  );
}
