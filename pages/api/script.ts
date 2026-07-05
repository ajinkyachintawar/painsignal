import type { NextApiRequest, NextApiResponse } from "next";
import { callLLM } from "../../lib/llm";
import { buildScriptPrompt } from "../../lib/prompts";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { diagnosis, postText } = req.body;
    const script = await callLLM(buildScriptPrompt(diagnosis, postText));
    res.status(200).json(script);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "script failed" });
  }
}
