// Plain-English privacy notice (brief section 8). Keep it in step with lib/events.ts,
// lib/quote.ts and supabase/migrations/ whenever what we store changes.
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "mend. privacy", description: "What the mend. prototype stores, why, for how long, and who to contact." };

const DELETE_BY = "31 January 2027";

export default function PrivacyPage() {
  const contact = process.env.PRIVACY_CONTACT_EMAIL;
  return (
    <main className="lab doc">
      <Link href="/" className="app-logo">mend<span>.</span></Link>
      <span className="eyebrow lab-eyebrow">PRIVACY</span>
      <h1>Your data, in plain English.</h1>
      <p>mend. is a student prototype for the course Fashion Entrepreneurship and Business Development at Copenhagen Business School, run by Carolina Kogan Plachkinova and Poppy. We use it to test whether fabric-first upcycling ideas are useful. It is not a commercial service.</p>

      <h2>No accounts, no trackers</h2>
      <p>You never sign up or log in. There are no advertising or analytics trackers and no tracking cookies. Your browser keeps a random code for the current tab (a session id) so the answers from one visit can be grouped. It is not linked to your name and disappears when you close the tab or tap Reset.</p>

      <h2>What we store</h2>
      <ul>
        <li>The garment type, fibre mix, tools and skill level you choose.</li>
        <li>The titles of the three ideas you were shown, and whether they came from the AI or our standard set.</li>
        <li>Your star rating, whether you would try an idea, and any comment you write.</li>
        <li>Whether you chose &quot;make it myself&quot; or &quot;get it made&quot;.</li>
        <li>If you request a quote: the ready brief (idea, steps, notes, budget, date wanted). If you add an email, it is kept in a separate table and used only to reply about that quote.</li>
        <li>If you answer the one-week follow-up: whether you made something, which idea, and what happened.</li>
        <li>The time of each answer.</li>
      </ul>

      <h2>What we do not store</h2>
      <ul>
        <li><b>Photos.</b> A garment or care label photo is shrunk on your phone, sent once to the AI to read it, and never saved by us. Please keep faces and personal details out of photos.</li>
        <li>Names, addresses or phone numbers. We never ask for them.</li>
        <li>Your email, unless you type it into a quote request yourself.</li>
      </ul>

      <h2>Why</h2>
      <p>To produce your ideas, to pass a quote request to a mender by hand, and to measure, for our course report, whether the ideas are good and whether people use them. Only Carolina and Poppy can see the stored answers. Results in the report are counted and anonymous.</p>

      <h2>Who else handles it</h2>
      <ul>
        <li><b>Google Gemini</b> (the AI) receives your garment answers and any photo to write the ideas. We use the free tier, where Google may use what is sent to improve its services, which is one more reason to leave faces and personal details out.</li>
        <li><b>Supabase</b> stores the answers in a database in Frankfurt, in the EU.</li>
        <li><b>Vercel</b> hosts the website.</li>
      </ul>

      <h2>How long</h2>
      <p>Until the course project ends. We delete everything by {DELETE_BY}. A quote email is deleted earlier, once we have replied about that quote.</p>

      <h2>Your rights</h2>
      <p>Under the GDPR you can ask to see, correct or delete your answers. Because we do not know who you are, tell us the code at the end of your follow-up link (for example /f/0757febf) or the date and garment you tried, and we will find and delete them. You can also complain to the Danish Data Protection Agency (Datatilsynet).</p>

      <h2>Contact</h2>
      <p>{contact ? <>Email <a href={`mailto:${contact}`}>{contact}</a>.</> : <>Ask Carolina or Poppy in person, or through the Fashion Entrepreneurship course at CBS.</>}</p>

      <p className="doc-updated">Last updated 9 November 2026.</p>
    </main>
  );
}
