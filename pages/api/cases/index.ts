import type { NextApiRequest, NextApiResponse } from "next";
import { getCases } from "../../../lib/store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const cases = await getCases();
    res.status(200).json(cases);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "failed to load cases" });
  }
}
