import { css } from "../lib/cssString";
import type { Case } from "../lib/cases";
import { CaseStatus, MONO, sourceColor, statusMeta, Theme } from "../lib/theme";

const FUNNEL: { key: CaseStatus; label: string }[] = [
  { key: "triaging", label: "Triaging" },
  { key: "ready", label: "Ready" },
  { key: "video-pending", label: "Video pending" },
  { key: "video-ready", label: "Video ready" },
  { key: "sent", label: "Sent" },
];

export function AnalyticsView({ theme, cases }: { theme: Theme; cases: Case[] }) {
  const all = cases;
  const confidences = all.filter((c) => c.diagnosis).map((c) => c.diagnosis!.confidence * 100);
  const avgConfidence = confidences.length ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length) : 0;
  const sentCount = all.filter((c) => c.status === "sent").length;

  const trendCards = [
    { label: "Signals this session", value: String(all.length) },
    { label: "Avg. confidence", value: avgConfidence + "%" },
    { label: "Replies sent", value: String(sentCount) },
  ];

  const sources = ["GitHub", "Hacker News", "Reddit"].map((label) => {
    const items = all.filter((c) => c.signal.source === label);
    const count = items.length;
    const withDiag = items.filter((c) => c.diagnosis);
    const avg = withDiag.length
      ? Math.round(withDiag.reduce((a, c) => a + c.diagnosis!.confidence * 100, 0) / withDiag.length)
      : 0;
    return { label, count, avg };
  });
  const maxSource = Math.max(...sources.map((s) => s.count), 1);

  const maxFunnel = Math.max(...FUNNEL.map((f) => all.filter((c) => c.status === f.key).length), 1);
  const STATUS_META = statusMeta(theme);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12, marginBottom: 16 }}>
        {trendCards.map((tc) => (
          <div key={tc.label} style={css(cardStyle(theme))}>
            <div style={css(`font-size:11.5px; color:${theme.textSecondary}; font-weight:500;`)}>{tc.label}</div>
            <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 600, marginTop: 8, letterSpacing: "-0.01em" }}>{tc.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={css(cardStyle(theme))}>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 12 }}>Volume by source</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sources.map((s) => (
              <div key={s.label}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12.5, color: theme.textPrimary as string, display: "flex", alignItems: "center", gap: 7 }}>
                    <span
                      style={css(`display:inline-block; width:8px; height:8px; border-radius:50%; background:${sourceColor(theme, s.label)};`)}
                    />
                    {s.label}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: theme.textSecondary as string }}>
                    {s.count} &middot; {s.avg}% avg
                  </span>
                </div>
                <div style={css(progressTrack(theme))}>
                  <div style={css(`width:${(s.count / maxSource) * 100}%; height:100%; background:${sourceColor(theme, s.label)};`)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={css(cardStyle(theme))}>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 12 }}>Triage funnel</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FUNNEL.map((f) => {
              const count = all.filter((c) => c.status === f.key).length;
              const meta = STATUS_META[f.key as keyof typeof STATUS_META];
              return (
                <div key={f.key}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12.5, color: theme.textPrimary as string }}>{f.label}</span>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: theme.textSecondary as string }}>{count}</span>
                  </div>
                  <div style={css(progressTrack(theme))}>
                    <div style={css(`width:${(count / maxFunnel) * 100}%; height:100%; background:${meta.color};`)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function cardStyle(theme: Theme) {
  return `background:${theme.bgSurface}; border:1px solid ${theme.border}; border-radius:10px; padding:14px 16px;`;
}
function progressTrack(theme: Theme) {
  return `flex:1; height:4px; border-radius:3px; background:${theme.bgElevated}; overflow:hidden;`;
}
