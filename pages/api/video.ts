import type { NextApiRequest, NextApiResponse } from "next";
import { renderReplyVideo } from "../../lib/heygen";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { scriptText } = req.body;
    const videoUrl = await renderReplyVideo(scriptText);
    res.status(200).json({ videoUrl });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "video failed" });
  }
}
