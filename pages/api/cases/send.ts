import type { NextApiRequest, NextApiResponse } from "next";
import { getCases, saveCases } from "../../../lib/store";

// Marks a case as sent. Simulated only — does not post anything to GitHub/Reddit/HN.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.body;
  try {
    const cases = await getCases();
    const updated = cases.map((c) => (c.signal.id === id ? { ...c, status: "sent" as const } : c));
    await saveCases(updated);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "failed to mark sent" });
  }
}
