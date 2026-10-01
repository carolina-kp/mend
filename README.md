# mend. — the rework studio

A fabric-first upcycling prototype built for the FEBD (fashion entrepreneurship) start-up project.

You photograph a garment you no longer wear, say what it's made of and which tools you have, and get **three realistic upcycle ideas** for *that* fabric, *those* tools and *your* skill level. The material decides what is possible: no ironing acrylic, no dyeing polyester, careful with wool.

It is a prototype for testing assumptions with real users, not a production product.

**Live:** https://mend-gilt.vercel.app

- **On a phone:** the app, full screen.
- **On a laptop:** a presentation page with the live app in a phone frame, a screen navigator and the component kit, for pitching.

The full scope is in [SPEC.md](SPEC.md).

---

## Run it locally

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local   # then fill in your key (see below)
npm run dev
```

Open http://localhost:3000. To try it on your phone (same Wi-Fi), run `npm run dev -- -H 0.0.0.0` and open `http://<your-computer's-IP>:3000`.

## Environment variables

| Variable | What it does |
|---|---|
| `LLM_PROVIDER` | `gemini` (default) or `ollama` |
| `LLM_MODEL` | Model name, e.g. `gemini-3.5-flash` |
| `GEMINI_API_KEY` | Free key from https://aistudio.google.com/apikey |
| `OLLAMA_BASE_URL` | Only for Ollama, default `http://localhost:11434` |

`.env.local` is git-ignored. The key is only used on the server and never reaches the browser.

## Switching provider

- **Gemini (default):** set `LLM_PROVIDER=gemini`, `LLM_MODEL=gemini-3.5-flash` and your key. Works on the free tier. If it says "busy", wait a minute; the free tier is rate-limited.
- **Ollama (free, runs on your computer, no internet needed):** install Ollama, run `ollama pull llama3.2-vision`, then set `LLM_PROVIDER=ollama` and `LLM_MODEL=llama3.2-vision`. Slower, and ideas are usually weaker.

## Deploy on Vercel

1. Push the repo to GitHub.
2. On https://vercel.com, click **Add New → Project** and import the repo. The defaults are fine.
3. Under **Environment Variables**, add `LLM_PROVIDER`, `LLM_MODEL` and `GEMINI_API_KEY`.
4. Deploy. Every push to `main` redeploys automatically.

On Vercel, tester feedback is written to the function logs (**Project → Logs**, search `[event]`), not to a file.

---

## How to modify

You should only need these files:

| To change… | Edit |
|---|---|
| Garment types, tools, skill levels, brand name | `lib/config.ts` |
| What the app knows about each fabric (heat, fraying, stretch, dye, felting…) | `lib/fabrics.ts` |
| What the AI is told: rules, tone, output format | `lib/prompt.ts` |
| Colours and fonts | top of `app/globals.css` |

**Add a garment:** add a line to `GARMENTS` in `lib/config.ts`, e.g. `{ id: "coat", label: "Coat" }`.

**Add a fabric:** copy an entry in `FABRICS` in `lib/fabrics.ts`, give it a new id, and fill in the fields in plain English. If it's also a fibre on care labels, add it to `FIBRES` in the same file.

**Edit the prompt:** change the text in `lib/prompt.ts`. Then run the test photo set (see below) to check the ideas got better, not worse.

## Testing the ideas

See [testing/README.md](testing/README.md): run the same 15–20 photos through the app after every prompt change and record the results in a table.

Tester feedback ("Would you try this?") and "Get this done for me" taps are saved to `data/feedback.jsonl` when running locally. Emails typed into the service form are **not** stored.

## Project structure

```
app/
  page.tsx                 the page
  api/suggest/route.ts     the only route that talks to the AI
  api/feedback/route.ts    logs feedback + service interest
components/
  Studio.tsx               presentation layout + app state
  screens/                 the app screens
  ui.tsx                   buttons, rows, chips, steppers
lib/
  config.ts                garments, tools, skills
  fabrics.ts               fabric knowledge
  prompt.ts                AI instructions
  providers/               gemini.ts, ollama.ts
  schema.ts                data shapes, validated with zod
```

## Privacy

Photos are resized on the phone, sent to the AI provider to generate ideas, and never stored or logged. The upload screen asks people not to include faces.
