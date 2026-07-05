# PainSignal

Hackathon project (1-day build). Next.js pages router, API routes as serverless functions,
deployed on Netlify. No database, no auth — stateless single-flow demo.

Pipeline: Exa (search) → Groq/Llama 3.3 70B (diagnose + script, `lib/llm.ts` +
`lib/prompts.ts`) → HeyGen (video, `pages/api/video.ts`). See README.md for the full problem
statement and demo script.

Keep changes minimal — this is a single-day scope, don't add abstractions, auth, or
persistence beyond what's already here.
