# Decisions

Choices made while building the prototype from `mend-prototype-brief.md`. Newest at the bottom of each section.

## What already existed (October 2026 prototype)

- Next.js 16 App Router, TypeScript, Tailwind 4, Zod 4. Deployed at mend-gilt.vercel.app.
- Design: Fraunces serif headings, DM Sans body, cream `#f6f3ec`, ink `#222724`, madder red accent `#a54537`. On a laptop the app sits in a phone frame inside a presentation page with a screen navigator; on a phone it is full screen.
- Ten screens: garment, garment photo, fabric choice (label photo or manual), fibre mix, tools, skill, loading, results, "get this done for me", feedback.
- `/api/suggest` (label reading and ideas, Gemini over plain REST, Ollama for local dev), `/api/feedback` (logs to a JSONL file or the server log).
- `lib/fabrics.ts` held per-fabric notes that were pasted into the prompt. No tests, no database.

## Kept

- The whole look, fonts, colours, wordmark and the presentation shell. No brand changes.
- The Gemini REST provider (no SDK, fewer dependencies), the Ollama option for local work and the per-IP rate limiter.
- Care label photo reading through `/api/suggest` stays as it was. It is not extended in this pass (second pass).
- The garment photo screen stays. The photo is optional and now goes to `/api/ideas`; requests with a photo skip the cache.

## Pass 1 decisions

- **Rules live in code, not only in the prompt.** `lib/fabricRules.ts` holds fibre, garment, tool and skill tables. `lib/buildConstraints.ts` turns an input into a constraints object and also runs the rule check on any idea (from Gemini, the fallback bank or the cached samples).
- **Blends.** Safety limits (iron heat) follow the most restrictive fibre that makes up at least 5% of the garment, and elastane counts at any amount. Handling traits (fraying, slipperiness) are weighted by percentage. Felting is only offered when wool is at least 80%, because synthetic content stops a knit from felting evenly.
- **Acrylic gets no iron at all** (max heat "none"), the most cautious reading of "keep the iron low, use a cloth, or avoid heat". This also bans iron-on patches and heat-set glue for acrylic.
- **Skill levels renamed** to beginner, comfortable, confident (brief wording). Max difficulty: beginner 3, comfortable 4, confident 5, so a beginner still gets a "stretch" idea.
- **Rule check is keyword based.** It flags tools the person does not own, machine sewing without a machine, hot ironing or iron-on patches on heat-sensitive fibres, felting non-wool, cutting without scissors, sewing without needle or machine, difficulty above the skill cap and beginner-unfriendly techniques (zips, set-in sleeves, pattern drafting, buttonholes). Negations such as "no machine needed" are stripped before checking.
- **When Gemini breaks a rule**, we retry once with the violations listed. If the second answer still breaks rules, the valid ideas are kept and the rest are filled from the fallback bank, so the person always gets three safe ideas.
- No em dashes in UI copy, docs or comments; existing ones are replaced as files are touched.

## Step 2: /api/ideas

- New route `/api/ideas`. `/api/suggest` now only reads care labels.
- Pipeline in `lib/ideas.ts`: constraints, prompt (`lib/prompt.ts`), Gemini with `responseJsonSchema` generated from the Zod schema, temperature 0.5, 8 second timeout (`GEMINI_TIMEOUT_MS` to change it).
- A timeout or "busy" answer (429, 503) goes straight to the fallback with no second wait. Bad JSON, other errors and rule violations get one retry, and the retry prompt lists the broken rules.
- Any valid request returns 200 with three ideas and `source` ("ai" or "fallback"). Over the per-IP rate limit, people get the fallback set instead of an error.
- Identical photo-less requests are cached in memory for 10 minutes, and a request that is already on its way is shared rather than sent twice. Requests with a garment photo are never cached.
- `lib/fallbackIdeas.ts` is a bank of 26 templates with needs (tools, fabric, skill). It is tested across every garment, ten fibre mixes, all 129 toolkits and three skill levels: always three distinct, schema-valid ideas that pass the rule check.
- Model name defaults to `gemini-3.5-flash` when `LLM_MODEL` is not set.
- `agentRules: false` in `next.config.ts` so Next.js stops generating AGENTS.md and CLAUDE.md.

## Step 3: the main flow

