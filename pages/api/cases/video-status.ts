import type { NextApiRequest, NextApiResponse } from "next";
import { getCases, saveCases } from "../../../lib/store";
import { checkVideoOnce } from "../../../lib/heygen";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string;
  try {
    const cases = await getCases();
    const target = cases.find((c) => c.signal.id === id);
    if (!target) return res.status(404).json({ error: "Case not found" });

    if (target.status !== "video-pending" || !target.heygenVideoId) {
      return res.status(200).json({ status: target.status, videoUrl: target.videoUrl });
    }

    const result = await checkVideoOnce(target.heygenVideoId);

    if (result.status === "completed") {
      const updated = cases.map((c) =>
        c.signal.id === id ? { ...c, status: "video-ready" as const, videoUrl: result.videoUrl! } : c
      );
      await saveCases(updated);
      return res.status(200).json({ status: "video-ready", videoUrl: result.videoUrl });
    }

    if (result.status === "failed") {
      const updated = cases.map((c) =>
        c.signal.id === id ? { ...c, status: "ready" as const, error: "HeyGen render failed" } : c
      );
      await saveCases(updated);
      return res.status(200).json({ status: "ready", error: "HeyGen render failed" });
    }

    res.status(200).json({ status: "video-pending" });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "status check failed" });
  }
}
