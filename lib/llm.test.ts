import { test } from "node:test";
import assert from "node:assert/strict";

// callLLM reads GROQ_API_KEY / GROQ_API_KEY_FALLBACK once at module load, so
// they must be set before the dynamic import below.
process.env.GROQ_API_KEY = "primary-key";
process.env.GROQ_API_KEY_FALLBACK = "fallback-key";

const { callLLM } = await import("./llm.ts");

function authHeader(init: RequestInit | undefined): string {
  return (init?.headers as Record<string, string>).Authorization;
}

test("falls back to the second key when the first is rate-limited", async () => {
  const calls: string[] = [];
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    const auth = authHeader(init);
    calls.push(auth);
    if (auth === "Bearer primary-key") {
      return new Response("rate limited", { status: 429 });
    }
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ ok: true }) } }] }), {
      status: 200,
    });
  }) as typeof fetch;

  const result = await callLLM([{ role: "user", content: "hi" }]);

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(calls, ["Bearer primary-key", "Bearer fallback-key"]);
});

test("does not waste the fallback key on a non-rate-limit error", async () => {
  const calls: string[] = [];
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    calls.push(authHeader(init));
    return new Response("bad request", { status: 400 });
  }) as typeof fetch;

  await assert.rejects(() => callLLM([{ role: "user", content: "hi" }]), /Groq error 400/);
  assert.deepEqual(calls, ["Bearer primary-key"]);
});
