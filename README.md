# PainSignal

An autonomous agent that finds real, public developer complaints about a company's
product, diagnoses the root cause, drafts a personalized reply, and prepares a short
video response for human approval before anything is sent.

Built at Cursor Hackathon Dublin (July 2026), using Exa, Groq, HeyGen, and Netlify.

Repository: github.com/ajinkyachintawar/painsignal

Live app: https://painsignal.netlify.app/

Link to presentation: https://gamma.app/docs/PainSignal-ccilalo8rx1dvny

---

## 1. Introduction

PainSignal watches a company's GitHub issues, Reddit, and Hacker News for real,
unresolved complaints about that company's product. For every complaint it finds, it
automatically:

1. Decides whether it is a genuine, specific, currently-unresolved technical complaint
   (not spam, not a feature request, not already fixed).
2. Diagnoses the likely root cause and a concrete fix, grounded in real documentation
   and prior resolutions where available, not just guesswork.
3. Drafts a short, personalized reply script that references the complaint directly.
4. On a human's request, generates a short AI-avatar video delivering that reply.
5. Waits for explicit human approval before marking anything as sent. Nothing is
   posted automatically anywhere.

The result is a live dashboard that looks and behaves like a real support/DevRel
product: a queue of triaged complaints, confidence scores, diagnoses, drafted replies,
and a one-click path to a personalized video response, all running against a real,
configurable target company rather than a fixed demo dataset.

## 2. Problem Statement

Early-stage AI and API companies do not have a lead-generation problem. They have a
response problem.

Developers are, at any given moment, publicly describing the exact technical pain a
company's product causes them, on GitHub issues, Hacker News, and Reddit. This is the
highest-intent signal a company can get: a real user, describing a real problem, in
public, often before deciding whether to keep using the product or switch to a
competitor. Almost nobody is watching for this in real time, and almost nobody can
respond with something specific enough to matter before the person gives up.

The standard answer to "GTM for developer tools" is outbound: cold email, LinkedIn
sequences, AI SDR tools that generate generic messages at scale. Developers are
unusually resistant to this. What actually works for a technical audience is the
opposite of a templated pitch: showing up with the exact fix to the exact problem
someone just described, in their own words, fast enough that it still matters.

Nobody has fully closed this loop end to end: detect the complaint, diagnose the
actual issue, and deliver a personalized, credible response, fast enough to be useful
and cheap enough to run continuously. That is the gap PainSignal targets.

## 3. Why This Is Useful, and Where

PainSignal is built for any company whose product has a public developer-facing
surface: an API, an SDK, a CLI, an integration, a plugin. Concretely, that means:

- Developer-tool and API companies (the sponsor companies at this hackathon are a
  good example: Cursor, HeyGen, ElevenLabs, Exa, Wispr Flow, Netlify, fal.ai, and
  Alibaba Qwen all fit this profile).
- Any company running open-source SDKs or CLIs on GitHub, where issues are the
  primary channel for reporting real problems.
- DevRel and developer-support teams who currently rely on manually watching GitHub
  notifications, Reddit, and Hacker News, which does not scale past a handful of
  people checking a handful of channels a few times a day.

Where it fits in a real organization: this is a tool for a DevRel, developer support,
or growth engineering team, not a fully autonomous customer-facing system. It is
explicitly designed as a triage and drafting assistant with a human approval gate,
not a bot that posts on a company's behalf. The pitch is "give your team a
always-on first pass over public complaints," not "replace your support team."

The current working demo targets ElevenLabs (github.com/elevenlabs) as a concrete,
real example, but the target company is a configuration value, not something hardcoded
into the product. Any company with a GitHub org can be plugged in from the Settings
page.

## 4. How It Works: The Pipeline

### Detection

- GitHub: PainSignal calls GitHub's own Issues API directly against the configured
  company's GitHub organization, pulling all currently open issues across that
  organization's most active repositories. This is comprehensive and reliable: it is
  not dependent on a search engine deciding a given issue is relevant, it simply reads
  every open issue.
