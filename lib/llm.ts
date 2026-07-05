// Groq's OpenAI-compatible endpoint — plain fetch, no SDK needed.
// Falls back to a second account's key only on rate-limit errors (429) — other
// errors (bad auth, malformed request) fail immediately rather than wasting the
// fallback key on a request that would fail there too.
const GROQ_KEYS = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_FALLBACK].filter(Boolean) as string[];

export async function callLLM(messages: { role: string; content: string }[]) {
  let lastError: Error | null = null;

  for (const key of GROQ_KEYS) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        response_format: { type: "json_object" },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return JSON.parse(data.choices[0].message.content);
    }
    lastError = new Error(`Groq error ${res.status}: ${await res.text()}`);
    if (res.status !== 429) throw lastError;
  }

  throw lastError;
}
