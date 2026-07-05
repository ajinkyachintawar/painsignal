import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDiagnosePrompt, buildScriptPrompt } from "./prompts.ts";

test("buildDiagnosePrompt embeds the post and product context", () => {
  const messages = buildDiagnosePrompt("audio is choppy", "voice API streaming");
  assert.equal(messages.length, 2);
  assert.equal(messages[0].role, "system");
  assert.equal(messages[1].role, "user");
  assert.match(messages[1].content, /audio is choppy/);
  assert.match(messages[1].content, /voice API streaming/);
});

test("buildDiagnosePrompt embeds grounding context when provided", () => {
  const messages = buildDiagnosePrompt("audio is choppy", "voice API streaming", "Docs: use the websocket endpoint for streaming.");
  assert.match(messages[1].content, /Docs: use the websocket endpoint/);
});

test("buildDiagnosePrompt omits the grounding block when not provided", () => {
  const messages = buildDiagnosePrompt("audio is choppy", "voice API streaming");
  assert.doesNotMatch(messages[1].content, /Reference material/);
});

test("buildScriptPrompt embeds the original post and the diagnosis", () => {
  const diagnosis = {
    product_area: "streaming latency",
    root_cause: "buffering on the REST endpoint",
    fix: "switch to the websocket streaming endpoint",
  };
  const messages = buildScriptPrompt(diagnosis, "might switch to a competitor");
  assert.equal(messages.length, 2);
  assert.match(messages[1].content, /might switch to a competitor/);
  assert.match(messages[1].content, /websocket streaming endpoint/);
});
