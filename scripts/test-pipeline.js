// Quick end-to-end smoke test against a local `npm run dev` server.
// Usage: npm run test:pipeline
const BASE = "http://localhost:3000";

async function main() {
  const post = {
    text: "Getting choppy audio when streaming TTS at high concurrency, might switch to a competitor.",
    productContext: "AI voice API, streaming text-to-speech",
  };

  console.log("1. diagnose...");
  const diagnosis = await fetch(`${BASE}/api/diagnose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postText: post.text, productContext: post.productContext }),
  }).then((r) => r.json());
  console.log(diagnosis);

  console.log("2. script...");
  const script = await fetch(`${BASE}/api/script`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ diagnosis, postText: post.text }),
  }).then((r) => r.json());
  console.log(script);

  console.log("3. video (this one takes a minute or two)...");
  const video = await fetch(`${BASE}/api/video`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scriptText: script.script }),
  }).then((r) => r.json());
  console.log(video);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
