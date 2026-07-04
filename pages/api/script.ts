import type { NextApiRequest, NextApiResponse } from "next";
import { callQwen } from "../../lib/qwen";
import { buildScriptPrompt } from "../../lib/prompts";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { diagnosis, postText } = req.body;
  const script = await callQwen(buildScriptPrompt(diagnosis, postText));
  res.status(200).json(script);
}