- Reddit and Hacker News: PainSignal uses Exa's search API, scoped to those two
  domains, since there is no equivalent direct issues API for public forum
  discussions.

### Triage

Every newly detected signal is automatically passed to a large language model (Groq,
running Llama 3.3 70B) which is asked two things: is this a genuine, specific,
currently unresolved complaint, and if so, what is the likely root cause and fix. The
model also returns a confidence score between 0 and 1.

This confidence score is the model's own self-assessment of how certain it is that the
post is a real, actionable complaint. It is not a calibrated statistical accuracy
measure, and PainSignal does not claim it is. It functions as a cheap, fast triage
filter: signals below a configurable confidence threshold (default 0.6) are filtered
out automatically before any further, more expensive processing happens.

### Grounded diagnosis

Before generating a diagnosis, PainSignal runs an additional retrieval step: it
searches for real documentation, changelogs, or previously resolved discussions of the
same problem, and feeds that material into the model as reference context. The model
is instructed to base its root cause and fix on that real material when it is
relevant, and to say explicitly whether it did so.

This matters because, without it, the model's fix is generated purely from its own
general pretrained knowledge, applied to the complaint text, with no way to know
whether that fix is actually correct for this specific product. In a side by side test
on a real GitHub issue (an ElevenLabs API returning a 401 error inside an n8n
integration node), the ungrounded diagnosis defaulted to generic troubleshooting
advice implying user error. The grounded version, after retrieving three independent
real reports of the same 401/403 problem from other users, correctly identified this
as a likely systemic authentication issue rather than a one-off misconfiguration, a
meaningfully more specific and more useful answer.

This retrieval step also has to defend against two concrete failure modes that were
found and fixed during development: the search sometimes returns the exact same post
being diagnosed as its own "source," and it sometimes returns pages where the content
extraction failed and returned page-navigation boilerplate instead of the actual
discussion. Both are filtered out before the retrieved material reaches the model.

### Script and video

Once a signal passes triage, a second model call drafts a short, spoken-style reply
script that references the original complaint directly rather than in generic
templated language. Generating the actual video is a separate, manually triggered
step, not automatic, so that the more expensive video-generation step is only spent on
complaints a human has actually decided are worth a video reply. The video is
generated with HeyGen, using an avatar and voice pairing configured for this
deployment.

### Approval and send

A human reviews the original complaint, the diagnosis, the drafted script, and the
generated video together in one panel, then explicitly approves before the signal is
marked as sent. In this build, "send" is simulated: it does not post anything to
GitHub, Reddit, or Hacker News. Building real posting was a deliberate scope decision,
not a technical limitation: automatically posting to a real, public discussion that a
company does not yet have authority over was judged to be a real-world risk (spamming
uninvolved third parties, looking like an automated stunt rather than genuine support)
rather than something to demo live.

## 5. Architecture

PainSignal runs as a Next.js application deployed on Netlify, with a persistent
backend rather than a browser-only demo.

- Frontend: a four-page dashboard (Signals, Analytics, Integrations, Settings),
  server-rendered data, dark and light themes, a slide-in detail panel per complaint.
- Backend storage: Netlify Blobs stores the current list of triaged complaints and the
  active configuration (target company, GitHub org, confidence threshold), so state
  survives page reloads and is shared across anyone visiting the dashboard, not held
  only in one browser tab.
- Background scanning: a Netlify Scheduled Function runs the full detection and
  triage pipeline once an hour automatically, independent of whether anyone has the
  dashboard open. A manual "Pull signals now" button in the dashboard runs the exact
  same scan on demand.
- Language model: Groq, running Llama 3.3 70B, used for triage, grounded diagnosis,
  and script drafting.
- Search and retrieval: Exa, used both for detecting Reddit/Hacker News signals and
  for the grounding retrieval step before diagnosis.
