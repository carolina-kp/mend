# mend. The rework studio

A fabric-first upcycling prototype for the CBS course Fashion Entrepreneurship and Business Development.

You pick a garment, say what it is made of, which tools you have and how confident you are, and get **three ideas** that fit *that* fabric, *those* tools and *your* skill. The ideas start from fabric rules in code, not from the model's imagination: acrylic never meets a hot iron, a toolkit without a sewing machine never gets a machine idea.

It is a prototype for testing with real users, not a production product.

**Live:** https://mend-gilt.vercel.app

- **On a phone:** the app, full screen.
- **On a laptop:** a presentation page with the live app in a phone frame, a screen navigator and the component kit.

The brief is in `mend-prototype-brief.md` (outside the repo), the original scope in [SPEC.md](SPEC.md) and every choice made while building in [DECISIONS.md](DECISIONS.md).

---

## Run it locally

Requires Node.js 22+.

```bash
npm install
cp .env.example .env.local   # then fill in your key (see below)
npm run dev
```

Open http://localhost:3000. To try it on your phone (same Wi-Fi), run `npm run dev -- -H 0.0.0.0` and open `http://<your-computer's-IP>:3000`.

Tests (rule engine, fallback bank, demo samples, lab export):

```bash
npm test
```

## Environment variables

| Variable | What it does |
|---|---|
| `GEMINI_API_KEY` | Free key from https://aistudio.google.com/apikey. Server only. |
| `LLM_MODEL` | Model name, default `gemini-3.5-flash` |
| `LLM_PROVIDER` | `gemini` (default) or `ollama` for local development |
| `GEMINI_TIMEOUT_MS` | How long to wait for Gemini before showing the standard idea set (default 8000) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Where feedback is stored. Empty: `data/events.jsonl` on your computer |
| `LAB_PASSCODE` | Shared passcode for `/lab`. Empty: lab is off |
| `OLLAMA_BASE_URL` | Only for Ollama, default `http://localhost:11434` |

`.env.local` is git-ignored. Keys are only used on the server and never reach the browser.

## If the AI is down

The app never shows an error page. If Gemini is slow (8 seconds), busy, has a bad key or keeps breaking the fabric rules, `/api/ideas` answers from the rule-based idea bank (`lib/fallbackIdeas.ts`) with the note "Showing a standard idea set because the AI is busy." If the phone cannot reach the server at all, the same bank runs in the browser.

## Teacher demo

On the first screen, **Try a sample garment** opens four samples (wool sweater, stretch jeans, cotton shirt, acrylic sweater). Their ideas are saved in `lib/sampleIdeas.json`, so the demo works offline. Tick **Use live AI** to ask Gemini instead.

**Reset** (top bar, from the second screen on) clears all answers and starts a new anonymous session.

## Lab

`/lab` (passcode in `LAB_PASSCODE`) shows the number of testers, average rating, how many would try an idea, a log of every rating and choice, and **Export CSV**.

## Database (Supabase free tier)

1. Create a free project at https://supabase.com.
2. In the SQL editor, run `supabase/migrations/001_events.sql`.
3. Copy the project URL and the service role key (Project settings, API) into `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

Row level security is on with no policies, so only the server can read or write.

## Deploy on Vercel

1. Push to GitHub. The Vercel project redeploys every push to `main`.
2. Under **Settings, Environment Variables**, add `GEMINI_API_KEY`, `LLM_MODEL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `LAB_PASSCODE`.
3. Redeploy.

---

## How to modify

| To change | Edit |
|---|---|
| Garments, tools, skill levels, brand name | `lib/config.ts` |
| What each fibre can take (heat, fraying, felting, stretch) and tool and skill rules | `lib/fabricRules.ts` |
| How rules combine for blends, and the rule check on ideas | `lib/buildConstraints.ts` |
| What the AI is told | `lib/prompt.ts` |
| Ideas used when the AI is down | `lib/fallbackIdeas.ts` |
| Demo garments and their saved ideas | `lib/sampleGarments.ts`, `lib/sampleIdeas.json` |
| Colours and fonts | top of `app/globals.css` |

After changing rules or the prompt, run `npm test` and the test garments in [testing/README.md](testing/README.md).

## Project structure

```
app/
  page.tsx                 the app (and presentation page on a laptop)
  lab/                     testing tools, passcode protected
  api/ideas/route.ts       rules, Gemini, rule check, fallback
  api/suggest/route.ts     care label photo reading
  api/feedback/route.ts    stores ratings and choices
  api/lab/export/route.ts  CSV export
components/
  Studio.tsx               presentation layout and app state
  screens/                 the app screens
lib/
  fabricRules.ts           fibre, weave, garment, tool and skill rules
  buildConstraints.ts      constraints for one garment, and the rule check
  ideas.ts                 the ideas pipeline (server)
  fallbackIdeas.ts         rule-based idea bank
  sampleGarments.ts        teacher demo samples
  store.ts                 Supabase or local file
  schema.ts, events.ts     data shapes, validated with zod
supabase/migrations/       database table
```

## Privacy

No accounts and no trackers. Photos are resized on the phone, sent once to the AI and never stored or logged. Stored: an anonymous session id, garment, fibre mix, tools, skill, the idea titles shown, ratings, would-try, optional comment and timestamps. No names or emails.
