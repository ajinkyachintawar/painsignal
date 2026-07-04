import { useState } from "react";
import posts from "../public/demo-posts.json";

type Diagnosis = { product_area: string; root_cause: string; fix: string };

export default function Home() {
  const [selected, setSelected] = useState<(typeof posts)[0] | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [script, setScript] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [stage, setStage] = useState<"idle" | "diagnosing" | "scripting" | "rendering" | "done">("idle");

  async function runPipeline(post: (typeof posts)[0]) {
    setSelected(post);
    setDiagnosis(null);
    setScript(null);
    setVideoUrl(null);

    setStage("diagnosing");
    const diagRes = await fetch("/api/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postText: post.text, productContext: post.productContext }),
    }).then((r) => r.json());
    setDiagnosis(diagRes);

    setStage("scripting");
    const scriptRes = await fetch("/api/script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diagnosis: diagRes, postText: post.text }),
    }).then((r) => r.json());
    setScript(scriptRes.script);

    setStage("rendering");
    const videoRes = await fetch("/api/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scriptText: scriptRes.script }),
    }).then((r) => r.json());
    setVideoUrl(videoRes.videoUrl);

    setStage("done");
  }

  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 720, margin: "40px auto" }}>
      <h1>PainSignal</h1>
      <p>Public complaint → personalized fix, end to end.</p>

      <h3>Detected signals</h3>
      {posts.map((p) => (
        <div key={p.id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 8 }}>
          <b>{p.source}</b> — {p.author}
          <p>{p.text}</p>
          <button onClick={() => runPipeline(p)}>Run pipeline</button>
        </div>
      ))}

      {selected && (
        <div style={{ marginTop: 24 }}>
          <h3>Stage: {stage}</h3>
          {diagnosis && (
            <>
              <h4>Diagnosis</h4>
              <pre>{JSON.stringify(diagnosis, null, 2)}</pre>
            </>
          )}
          {script && (
            <>
              <h4>Script</h4>
              <p>{script}</p>
            </>
          )}
          {videoUrl && (
            <>
              <h4>Video</h4>
              <video src={videoUrl} controls width={480} />
            </>
          )}
        </div>
      )}
    </main>
  );
}
