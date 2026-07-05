// Compares ungrounded vs. grounded diagnosis on the same real complaint, using the
// actual lib/ modules (not a duplicated copy), so this stays honest as those evolve.
// Usage: node scripts/compare-diagnosis.mjs (requires EXA_API_KEY + GROQ_API_KEY in .env.local)
import fs from "fs";
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const idx = line.indexOf("=");
  if (idx === -1) continue;
  const key = line.slice(0, idx).trim();
  const value = line.slice(idx + 1).trim();
  if (key && !process.env[key]) process.env[key] = value;
}

const { callLLM } = await import("../lib/llm.ts");
const { buildDiagnosePrompt } = await import("../lib/prompts.ts");
const { fetchGroundingContext } = await import("../lib/ground.ts");

const COMPLAINT_URL = "https://github.com/elevenlabs/elevenlabs-n8n/issues/28";
const COMPLAINT = `# Always getting 401 error for text to speech operation

I'm always getting a 401 error even though I have a working credential with an unrestricted API key.

n8n community node version is 0.2.2`;

const COMPANY = "ElevenLabs";

async function main() {
  console.log("=== UNGROUNDED (current behavior) ===");
  const ungrounded = await callLLM(buildDiagnosePrompt(COMPLAINT, COMPANY));
  console.log(JSON.stringify(ungrounded, null, 2));

  console.log("\n=== Fetching grounding context via Exa (excluding the signal's own URL, filtering extraction failures) ===");
  const grounding = await fetchGroundingContext(COMPANY, "401 error text to speech API key n8n", COMPLAINT_URL);
  console.log(grounding ? grounding : "(no usable grounding material found)");

  console.log("\n=== GROUNDED ===");
  const grounded = await callLLM(buildDiagnosePrompt(COMPLAINT, COMPANY, grounding));
  console.log(JSON.stringify(grounded, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