- Detection of GitHub issues: GitHub's public REST API, called directly.
- Video generation: HeyGen, called asynchronously (a short call starts the render,
  a separate lightweight status check is polled from the browser every few seconds
  until it completes), because the underlying serverless functions cannot stay open
  for the full multi-minute render time a synchronous call would need.

All of the numbers shown on the dashboard, including complaints processed, average
confidence, source breakdown, triage funnel, and API usage counters, are computed from
the real underlying data and real call counts. None of it is placeholder or
illustrative data.

## 6. What Makes This Different

- Reactive, not cold outbound. It responds to a real, already-public complaint at the
  moment it happens, rather than generating a cold message to someone who has not
  expressed a problem.
- Grounded, not just plausible. The diagnosis step is designed to be checked against
  real source material before being trusted, and the dashboard is explicit about
  whether a given fix was actually grounded or is the model's general reasoning.
- Genuinely continuous. The detection and triage pipeline runs on a schedule in the
  background, not only when someone opens the dashboard and clicks a button.
  Continuous coverage was treated as a real requirement, not a demo simplification.
  Configurable by company, not built around a single hardcoded target. Retargeting the
  entire pipeline at a different company is a settings change, not a code change.
- Human approval is a structural guarantee, not a toggle. Nothing generated by the
  system is ever sent without an explicit human action, and that is enforced in the
  product, not just described in the pitch.

## 7. Honest Limitations

These are stated directly rather than smoothed over, since they matter for evaluating
the product honestly:

- Confidence scores are the model's own self-reported certainty, not a measured,
  calibrated accuracy rate.
- Grounded diagnoses depend entirely on whether the retrieval step finds genuinely
  relevant, cleanly extracted material. When it does not, the system falls back to
  the model's general reasoning and says so honestly rather than pretending otherwise.
- "Send" is simulated in this build. Real posting to GitHub, Reddit, or Hacker News on
  a company's behalf was scoped out deliberately and would require the company's own
  authenticated accounts and explicit authorization to do responsibly.
- The system currently only reads GitHub issues and Reddit/Hacker News posts. It does
  not currently cover other channels such as X/Twitter, Discord, or support tickets.
- Video generation is a paid, metered step (HeyGen render minutes), so it is
  deliberately kept as a manual, human-triggered action rather than automatic for
  every triaged complaint.

## 8. Tech Stack

| Layer | Technology |
|---|---|
| Frontend/backend framework | Next.js (pages router), deployed on Netlify |
| Persistent storage | Netlify Blobs |
| Scheduled background jobs | Netlify Scheduled Functions (hourly) |
| Language model | Groq (Llama 3.3 70B) |
| Search and retrieval | Exa |
| Issue detection | GitHub REST API |
| Video generation | HeyGen |
| Testing | Node's built-in test runner (node --test) |

## 9. Setup

```
npm install
cp .env.example .env.local
```

Fill in `.env.local` with real API keys: `EXA_API_KEY`, `GROQ_API_KEY`,
`HEYGEN_API_KEY`, `HEYGEN_AVATAR_ID`, `HEYGEN_VOICE_ID`. `GITHUB_TOKEN` is optional but
recommended, since it raises GitHub's API rate limit from 60 to 5,000 requests per
hour.

Local development requires the Netlify CLI, not the plain Next.js dev server, since
Netlify Blobs and Scheduled Functions need Netlify's runtime context:

```
npx netlify-cli dev
```

Automated tests:

```
npm test
```

## 10. Deployment

The project deploys to Netlify. Environment variables must be set in the Netlify
site's dashboard under Site settings, Environment variables, using the same keys as
`.env.local`. Once deployed, the scheduled function begins running automatically on
an hourly cycle with no further action required.

## 11. Current Configuration

Target company: ElevenLabs (github.com/elevenlabs). This is a configuration value set
on the Settings page and stored in Netlify Blobs, not a hardcoded constant, and can be
changed to any other company with a public GitHub organization.

## 12. Team

Ajinkya, Charan, Divya using Cursor and Claude Code for development.
