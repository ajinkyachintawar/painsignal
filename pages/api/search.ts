import type { NextApiRequest, NextApiResponse } from "next";

// Exa search — finds public developer complaints matching a product pain point.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query } = req.body;

  const exaRes = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.EXA_API_KEY as string,
    },
    body: JSON.stringify({
      query,
      numResults: 5,
      type: "neural",
      contents: { text: true },
      includeDomains: ["github.com", "news.ycombinator.com"],
    }),
  });

  if (!exaRes.ok) {
    return res.status(exaRes.status).json({ error: await exaRes.text() });
  }
  const data = await exaRes.json();
  // Skip closed/resolved GitHub issues — a stale "already fixed" complaint reads
  // as fake urgency and the real fix is often buried in maintainer comments we don't parse.
  const openOnly = data.results.filter(
    (r: { text?: string }) => !/state:\s*closed/i.test(r.text ?? "")
  );
  res.status(200).json(openOnly);
}
