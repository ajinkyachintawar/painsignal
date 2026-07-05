import { fetchGithubOpenIssues } from "./github";
import { toSignal } from "./signals";
import { triageSignal } from "./triage";
import { getCases, saveCases, getSettings, incrementScanCount } from "./store";
import type { Case } from "./cases";

const MAX_EXA_RESULTS = 5;
// Groq's free tier has a per-minute token budget shared across all calls. Processing
// sequentially (not in parallel) and capping how many new signals one scan takes on
// keeps us under that limit — the rest get picked up on the next hourly/manual scan.
const MAX_NEW_PER_SCAN = 8;

async function fetchExaRedditHn(companyName: string): Promise<ReturnType<typeof toSignal>[]> {
  const exaRes = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.EXA_API_KEY as string,
    },
    body: JSON.stringify({
      query: `${companyName} complaint OR frustrated OR bug OR issue`,
      numResults: MAX_EXA_RESULTS,
      type: "neural",
      contents: { text: true },
      includeDomains: ["news.ycombinator.com", "reddit.com"],
    }),
  });
  if (!exaRes.ok) return [];
  const data = await exaRes.json();
  const results = (data.results ?? []) as { text?: string }[];
  const openOnly = results.filter((r) => !/state:\s*closed/i.test(r.text ?? ""));
  return openOnly.map((r) => toSignal(r as Parameters<typeof toSignal>[0], companyName));
}

export async function runScan() {
  await incrementScanCount();
  const settings = await getSettings();
  const existing = await getCases();
  const existingIds = new Set(existing.map((c) => c.signal.id));

  const [githubSignals, exaSignals] = await Promise.all([
    fetchGithubOpenIssues(settings.githubOrg, settings.companyName).catch(() => []),
    fetchExaRedditHn(settings.companyName).catch(() => []),
  ]);

  const newSignals = [...githubSignals, ...exaSignals]
    .filter((s) => !existingIds.has(s.id))
    .slice(0, MAX_NEW_PER_SCAN);

  const triaged: Case[] = [];
  for (const s of newSignals) {
    try {
      triaged.push(await triageSignal(s, settings.confidenceThreshold));
    } catch {
      // Skip — not persisted, so it's retried on the next scan instead of being
      // permanently marked as rejected for what was actually an API failure.
    }
  }

  const updated = [...existing, ...triaged];
  await saveCases(updated);
  return { added: triaged.length, total: updated.length };
}
