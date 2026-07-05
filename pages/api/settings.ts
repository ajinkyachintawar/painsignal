import type { NextApiRequest, NextApiResponse } from "next";
import { getSettings, saveSettings } from "../../lib/store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "POST") {
      const updated = await saveSettings(req.body);
      return res.status(200).json(updated);
    }
    const settings = await getSettings();
    res.status(200).json(settings);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "settings failed" });
  }
}
