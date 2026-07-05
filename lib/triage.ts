import { callLLM } from "./llm";
import { buildDiagnosePrompt, buildScriptPrompt } from "./prompts";
import type { Signal } from "./signals";
import type { Case, Diagnosis } from "./cases";

// Throws on API/network failure (rate limits, timeouts, etc.) rather than swallowing it
// into a "rejected" case — callers should skip persisting on error so the signal gets
// retried on the next scan, instead of being permanently marked as a bad complaint.
export async function triageSignal(signal: Signal, threshold: number): Promise<Case> {
  const base = {
    signal,
    videoUrl: null,
    heygenVideoId: null,
    error: null,
    createdAt: Date.now(),
  };

  const diagnosis = (await callLLM(buildDiagnosePrompt(signal.text, signal.productContext))) as Diagnosis;

  if (!diagnosis.is_real_complaint || diagnosis.confidence < threshold) {
    return { ...base, status: "rejected", diagnosis, script: null };
  }

  const scriptRes = (await callLLM(buildScriptPrompt(diagnosis, signal.text))) as { script: string };
  return { ...base, status: "ready", diagnosis, script: scriptRes.script };
}
