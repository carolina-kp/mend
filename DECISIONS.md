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