- Twelve screens: garment (landing), photo (optional, "Skip the photo"), fabric choice, fibre mix, tools, skill, loading, three ideas, idea detail, make it myself, get it made, feedback.
- The brief's separate "choose" screen is folded into the bottom of the idea detail (two buttons), to save a tap in the two-minute demo.
- Ideas are labelled QUICK, MEDIUM, STRETCH by position (they arrive easiest first).
- The fibre mix screen shows a live rule preview (iron heat, cut edges, stretch, felting) from `buildConstraints`, so the fabric-first logic is visible before any AI runs. Percentages can be typed as well as stepped by 5, so 98% cotton and 2% elastane can be entered.
- If the browser cannot reach the server at all, `lib/api.ts` runs the same fallback bank in the browser, so ideas still appear.
- Get it made (pass 1): the ready brief with notes, budget in kr and a "Copy brief as text" button. "Request a quote" records only the choice, whether notes were written and the budget. Notes text and emails are not stored until the quote route is built in pass 2.
- Feedback: 1 to 5 stars, "Would you try one?" yes or no, optional comment. Stored with the anonymous session id, answers and idea titles (`lib/events.ts` defines exactly what is allowed).
- Reset link in the app bar (from screen 2 on) clears answers and starts a new anonymous session id.
- Removed `lib/fabrics.ts` and `lib/demo.ts` (replaced by `fabricRules.ts` and the fallback bank). No pages were removed.

## Step 4: teacher demo mode

