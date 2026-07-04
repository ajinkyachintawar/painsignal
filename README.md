# PainSignal

Public complaint → personalized fix, in under 60 seconds. Built for Cursor Hackathon Dublin.

## Problem

Early-stage AI/API companies don't have a lead problem — they have a *response* problem.
Developers are, right now, publicly posting on Reddit, Hacker News, GitHub issues, and X
about the exact technical pain a product solves. That's the highest-intent GTM signal there
is, and it's ignored, because nobody's watching for it in real time and nobody can
personalize a response fast enough to matter before the person churns to a competitor.

PainSignal closes that loop: detect the complaint (Exa) → diagnose the real issue and fix
(Qwen) → generate a personalized script (Qwen) → deliver it as a short video (HeyGen +
ElevenLabs) → a human approves before anything sends.

## Team

Looking for 1–2 people: someone comfortable wiring APIs (Exa/Qwen/HeyGen/ElevenLabs) and
someone who can move fast on frontend/demo polish. No fixed roles.

## Setup

```
npm install
cp .env.example .env.local   # fill in API keys
npm run dev
```

Visit `localhost:3000`, edit `public/demo-posts.json` with 2–3 real posts found via Exa
before the demo (don't rely on live search finding a good one on stage).

Quick pipeline smoke test without the browser: `npm run test:pipeline`.

## Deploy

```
npx netlify-cli init      # link/create the Netlify site
npx netlify-cli env:set EXA_API_KEY ...      # repeat for each key in .env.example
npx netlify-cli deploy --prod
```

## Known gotcha

HeyGen needs a public `audio_url` for a custom voice. ElevenLabs' TTS returns raw bytes,
not a URL — true ElevenLabs-voice lip-sync needs an upload step (e.g. Supabase Storage) in
between. Default path in `pages/api/video.ts` uses HeyGen's own voice catalog so the
pipeline works end to end without that extra hop; swap in ElevenLabs audio if there's time.

## Demo script (60–90s)

1. "Developers are publicly stuck on these products right now, and nobody's responding fast enough."
2. Show a real pulled post → agent flags + diagnoses it on screen.
3. Cut to the generated video answering that exact person.
4. "Full pipeline, sub-60-seconds, human approves before send."
