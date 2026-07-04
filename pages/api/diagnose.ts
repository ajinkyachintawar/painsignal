import type { NextApiRequest, NextApiResponse } from "next";
import { callQwen } from "../../lib/qwen";
import { buildDiagnosePrompt } from "../../lib/prompts";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { postText, productContext } = req.body;
  const diagnosis = await callQwen(buildDiagnosePrompt(postText, productContext));
  res.status(200).json(diagnosis);
}