- "Try a sample garment" sits at the top of the landing screen and opens the four samples from the brief. Picking one goes straight to the three ideas (two taps).
- Saved ideas live in `lib/sampleIdeas.json`. They were generated once by the full pipeline (rules, Gemini, rule check) on 29 October 2026, then lightly edited by hand: one step order fixed on the wool cushion, one typo on the jeans tote, and the acrylic heat warning added. `lib/sampleGarments.test.ts` re-checks them against the rules on every test run.
- "Use live AI" (off by default) sends the sample through `/api/ideas` instead.
- The pipeline now always shows the heat warning on every idea when the fabric cannot take a medium iron (acrylic, polyester, nylon and blends with them), whatever the model wrote.
- The presentation navigator shows the stretch jeans sample when someone jumps past the questions.
- QR code and short URL for the landing page are left for the second pass (the brief lists them under demo mode, but this pass's scope did not).

## Step 5: storage and /lab

- `lib/store.ts` writes to a Supabase `events` table over plain REST (no SDK) when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, otherwise to `data/events.jsonl` locally. The CSV export works with either.
- One table for feedback and choices (`supabase/migrations/001_events.sql`): the columns people filter on, plus a `data` jsonb for the fibre mix, tools, idea titles and comment. Row level security on with no policies, so only the server's service role key can read or write.
- `/lab` uses a shared passcode (`LAB_PASSCODE`). A correct passcode sets an httpOnly, same-site cookie holding a hash of the passcode, so changing the passcode logs everyone out. Lab is off when the variable is empty.
- Lab shows testers, feedback count, average rating (all and AI-only), would-try percentage, make vs get-made counts, the "Target: at least 25% tried an idea" line, the latest 200 events and Export CSV. Cells that start like a spreadsheet formula are prefixed with a quote.
- The A/B chatbot comparison, rating form and follow-up tracking are second pass.
- Feedback route has its own per-IP rate limit and logs the event to the server log if the database write fails.
- Node 22+ in the README (AI SDK is not used, but Node 20 is deprecated on Vercel).
- Supabase project "mend" created on 29 October 2026 in carolina-kp's Org (free tier, $0/month, eu-central-1 Frankfurt, close to Copenhagen). Migration `001_events` applied. The security advisor's "RLS enabled, no policy" notice is intended: only the server key can read or write.
- `lib/store.ts` accepts both legacy JWT service_role keys and the newer `sb_secret_` keys (sent only in the `apikey` header).

# Second pass (November 2026)

## Storage
- `lib/store.ts` is now table-agnostic (`insertRow`, `upsertRow`, `listRows`, `getRow`), with the same Supabase or local JSONL behaviour for every table.
- `supabase/migrations/002_second_pass.sql` adds `lab_runs`, `lab_ratings`, `quotes`, `quote_contacts` and `trials`, and allows `followup` events. Row level security on every table, no policies.

## Lab blind A/B (H1)
- "A" is the full mend. pipeline (same as the app, including the fallback if Gemini is down; the run records which). "B" is the same Gemini model and temperature with a plain prompt: "Suggest three upcycling ideas for this garment" plus the garment, fibre mix, tools and skill, the facts a person would type into a free chatbot. No fabric rules, no constraints.
- Both sets are shown in one neutral shape (title, description, materials, steps, tips) so the format gives nothing away. mend.'s "why it suits the fabric" and warnings become its tips, and the chatbot is asked for tips too.
- The server flips a coin for Set 1 or Set 2 and returns only the run id; the mapping never reaches the rating page. The main lab page shows the mapping to Carolina and Poppy.
- Ratings per idea: feasible, creative, suits the fabric (1 to 5) and an "unsafe or damaging" box, plus a comment per set and a rater label (not a full name).
- H1 metric on the lab page: share of ideas rated feasible (4 or 5) for mend. minus the chatbot's, against the 20 point target from the proposal. Also average score, unsafe counts, and a winner per rated run (higher average of all three scores).
- "Export blind ratings CSV" gives one row per rated idea with the true mapping.

## Quote request (H3)
- "Request a quote" now posts the ready brief to `/api/quote`, which stores it in `quotes` without photos. The optional email goes in `quote_contacts`, a separate table, and is only shown in `/lab` so the team can reply (brief section 8).
- Extra optional fields: "Wanted by" date and email. Spam guard: a hidden honeypot field (bots that fill it get a fake success and nothing is stored) and a per-IP rate limit.
- Team email: through Resend's free tier only when `RESEND_API_KEY` and `QUOTE_NOTIFY_EMAIL` are set. Not set up, because it needs Carolina's own Resend account; requests are stored and listed in `/lab` either way. The notification never contains the requester's email.
- After sending: "A mender will reply with a quote. For this demo we match jobs by hand.", an "Open your brief" link and an "Example quote (demo)" card from the mock mender Ida, with placeholder prices by difficulty (`lib/mockMenders.ts`).
- `/brief/[id]` is the shareable brief (unguessable id, no photo, no contact detail) with a print or save as PDF button.
- If the request fails, the screen says so calmly and keeps the form, so the brief can still be copied as text.
- `/lab` shows H3: share of tester sessions that tapped "get it made" (target 15%) and that left an email (target 5%), plus a list of quote requests with links to each brief.

## Follow-up and trial tracking (H2)
- The short link is `/f/<code>`, where the code is the first 8 characters of the tester's anonymous session id. It is shown on the feedback thank-you screen with a copy button, and listed per tester in `/lab` so it can be sent after a week. Plain `/f` works too.
- The page asks: did you make something (yes or not yet), which idea (the three the person saw, found by the code, plus "Something else") and what happened. The answer is stored as a `followup` event. No login, no contact details.
- `/lab` trial tracking: one row per tester with feedback, the follow-up link, a "Mark sent" toggle and "made something", taken from the tester's answer or set by hand (yes, no, unknown) when the answer came another way. Stored in `trials`.
- H2 on the lab page: share of testers with feedback who made something, against the 25% target. The feedback CSV gains `has_email` and `made` columns.

## Concept mock-ups (Phase 2)
- `/mock/menders` (browse), `/mock/menders/[id]` (profile) and `/mock/community` (feed), with tabs between them. Every screen shows the "Concept mock-up, not live" badge in the top bar, from one shared layout.
- Static seed data in `lib/mockMenders.ts` (invented people: Ida, Malik, Sofie; four community posts). Prices are labelled placeholders. No accounts, following, posting or messaging; "Ask for a quote" on a profile is disabled with a note that the prototype matches jobs by hand.
- Past projects are shown as fabric-coloured swatch tiles rather than photos, so there is no stock imagery to license and nothing looks like a real person's work.
- Links in: a small line under the landing disclaimer, and "See Ida's profile" on the demo quote card. Both open in a new tab so the main flow is not lost.

## Loading screen and model speed (9 November 2026)
- Problem: the loading screen often ended in the "AI is busy" standard set. On 9 November gemini-3.5-flash took 13 to 64 seconds per request (with a rule-check retry), so the 8 second timeout from the brief cut it off.
- Benchmarked four test garments: gemini-3.5-flash with minimal thinking took 13 to 40 s (one fell back); gemini-3.5-flash-lite took 3 to 7 s, all four real AI answers, equally specific. Both are free tier. Default model is now `gemini-3.5-flash-lite` with `minimal` thinking (`GEMINI_THINKING` to change).
- Timeout raised to 12 s per attempt (deviation from the brief's 8 s): Flash-Lite answers well inside it, and two attempts stay under the browser's own 30 s limit, after which the browser shows the standard set itself. The app still never shows an error.
- Loading screen: one message every 2.2 s, a bar that fills slowly towards 90% and completes when ideas arrive (no fast looping bar), a plain "The free AI is slow right now. Still on it" after 14 s, a minimum of 2.4 s on screen so cached answers do not flash past, and "Your three ideas are ready" for 0.7 s before the results.
