import type { NextApiRequest, NextApiResponse } from "next";
import { getCases, saveCases } from "../../../lib/store";

// Lets a human correct a diagnosis or script before it's sent. This is the
// correction path: the model's output is a draft, not a final answer, and a
// human catching a wrong root cause/fix should be able to fix it in place
// rather than being stuck approving something they know is wrong.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, root_cause, fix, script } = req.body;
  try {
    const cases = await getCases();
    const updated = cases.map((c) => {
      if (c.signal.id !== id) return c;
      return {
        ...c,
        diagnosis: c.diagnosis
          ? { ...c.diagnosis, root_cause: root_cause ?? c.diagnosis.root_cause, fix: fix ?? c.diagnosis.fix }
          : c.diagnosis,
        script: script ?? c.script,
        edited: true,
      };
    });
    await saveCases(updated);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "failed to update case" });
  }
}
