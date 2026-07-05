import { useState } from "react";
import posts from "../public/demo-posts.json";

type Diagnosis = { product_area: string; root_cause: string; fix: string };
type Stage = "idle" | "diagnosing" | "scripting" | "rendering" | "done";

const STAGES: { key: Stage; label: string }[] = [
  { key: "diagnosing", label: "Detected" },
  { key: "scripting", label: "Diagnosed" },
  { key: "rendering", label: "Scripted" },
  { key: "done", label: "Video ready" },
];

function stageIndex(stage: Stage) {
  return STAGES.findIndex((s) => s.key === stage);
}

export default function Home() {
  const [selected, setSelected] = useState<(typeof posts)[0] | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [script, setScript] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function runPipeline(post: (typeof posts)[0]) {
    setSelected(post);
    setDiagnosis(null);
    setScript(null);
    setVideoUrl(null);
    setSent(false);
    setError(null);
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - start), 200);

    try {
      setStage("diagnosing");
      const diagRes = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postText: post.text, productContext: post.productContext }),
      }).then((r) => r.json());
      if (diagRes.error) throw new Error(diagRes.error);
      setDiagnosis(diagRes);

      setStage("scripting");
      const scriptRes = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosis: diagRes, postText: post.text }),
      }).then((r) => r.json());
      if (scriptRes.error) throw new Error(scriptRes.error);
      setScript(scriptRes.script);

      setStage("rendering");
      const videoRes = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptText: scriptRes.script }),
      }).then((r) => r.json());
      if (videoRes.error) throw new Error(videoRes.error);
      setVideoUrl(videoRes.videoUrl);

      setStage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pipeline failed");
    } finally {
      clearInterval(timer);
    }
  }

  const active = stage !== "idle" ? stageIndex(stage) : -1;

  return (
    <main className="page">
      <header>
        <h1>PainSignal</h1>
        <p className="subtitle">Public complaint &rarr; personalized fix, end to end.</p>
      </header>

      <section>
        <h2>Detected signals</h2>
        <div className="cards">
          {posts.map((p) => (
            <div key={p.id} className={"card" + (selected?.id === p.id ? " card-active" : "")}>
              <div className="card-meta">
                <span className="badge">{p.source}</span>
                <span className="author">{p.author}</span>
              </div>
              <p className="card-text">{p.text}</p>
              <button className="btn" onClick={() => runPipeline(p)}>
                Run pipeline
              </button>
            </div>
          ))}
        </div>
      </section>

      {selected && (
        <section className="pipeline">
          <div className="stepper">
            {STAGES.map((s, i) => (
              <div key={s.key} className={"step" + (i <= active ? " step-done" : "")}>
                <div className="dot" />
                <span>{s.label}</span>
              </div>
            ))}
            {stage !== "idle" && !error && <span className="timer">{(elapsed / 1000).toFixed(1)}s</span>}
          </div>

          {error && (
            <div className="error-banner">
              Pipeline failed: {error}
              <button className="btn" onClick={() => runPipeline(selected)}>
                Retry
              </button>
            </div>
          )}

          <div className="results">
            <div className="result-col">
              <h3>Original complaint</h3>
              <p className="quoted">&ldquo;{selected.text}&rdquo;</p>
            </div>
            <div className="result-col">
              <h3>Agent response</h3>
              {diagnosis && (
                <>
                  <p className="label">Diagnosis</p>
                  <p>{diagnosis.root_cause}</p>
                  <p className="label">Fix</p>
                  <p>{diagnosis.fix}</p>
                </>
              )}
              {script && (
                <>
                  <p className="label">Script</p>
                  <p className="quoted">{script}</p>
                </>
              )}
              {videoUrl && (
                <>
                  <p className="label">Video</p>
                  <video src={videoUrl} controls width={360} />
                </>
              )}
              {stage === "done" && !sent && (
                <button className="btn btn-primary" onClick={() => setSent(true)}>
                  Approve &amp; send
                </button>
              )}
              {sent && <p className="sent-confirm">Sent as reply to {selected.source}.</p>}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
