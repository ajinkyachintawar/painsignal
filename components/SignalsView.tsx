import { css } from "../lib/cssString";
import type { Case } from "../lib/cases";
import { formatTimeAgo } from "../lib/cases";
import { CaseStatus, MONO, sourceColor, statusMeta, Theme } from "../lib/theme";

export type ApiUsage = { search: number; llm: number; video: number };

const STATUS_FILTERS: { key: CaseStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "triaging", label: "Triaging" },
  { key: "ready", label: "Ready" },
  { key: "video-pending", label: "Video pending" },
  { key: "video-ready", label: "Video ready" },
  { key: "sent", label: "Sent" },
];

function confidenceBars(cases: Case[]): number[] {
  return cases
    .filter((c) => c.diagnosis)
    .slice(-8)
    .map((c) => c.diagnosis!.confidence * 100);
}

export function SignalsView({
  theme,
  cases,
  now,
  apiUsage,
  filterStatus,
  onFilterChange,
  sortKey,
  sortDir,
  onSortConfidence,
  onSortStatus,
  onSelect,
  selectedId,
}: {
  theme: Theme;
  cases: Case[];
  now: number;
  apiUsage: ApiUsage;
  filterStatus: CaseStatus | "all";
  onFilterChange: (s: CaseStatus | "all") => void;
  sortKey: "confidence" | "status" | "time";
  sortDir: "asc" | "desc";
  onSortConfidence: () => void;
  onSortStatus: () => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  const visible = cases.filter((c) => c.status !== "rejected");
  const readyCount = visible.filter((c) => c.status === "ready").length;
  const videoCount = visible.filter((c) => ["video-pending", "video-ready", "sent"].includes(c.status)).length;
  const confidences = visible.filter((c) => c.diagnosis).map((c) => c.diagnosis!.confidence * 100);
  const avgConfidence = confidences.length ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length) : 0;
  const bars = confidenceBars(visible);

  const metricCards = [
    { label: "Signals processed", value: String(visible.length) },
    { label: "Ready for review", value: String(readyCount) },
    { label: "Videos generated", value: String(videoCount) },
    { label: "Avg. confidence", value: avgConfidence + "%" },
  ];

  let filtered = filterStatus === "all" ? visible : visible.filter((c) => c.status === filterStatus);
  filtered = [...filtered].sort((a, b) => {
    let av: number | string, bv: number | string;
    if (sortKey === "confidence") {
      av = a.diagnosis?.confidence ?? 0;
      bv = b.diagnosis?.confidence ?? 0;
    } else if (sortKey === "status") {
      av = a.status;
      bv = b.status;
    } else {
      av = a.createdAt;
      bv = b.createdAt;
    }
    const dir = sortDir === "asc" ? 1 : -1;
    return av < bv ? -1 * dir : av > bv ? 1 * dir : 0;
  });

  const STATUS_META = statusMeta(theme);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr)) 1.6fr", gap: 12, marginBottom: 22 }}>
        {metricCards.map((m) => (
          <div key={m.label} style={css(cardStyle(theme))}>
            <div style={css(`font-size:11.5px; color:${theme.textSecondary}; font-weight:500;`)}>{m.label}</div>
            <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 600, marginTop: 8, letterSpacing: "-0.01em" }}>{m.value}</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 2.5, height: 22, marginTop: 10 }}>
              {bars.length > 0 ? (
                bars.map((h, i) => (
                  <div
                    key={i}
                    style={css(
                      `width:4px; border-radius:2px; height:${Math.max(4, (h / 100) * 22).toFixed(1)}px; background:${
                        i === bars.length - 1 ? theme.accent : theme.bgElevated
                      };`
                    )}
                  />
                ))
              ) : (
                <span style={css(`font-size:11px; color:${theme.textMuted};`)}>No signals yet</span>
              )}
            </div>
          </div>
        ))}

        <div style={css(cardStyle(theme))}>
          <div style={css(`font-size:11.5px; color:${theme.textSecondary}; font-weight:500; margin-bottom:10px;`)}>
            API usage &mdash; this session
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {[
              { label: "Search calls (Exa)", value: apiUsage.search, color: theme.accent, max: Math.max(10, apiUsage.search) },
              { label: "LLM calls (Groq)", value: apiUsage.llm, color: theme.teal, max: Math.max(10, apiUsage.llm) },
              { label: "Video renders (HeyGen)", value: apiUsage.video, color: theme.purple, max: Math.max(5, apiUsage.video) },
            ].map((u) => (
              <div key={u.label}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={css(`font-size:11.5px; color:${theme.textSecondary};`)}>{u.label}</span>
                  <span style={{ fontFamily: MONO, fontSize: 11.5, color: theme.textPrimary as string, fontWeight: 500 }}>
                    {u.value}
                  </span>
                </div>
                <div style={css(progressTrack(theme))}>
                  <div style={css(`width:${(u.value / u.max) * 100}%; height:100%; background:${u.color};`)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" as const }}>
        {STATUS_FILTERS.map((chip) => (
          <button
            key={chip.key}
            onClick={() => onFilterChange(chip.key)}
            style={css(
              `font-size:12px; font-weight:500; padding:6px 12px; border-radius:7px; cursor:pointer; border:1px solid ${
                filterStatus === chip.key ? theme.accent : theme.border
              }; background:${filterStatus === chip.key ? theme.accentBg : "transparent"}; color:${
                filterStatus === chip.key ? theme.accent : theme.textSecondary
              };`
            )}
          >
            {chip.label}
          </button>
        ))}
        <div style={css(`margin-left:auto; font-size:12px; color:${theme.textMuted};`)}>
          {filtered.length} of {visible.length}
        </div>
      </div>

      <div style={css(`border:1px solid ${theme.border}; border-radius:10px; overflow-x:auto; background:${theme.bgSurface};`)}>
        <div
          style={css(
            `min-width:900px; display:grid; grid-template-columns:96px 28px 90px 120px 1fr 160px 60px; gap:0; padding:9px 16px; border-bottom:1px solid ${theme.border}; background:${theme.bgSurfaceAlt};`
          )}
        >
          <div onClick={onSortStatus} style={css(headerCell(theme))}>
            Status
          </div>
          <div style={css(headerCell(theme))} />
          <div onClick={onSortConfidence} style={css(headerCell(theme))}>
            Confidence {sortKey === "confidence" ? (sortDir === "desc" ? "↓" : "↑") : ""}
          </div>
          <div style={css(headerCell(theme))}>Author</div>
          <div style={css(headerCell(theme))}>Complaint</div>
          <div style={css(headerCell(theme))}>Diagnosis</div>
          <div style={css(headerCell(theme))}>Time</div>
        </div>

        {filtered.map((c) => {
          const meta = STATUS_META[c.status as keyof typeof STATUS_META];
          const confidence = c.diagnosis ? Math.round(c.diagnosis.confidence * 100) : null;
          return (
            <div
              key={c.signal.id}
              onClick={() => onSelect(c.signal.id)}
              style={css(
                `min-width:900px; display:grid; grid-template-columns:96px 28px 90px 120px 1fr 160px 60px; gap:0; align-items:center; padding:11px 16px; border-bottom:1px solid ${theme.border}; cursor:pointer; background:${
                  c.signal.id === selectedId ? theme.bgHover : "transparent"
                };`
              )}
            >
              <div>
                {meta && (
                  <span
                    style={css(
                      `display:inline-flex; align-items:center; font-size:11px; font-weight:600; padding:3px 9px; border-radius:20px; color:${meta.color}; background:${meta.bg}; white-space:nowrap;`
                    )}
                  >
                    {meta.label}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={css(`width:8px; height:8px; border-radius:50%; background:${sourceColor(theme, c.signal.source)};`)} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {confidence !== null && (
                  <>
                    <div style={css(progressTrack(theme))}>
                      <div
                        style={css(
                          `width:${confidence}%; height:100%; background:${
                            confidence >= 80 ? theme.success : confidence >= 55 ? theme.accent : theme.warning
                          };`
                        )}
                      />
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 11.5, color: theme.textSecondary as string, width: 30, flexShrink: 0 }}>
                      {confidence}%
                    </span>
                  </>
                )}
              </div>
              <div style={css(`font-size:12.5px; color:${theme.textPrimary}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:12px;`)}>
                {c.signal.author}
              </div>
              <div style={css(`font-size:12.5px; color:${theme.textSecondary}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:16px;`)}>
                {c.signal.text}
              </div>
              <div style={css(`font-size:12px; color:${theme.textMuted}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:12px; font-style:italic;`)}>
                {c.diagnosis?.root_cause ?? "— pending triage"}
              </div>
              <div style={{ fontSize: 11.5, color: theme.textMuted as string, fontFamily: MONO }}>{formatTimeAgo(c.createdAt, now)}</div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={css(`padding:40px; text-align:center; color:${theme.textMuted}; font-size:13px;`)}>
            No signals match this filter.
          </div>
        )}
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
function headerCell(theme: Theme) {
  return `font-size:10.5px; font-weight:600; color:${theme.textMuted}; text-transform:uppercase; letter-spacing:0.04em; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;`;
}
