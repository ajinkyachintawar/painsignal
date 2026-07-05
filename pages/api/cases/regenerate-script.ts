import type { NextApiRequest, NextApiResponse } from "next";
import { getCases } from "../../../lib/store";
import { callLLM } from "../../../lib/llm";
import { buildScriptPrompt } from "../../../lib/prompts";

// Redrafts the reply script from a human-corrected diagnosis. Does not persist
// anything — the caller reviews/edits the returned script before saving.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, root_cause, fix } = req.body as { id: string; root_cause: string; fix: string };
  try {
    const cases = await getCases();
    const target = cases.find((c) => c.signal.id === id);
    if (!target || !target.diagnosis) {
      return res.status(404).json({ error: "Case not found or has no diagnosis yet" });
    }

    const scriptRes = (await callLLM(
      buildScriptPrompt({ product_area: target.diagnosis.product_area, root_cause, fix }, target.signal.text)
    )) as { script: string };

    res.status(200).json({ script: scriptRes.script });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "script regeneration failed" });
  }
}
