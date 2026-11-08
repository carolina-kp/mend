// Community feed (concept): finished projects. No posting, liking or following.
import { COMMUNITY_POSTS } from "@/lib/mockMenders";

export default function CommunityPage() {
  return (
    <div className="screen-content">
      <div className="section-heading">
        <div className="eyebrow">MADE WITH MEND.</div>
        <h1>What people made.</h1>
        <p>A future feed of finished projects, so the next person can see what their fabric became.</p>
      </div>
      <div className="feed">
        {COMMUNITY_POSTS.map((p) => (
          <article key={p.id} className="feed-card">
            <span className="swatch swatch-wide" style={{ background: p.swatch }} aria-hidden />
            <div className="feed-copy">
              <span className="tiny-label">{p.from.toUpperCase()} · MADE {p.made.toUpperCase()}</span>
              <h3>{p.idea}</h3>
              <p>&quot;{p.note}&quot;</p>
              <small>{p.author}</small>
            </div>
          </article>
        ))}
      </div>
      <p className="disclaimer">Example posts, made up to show the idea.</p>
    </div>
  );
}
