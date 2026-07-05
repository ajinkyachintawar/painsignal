import { useEffect, useState } from "react";
import { css } from "../lib/cssString";
import { toSignal, type Signal } from "../lib/signals";
import type { Case, Diagnosis } from "../lib/cases";
import { CaseStatus, FONT, Mode, THEMES } from "../lib/theme";
import type { ApiStatus } from "../lib/status";
import { Sidebar } from "../components/Sidebar";
import { SignalsView, type ApiUsage } from "../components/SignalsView";
import { AnalyticsView } from "../components/AnalyticsView";
import { IntegrationsView } from "../components/IntegrationsView";
import { SettingsView } from "../components/SettingsView";
import { DetailDrawer } from "../components/DetailDrawer";

type Page = "signals" | "analytics" | "integrations" | "settings";

const PAGE_META: Record<Page, { title: string; subtitle: string }> = {
  signals: { title: "Signals", subtitle: "Public complaints, triaged and drafted for reply" },
  analytics: { title: "Analytics", subtitle: "Trends across triage, confidence, and response volume" },
  integrations: { title: "Integrations", subtitle: "Data sources and providers powering PainSignal" },
  settings: { title: "Settings", subtitle: "Approval policy, team, and plan" },
};

const SEED_SIGNAL: Signal = {
  id: "seed-1",
  source: "Reddit",
  author: "u/buildingwithapis",
  text: "Getting charged full credits on ElevenLabs even when the generation glitches out with weird pauses and volume changes. Feels like paying for broken output, no refund path either.",
  productContext: "ElevenLabs text-to-speech billing",
};

export default function Home() {
  const [mode, setMode] = useState<Mode>("dark");
  const [page, setPage] = useState<Page>("signals");
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("ElevenLabs voice cloning quality complaint");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<CaseStatus | "all">("all");
  const [sortKey, setSortKey] = useState<"confidence" | "status" | "time">("time");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [apiUsage, setApiUsage] = useState<ApiUsage>({ search: 0, llm: 0, video: 0 });
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.6);
  const [now, setNow] = useState(() => Date.now());

  const theme = THEMES[mode];

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setApiStatus)
      .catch(() => setApiStatus({ exa: false, groq: false, heygen: false }));
  }, []);

  function updateCase(id: string, patch: Partial<Case>) {
    setCases((prev) => prev.map((c) => (c.signal.id === id ? { ...c, ...patch } : c)));
  }

  async function triage(signal: Signal, threshold: number) {
    setCases((prev) => [
      ...prev,
      { signal, status: "triaging", diagnosis: null, script: null, videoUrl: null, error: null, createdAt: Date.now() },
    ]);

    try {
      setApiUsage((u) => ({ ...u, llm: u.llm + 1 }));
      const diagnosis: Diagnosis = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postText: signal.text, productContext: signal.productContext }),
      }).then((r) => r.json());
      if ((diagnosis as unknown as { error?: string }).error) {
        throw new Error((diagnosis as unknown as { error: string }).error);
      }

      if (!diagnosis.is_real_complaint || diagnosis.confidence < threshold) {
        updateCase(signal.id, { status: "rejected", diagnosis });
        return;
      }

      setApiUsage((u) => ({ ...u, llm: u.llm + 1 }));
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
    triage(SEED_SIGNAL, confidenceThreshold);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch() {
    setSearching(true);
    setSearchError(null);
    try {
      setApiUsage((u) => ({ ...u, search: u.search + 1 }));
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
        triage(toSignal(r, query), confidenceThreshold);
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
      setApiUsage((u) => ({ ...u, video: u.video + 1 }));
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

  const selected = cases.find((c) => c.signal.id === selectedId) ?? null;
  const visibleCount = cases.filter((c) => c.status !== "rejected").length;

  return (
    <div style={css(`display:flex; width:100%; height:100vh; min-height:760px; background:${theme.bg}; font-family:${FONT}; color:${theme.textPrimary}; overflow:hidden;`)}>
      <style>{`@keyframes ps-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } body { margin: 0; }`}</style>

      <Sidebar
        theme={theme}
        mode={mode}
        page={page}
        signalCount={visibleCount}
        onNavigate={(p) => setPage(p)}
        onToggleMode={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
      />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={css(`display:flex; align-items:center; gap:14px; padding:16px 28px; border-bottom:1px solid ${theme.border}; flex-shrink:0;`)}>
          <div>
            <div style={{ fontSize: 16.5, fontWeight: 600, letterSpacing: "-0.01em" }}>{PAGE_META[page].title}</div>
            <div style={css(`font-size:12px; color:${theme.textSecondary}; margin-top:1px;`)}>{PAGE_META[page].subtitle}</div>
          </div>

          {page === "signals" && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ position: "relative", width: 340 }}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runSearch()}
                  placeholder='Pull new signals — e.g. "acme-sdk"'
                  style={css(
                    `width:100%; box-sizing:border-box; background:${theme.bgSurface}; border:1px solid ${theme.border}; border-radius:8px; padding:8px 12px; font-size:12.5px; color:${theme.textPrimary}; outline:none; font-family:${FONT};`
                  )}
                />
              </div>
              <button
                onClick={runSearch}
                disabled={searching}
                style={css(
                  `display:flex; align-items:center; gap:7px; background:${theme.accent}; color:${theme.accentText}; border:none; border-radius:8px; padding:8px 14px; font-size:12.5px; font-weight:600; cursor:pointer; font-family:${FONT}; opacity:${searching ? "0.7" : "1"};`
                )}
              >
                {searching ? "Pulling…" : "Pull signals"}
              </button>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "22px 28px 40px 28px", position: "relative" }}>
          {searchError && (
            <div style={css(`background:${theme.warningBg}; border:1px solid ${theme.border}; color:${theme.warning}; border-radius:8px; padding:10px 14px; margin-bottom:16px; font-size:13px;`)}>
              {searchError}
            </div>
          )}

          {page === "signals" && (
            <SignalsView
              theme={theme}
              cases={cases}
              now={now}
              apiUsage={apiUsage}
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
              sortKey={sortKey}
              sortDir={sortDir}
              onSortConfidence={() => {
                setSortKey("confidence");
                setSortDir((d) => (sortKey === "confidence" && d === "desc" ? "asc" : "desc"));
              }}
              onSortStatus={() => {
                setSortKey("status");
                setSortDir((d) => (sortKey === "status" && d === "asc" ? "desc" : "asc"));
              }}
              onSelect={setSelectedId}
              selectedId={selectedId}
            />
          )}

          {page === "analytics" && <AnalyticsView theme={theme} cases={cases} />}
          {page === "integrations" && <IntegrationsView theme={theme} status={apiStatus} apiUsage={apiUsage} />}
          {page === "settings" && (
            <SettingsView theme={theme} confidenceThreshold={confidenceThreshold} onChangeThreshold={setConfidenceThreshold} />
          )}
        </div>
      </div>

      {selected && (
        <DetailDrawer
          theme={theme}
          item={selected}
          now={now}
          onClose={() => setSelectedId(null)}
          onGenerateVideo={() => generateVideo(selected.signal.id)}
          onApproveSend={() => updateCase(selected.signal.id, { status: "sent" })}
        />
      )}
    </div>
  );
}
