import type { NextApiRequest, NextApiResponse } from "next";
import { callLLM } from "../../lib/llm";
import { buildDiagnosePrompt } from "../../lib/prompts";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { postText, productContext } = req.body;
    const diagnosis = await callLLM(buildDiagnosePrompt(postText, productContext));
    res.status(200).json(diagnosis);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "diagnose failed" });
  }
}
