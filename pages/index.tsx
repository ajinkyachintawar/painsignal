import { useCallback, useEffect, useRef, useState } from "react";
import Head from "next/head";
import { css } from "../lib/cssString";
import type { Case } from "../lib/cases";
import { computeApiUsage } from "../lib/cases";
import { CaseStatus, FONT, Mode, THEMES } from "../lib/theme";
import type { ApiStatus } from "../lib/status";
import type { Settings } from "../lib/store";
import { Sidebar } from "../components/Sidebar";
import { SignalsView } from "../components/SignalsView";
import { AnalyticsView } from "../components/AnalyticsView";
import { IntegrationsView } from "../components/IntegrationsView";
import { SettingsView } from "../components/SettingsView";
import { DetailDrawer } from "../components/DetailDrawer";

type Page = "signals" | "analytics" | "integrations" | "settings";

const PAGE_META: Record<Page, { title: string; subtitle: string }> = {
  signals: { title: "Signals", subtitle: "Public complaints, triaged and drafted for reply" },
  analytics: { title: "Analytics", subtitle: "Trends across triage, confidence, and response volume" },
  integrations: { title: "Integrations", subtitle: "Data sources and providers powering PainSignal" },
  settings: { title: "Settings", subtitle: "Company target, approval policy, and plan" },
};

const CASES_POLL_MS = 20000;
const VIDEO_POLL_MS = 3000;

export default function Home() {
  const [mode, setMode] = useState<Mode>("dark");
  const [page, setPage] = useState<Page>("signals");
  const [cases, setCases] = useState<Case[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<CaseStatus | "all">("all");
  const [sortKey, setSortKey] = useState<"confidence" | "status" | "time">("time");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const videoPolling = useRef<Set<string>>(new Set());

  const theme = THEMES[mode];

  const loadCases = useCallback(async () => {
    const data = await fetch("/api/cases").then((r) => r.json());
    if (Array.isArray(data)) setCases(data);
  }, []);

  useEffect(() => {
    loadCases();
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings);
    fetch("/api/status")
      .then((r) => r.json())
      .then(setApiStatus)
      .catch(() => setApiStatus({ exa: false, groq: false, heygen: false }));
  }, [loadCases]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    const poll = setInterval(loadCases, CASES_POLL_MS);
    return () => {
      clearInterval(t);
      clearInterval(poll);
    };
  }, [loadCases]);

  // Fast polling specifically while a video is rendering, so the demo doesn't
  // wait for the slower general cases-poll interval to show completion.
  useEffect(() => {
    const pending = cases.filter((c) => c.status === "video-pending");
    pending.forEach((c) => {
      if (videoPolling.current.has(c.signal.id)) return;
      videoPolling.current.add(c.signal.id);
      const interval = setInterval(async () => {
        const res = await fetch(`/api/cases/video-status?id=${encodeURIComponent(c.signal.id)}`).then((r) => r.json());
        if (res.status && res.status !== "video-pending") {
          clearInterval(interval);
          videoPolling.current.delete(c.signal.id);
          loadCases();
        }
      }, VIDEO_POLL_MS);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cases]);

  async function runScan() {
    setScanning(true);
    setScanError(null);
    try {
      const res = await fetch("/api/scan", { method: "POST" }).then((r) => r.json());
      if (res.error) throw new Error(res.error);
      await loadCases();
      fetch("/api/settings")
        .then((r) => r.json())
        .then(setSettings);
    } catch (e) {
      setScanError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function generateVideo(id: string) {
    await fetch("/api/cases/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadCases();
  }

  async function approveSend(id: string) {
    await fetch("/api/cases/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadCases();
  }

  async function updateSettings(patch: Partial<Settings>) {
    const updated = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then((r) => r.json());
    setSettings(updated);
  }

  const selected = cases.find((c) => c.signal.id === selectedId) ?? null;
  const visibleCount = cases.filter((c) => c.status !== "rejected").length;
  const apiUsage = computeApiUsage(cases, settings?.scanCount ?? 0);

  return (
    <div style={css(`display:flex; width:100%; height:100vh; min-height:760px; background:${theme.bg}; font-family:${FONT}; color:${theme.textPrimary}; overflow:hidden;`)}>
      <Head>
        <title>{`${PAGE_META[page].title} — PainSignal`}</title>
      </Head>
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
            <div style={css(`font-size:12px; color:${theme.textSecondary}; margin-top:1px;`)}>
              {page === "signals" && settings ? `Scanning ${settings.companyName} (github.com/${settings.githubOrg}) — hourly + on demand` : PAGE_META[page].subtitle}
            </div>
          </div>

          {page === "signals" && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={runScan}
                disabled={scanning}
                style={css(
                  `display:flex; align-items:center; gap:7px; background:${theme.accent}; color:${theme.accentText}; border:none; border-radius:8px; padding:8px 14px; font-size:12.5px; font-weight:600; cursor:pointer; font-family:${FONT}; opacity:${scanning ? "0.7" : "1"};`
                )}
              >
                {scanning ? "Scanning…" : "Pull signals now"}
              </button>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "22px 28px 40px 28px", position: "relative" }}>
          {scanError && (
            <div style={css(`background:${theme.warningBg}; border:1px solid ${theme.border}; color:${theme.warning}; border-radius:8px; padding:10px 14px; margin-bottom:16px; font-size:13px;`)}>
              {scanError}
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
          {page === "settings" && settings && <SettingsView theme={theme} settings={settings} onUpdate={updateSettings} />}
        </div>
      </div>

      {selected && (
        <DetailDrawer
          theme={theme}
          item={selected}
          now={now}
          onClose={() => setSelectedId(null)}
          onGenerateVideo={() => generateVideo(selected.signal.id)}
          onApproveSend={() => approveSend(selected.signal.id)}
        />
      )}
    </div>
  );
}
