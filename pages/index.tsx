import { useEffect, useState } from "react";
import { toSignal, type Signal } from "../lib/signals";

type Diagnosis = {
  is_real_complaint: boolean;
  confidence: number;
  product_area: string;
  root_cause: string;
  fix: string;
};

type CaseStatus = "triaging" | "rejected" | "ready" | "video-pending" | "video-ready" | "sent";

type Case = {
  signal: Signal;
  status: CaseStatus;
  diagnosis: Diagnosis | null;
  script: string | null;
  videoUrl: string | null;
  error: string | null;
};

const CONFIDENCE_THRESHOLD = 0.6;

// Pre-verified safety net: always triaged on load so there's something to show
// even if live search is flaky during judging.
const SEED_SIGNAL: Signal = {
  id: "seed-1",
  source: "Reddit",
  author: "u/buildingwithapis",
  text: "Getting charged full credits on ElevenLabs even when the generation glitches out with weird pauses and volume changes. Feels like paying for broken output, no refund path either.",
  productContext: "ElevenLabs text-to-speech billing",
};

export default function Home() {
  const [cases, setCases] = useState<Case[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [query, setQuery] = useState("ElevenLabs voice cloning quality complaint");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  function updateCase(id: string, patch: Partial<Case>) {
    setCases((prev) => prev.map((c) => (c.signal.id === id ? { ...c, ...patch } : c)));
  }

  async function triage(signal: Signal) {
    setCases((prev) => [
      ...prev,
      { signal, status: "triaging", diagnosis: null, script: null, videoUrl: null, error: null },
    ]);

    try {
      const diagnosis = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postText: signal.text, productContext: signal.productContext }),
      }).then((r) => r.json());
      if (diagnosis.error) throw new Error(diagnosis.error);

      if (!diagnosis.is_real_complaint || diagnosis.confidence < CONFIDENCE_THRESHOLD) {
        updateCase(signal.id, { status: "rejected", diagnosis });
        return;
      }

      const scriptRes = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosis, postText: signal.text }),
      }).then((r) => r.json());
      if (scriptRes.error) throw new Error(scriptRes.error);

      updateCase(signal.id, { status: "ready", diagnosis, script: scriptRes.script });
    } catch (e) {
      updateCase(signal.id, {
        status: "rejected",
        error: e instanceof Error ? e.message : "Triage failed",
      });
    }
  }

  useEffect(() => {
    triage(SEED_SIGNAL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch() {
    setSearching(true);
    setSearchError(null);
    try {
      const results = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      }).then((r) => r.json());
      if (results.error) throw new Error(results.error);
      if (!Array.isArray(results) || results.length === 0) {
        setSearchError("No live signals found for this query — try rephrasing it.");
        return;
      }
      for (const r of results) {
        triage(toSignal(r, query));
      }
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function generateVideo(id: string) {
    const target = cases.find((c) => c.signal.id === id);
    if (!target?.script) return;
    updateCase(id, { status: "video-pending", error: null });
    try {
      const videoRes = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptText: target.script }),
      }).then((r) => r.json());
      if (videoRes.error) throw new Error(videoRes.error);
      updateCase(id, { status: "video-ready", videoUrl: videoRes.videoUrl });
    } catch (e) {
      updateCase(id, {
        status: "ready",
        error: e instanceof Error ? e.message : "Video generation failed",
      });
    }
  }

  const visibleCases = cases.filter((c) => c.status !== "rejected");
  const expanded = cases.find((c) => c.signal.id === expandedId) ?? null;

  return (
    <main className="page">
      <header>
        <h1>PainSignal</h1>
        <p className="subtitle">Public complaint &rarr; personalized fix, end to end.</p>
      </header>

      <section>
        <h2>Search for signals</h2>
        <div className="search-row">
          <input
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. ElevenLabs voice cloning quality complaint"
          />
          <button className="btn" onClick={runSearch} disabled={searching}>
            {searching ? "Searching…" : "Search"}
          </button>
        </div>
        {searchError && <div className="error-banner">{searchError}</div>}
      </section>

      <section>
        <h2>Signals</h2>
        <div className="cards">
          {visibleCases.map((c) => (
            <div
              key={c.signal.id}
              className={"card" + (expandedId === c.signal.id ? " card-active" : "")}
              onClick={() => setExpandedId(c.signal.id)}
            >
              <div className="card-meta">
                <span className="badge">{c.signal.source}</span>
                <span className="author">{c.signal.author}</span>
                <span className={"status-pill status-" + c.status}>
                  {statusLabel(c.status)}
                </span>
                {c.diagnosis && (
                  <span className="confidence">
                    {Math.round(c.diagnosis.confidence * 100)}% confidence
                  </span>
                )}
              </div>
              <p className="card-text">{c.signal.text.slice(0, 220)}…</p>
              {c.diagnosis && <p className="card-diagnosis">{c.diagnosis.root_cause}</p>}
            </div>
          ))}
        </div>
      </section>

      {expanded && (
        <section className="pipeline">
          {expanded.error && <div className="error-banner">{expanded.error}</div>}

          <div className="results">
            <div className="result-col">
              <h3>Original complaint</h3>
              <p className="quoted">&ldquo;{expanded.signal.text}&rdquo;</p>
            </div>
            <div className="result-col">
              <h3>Agent response</h3>
              {expanded.diagnosis && (
                <>
                  <p className="label">Diagnosis</p>
                  <p>{expanded.diagnosis.root_cause}</p>
                  <p className="label">Fix</p>
                  <p>{expanded.diagnosis.fix}</p>
                </>
              )}
              {expanded.script && (
                <>
                  <p className="label">Script</p>
                  <p className="quoted">{expanded.script}</p>
                </>
              )}

              {expanded.status === "ready" && (
                <button className="btn btn-primary" onClick={() => generateVideo(expanded.signal.id)}>
                  Generate video
                </button>
              )}
              {expanded.status === "video-pending" && <p className="label">Rendering video…</p>}
              {expanded.videoUrl && (
                <>
                  <p className="label">Video</p>
                  <video src={expanded.videoUrl} controls width={360} />
                </>
              )}
              {expanded.status === "video-ready" && (
                <button
                  className="btn btn-primary"
                  onClick={() => updateCase(expanded.signal.id, { status: "sent" })}
                >
                  Approve &amp; send (simulated)
                </button>
              )}
              {expanded.status === "sent" && (
                <p className="sent-confirm">Sent as reply to {expanded.signal.source} (simulated).</p>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function statusLabel(status: CaseStatus) {
  switch (status) {
    case "triaging":
      return "Triaging…";
    case "ready":
      return "Ready";
    case "video-pending":
      return "Rendering…";
    case "video-ready":
      return "Video ready";
    case "sent":
      return "Sent";
    default:
      return status;
  }
}
