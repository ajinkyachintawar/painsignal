import type { Signal } from "./signals";

const MAX_REPOS = 12;
const MAX_ISSUES_PER_REPO = 10;

function ghHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

type GhRepo = { name: string; open_issues_count: number };
type GhIssue = {
  html_url: string;
  title: string;
  body: string | null;
  user: { login: string } | null;
  pull_request?: unknown;
  state: string;
};

export async function fetchGithubOpenIssues(org: string, companyName: string): Promise<Signal[]> {
  const reposRes = await fetch(`https://api.github.com/orgs/${org}/repos?per_page=100&sort=updated`, {
    headers: ghHeaders(),
  });
  if (!reposRes.ok) throw new Error(`GitHub org lookup failed: ${reposRes.status} ${await reposRes.text()}`);
  const repos = (await reposRes.json()) as GhRepo[];

  const topRepos = repos
    .filter((r) => r.open_issues_count > 0)
    .sort((a, b) => b.open_issues_count - a.open_issues_count)
    .slice(0, MAX_REPOS);

  const signals: Signal[] = [];
  for (const repo of topRepos) {
    const issuesRes = await fetch(
      `https://api.github.com/repos/${org}/${repo.name}/issues?state=open&per_page=${MAX_ISSUES_PER_REPO}&sort=created&direction=desc`,
      { headers: ghHeaders() }
    );
    if (!issuesRes.ok) continue;
    const issues = (await issuesRes.json()) as GhIssue[];
    for (const issue of issues) {
      if (issue.pull_request) continue;
      signals.push({
        id: issue.html_url,
        source: "GitHub",
        author: issue.user?.login ?? "unknown",
        text: `# ${issue.title}\n\n${(issue.body ?? "").slice(0, 1500)}`,
        productContext: companyName,
      });
    }
  }
  return signals;
}
