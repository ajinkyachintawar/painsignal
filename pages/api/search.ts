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
      includeDomains: ["reddit.com", "news.ycombinator.com", "github.com"],
    }),
  });

  if (!exaRes.ok) {
    return res.status(exaRes.status).json({ error: await exaRes.text() });
  }
  const data = await exaRes.json();
  res.status(200).json(data.results);
}
