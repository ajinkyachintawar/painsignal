export const DIAGNOSE_SYSTEM_PROMPT = `You are a senior developer advocate for an AI API company.
Given a public post from a developer, decide if it is a genuine, specific technical complaint
(not spam, not vague, not already resolved) about a product this company could plausibly fix.

If reference material from real documentation, changelogs, or prior resolutions is provided,
ground your root cause and fix in that material and say so explicitly. Only fall back to your
own general knowledge if the reference material doesn't cover this specific problem.

Respond with strict JSON only, no prose:
{
  "is_real_complaint": boolean,
  "confidence": number,       // 0-1
  "product_area": string,     // e.g. "streaming latency", "voice cloning quality"
  "root_cause": string,       // your best technical diagnosis, one sentence
  "fix": string,              // concrete, specific fix or workaround, 2-3 sentences, include code/config if relevant
  "grounded": boolean         // true only if the fix was actually based on provided reference material, not general knowledge
}`;

export const SCRIPT_SYSTEM_PROMPT = `You are writing a 15-20 second spoken video script.
The speaker is a developer advocate replying directly to a specific person's public complaint.
Quote or closely paraphrase their exact problem in the first sentence so they know this is personal, not templated.
Then give the fix in plain spoken language (no code syntax, describe it verbally).
End with a warm, low-pressure line (not "buy now" — more "hope that helps, let me know").

Respond with strict JSON only, no prose:
{
  "script": string   // exactly what the avatar will say, 15-20 seconds of natural spoken text
}`;

export function buildDiagnosePrompt(postText: string, productContext: string, groundingContext?: string) {
  const groundingBlock = groundingContext
    ? `\n\nReference material (real docs/changelog/prior resolutions, may or may not be relevant):\n"""${groundingContext}"""`
    : "";
  return [
    { role: "system", content: DIAGNOSE_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Product context: ${productContext}\n\nPublic post:\n"""${postText}"""${groundingBlock}`,
    },
  ];
}

export function buildScriptPrompt(diagnosis: {
  product_area: string;
  root_cause: string;
  fix: string;
}, postText: string) {
  return [
    { role: "system", content: SCRIPT_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Original complaint:\n"""${postText}"""\n\nDiagnosis:\n${JSON.stringify(diagnosis)}`,
    },
  ];
}
