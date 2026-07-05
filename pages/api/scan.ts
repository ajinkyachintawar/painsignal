import type { NextApiRequest, NextApiResponse } from "next";
import { runScan } from "../../lib/scan";

// Manual "Pull signals now" — runs the exact same scan as the hourly scheduled function.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await runScan();
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "scan failed" });
  }
}
