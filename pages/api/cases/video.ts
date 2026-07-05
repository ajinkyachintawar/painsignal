import type { NextApiRequest, NextApiResponse } from "next";
import { getCases, saveCases } from "../../../lib/store";
import { generateVideo } from "../../../lib/heygen";

// Kicks off HeyGen generation and returns immediately — does not wait for the
// render to finish. The client polls /api/cases/video-status for completion.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.body;
  try {
    const cases = await getCases();
    const target = cases.find((c) => c.signal.id === id);
    if (!target || !target.script) {
      return res.status(404).json({ error: "Case not found or has no script yet" });
    }

    const heygenVideoId = await generateVideo(target.script);
    const updated = cases.map((c) =>
      c.signal.id === id ? { ...c, status: "video-pending" as const, heygenVideoId, error: null } : c
    );
    await saveCases(updated);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "video generation failed to start" });
  }
}
