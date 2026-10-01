# Spec — Fabric-first upcycle engine (FEBD prototype)

A mobile-first web app prototype for a university start-up project (FEBD, fashion entrepreneurship), built to test assumptions with real users. Not a production product. Small, readable, easy for a student to modify.

## Core idea
The user photographs a garment, says what it's made of and which tools they own, and gets upcycle ideas realistic for **that fabric, those tools, their skill level**. Fabric comes first.

## Scope
1. Garment type: sweater, jeans, shirt, skirt, dress (config: `lib/config.ts`).
2. Garment photo (camera or gallery). Optional — ideas still work from the answers alone.
3. Fabric: care label photo (AI reads fibre %s, user confirms) **or** pick fibres and set % by hand. The mix maps to a fabric profile (`lib/fabrics.ts`).
4. Tools checklist (optional; nothing ticked = no tools).
5. Skill level: beginner, intermediate, advanced.
6. Results: exactly 3 ideas — name, difficulty 1–5, time, materials, steps, one-line "why this works for this fabric".
7. Mocked "Get this done for me": collects email + note, stores **nothing**; only logs that interest happened.
8. Feedback after results: "Would you try this?" yes/maybe/no + optional comment, logged to `data/feedback.jsonl` (local) or the server log (Vercel).

## Amendments agreed during the build
- Skirt and dress added as garments.
- Fabric entered as fibre percentages instead of a single dropdown.
- UI is a 1:1 port of the Figma Make design "Fashion Upcycling Mobile App". On a laptop it shows a **presentation website** (intro, live phone, screen navigator, component sheet) for pitching; on a phone it's just the app.
- Navigator can jump to any screen; results reached that way show labelled sample ideas.
- Brand name "mend." is a placeholder (`APP_NAME` in `lib/config.ts`).
- No paid features (AI image previews were dropped because they need billing).

## Out of scope
Accounts, login, payments, database, real tailor marketplace, barcode scanning, social features, native apps. Future hooks are marked `// FUTURE:`.

## Architecture rules
- Next.js App Router + TypeScript + Tailwind; deploy on Vercel; secrets in env vars only.
- AI calls go through `app/api/suggest/route.ts` only; the API key never reaches the browser. (`app/api/feedback/route.ts` only logs feedback, no AI.)
- Providers in `lib/providers/` (`gemini.ts`, `ollama.ts`) behind `generateSuggestions(input)`, chosen by `LLM_PROVIDER`; model from `LLM_MODEL`.
- Prompt in `lib/prompt.ts`; fabric knowledge in `lib/fabrics.ts`; options in `lib/config.ts`.
- Model returns JSON validated with zod; retry once, then a friendly error.
- Images resized client-side to 1024px; never stored or logged.
- Rate-limit and overload errors show "try again in a minute"; per-IP in-memory limit; 45s timeout.
- Upload screen tells users photos go to an AI provider and not to include faces.

## Definition of done
A tester on a phone completes the flow in under two minutes and gets three sensible, fabric-aware ideas; the founder can change the prompt, fabrics or garments by editing only the files above.
