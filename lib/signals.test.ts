import { test } from "node:test";
import assert from "node:assert/strict";
import { toSignal } from "./signals.ts";

test("toSignal labels known domains", () => {
  const s = toSignal({ url: "https://www.reddit.com/r/foo/comments/abc", text: "hi" }, "ctx");
  assert.equal(s.source, "Reddit");
});

test("toSignal falls back to hostname for unknown domains", () => {
  const s = toSignal({ url: "https://blog.example.com/post", text: "hi" }, "ctx");
  assert.equal(s.source, "blog.example.com");
});

test("toSignal falls back to 'unknown' author when missing", () => {
  const s = toSignal({ url: "https://reddit.com/x", text: "hi" }, "ctx");
  assert.equal(s.author, "unknown");
});

test("toSignal truncates very long text", () => {
  const longText = "a".repeat(3000);
  const s = toSignal({ url: "https://reddit.com/x", text: longText }, "ctx");
  assert.ok(s.text.length <= 2001);
  assert.ok(s.text.endsWith("…"));
});

test("toSignal carries the productContext through", () => {
  const s = toSignal({ url: "https://reddit.com/x", text: "hi" }, "ElevenLabs voice quality");
  assert.equal(s.productContext, "ElevenLabs voice quality");
});
