import { css } from "../lib/cssString";
import type { Case } from "../lib/cases";
import { FONT, MONO, Mode, sourceColor, statusMeta, Theme } from "../lib/theme";

const PIPELINE_STEPS = [
  { n: "01", title: "Detect", body: "Continuously scans GitHub issues, Hacker News and Reddit for public complaints mentioning your product." },
  { n: "02", title: "Triage", body: "An LLM diagnoses the root cause, drafts a fix, and writes a personalized reply script — with a confidence score." },
  { n: "03", title: "Approve", body: "Nothing ships automatically. Your team reviews (and can correct) the diagnosis and script before anything is generated." },
  { n: "04", title: "Reply", body: "On approval, a text or AI avatar video reply is prepared and marked ready to send — your team sends it, PainSignal never posts on its own." },
];

export function LandingPage({
  theme,
  mode,
  onToggleMode,
  onEnterDashboard,
  cases,
}: {
  theme: Theme;
  mode: Mode;
  onToggleMode: () => void;
  onEnterDashboard: () => void;
  cases: Case[];
}) {
  const isDark = mode === "dark";
  const STATUS_META = statusMeta(theme);
  const previewRows = [...cases]
    .filter((c) => c.status !== "rejected")
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);

  return (
    <div style={css(`width:100%; height:100vh; overflow-y:auto; background:${theme.bg};`)}>
      <div style={css(`display:flex; align-items:center; justify-content:space-between; padding:20px 48px; border-bottom:1px solid ${theme.border};`)}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={css(`width:26px; height:26px; border-radius:7px; background:${theme.accent}; display:flex; align-items:center; justify-content:center; flex-shrink:0;`)}>
            <div style={css(`width:10px; height:10px; border-radius:2px; background:${theme.accentText}; transform:rotate(45deg);`)} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>PainSignal</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            onClick={onToggleMode}
            style={css(`position:relative; width:96px; height:30px; border-radius:8px; background:${theme.bgElevated}; border:1px solid ${theme.border}; cursor:pointer; display:flex; align-items:center;`)}
          >
            <div
              style={css(
                `position:absolute; top:2px; bottom:2px; width:calc(50% - 3px); left:${isDark ? "2px" : "calc(50% + 1px)"}; border-radius:6px; background:${theme.bgSurface}; border:1px solid ${theme.borderStrong}; transition:left 0.15s ease;`
              )}
            />
            <span style={css(`position:relative; flex:1; text-align:center; font-size:11px; font-weight:600; color:${isDark ? theme.textPrimary : theme.textMuted};`)}>Dark</span>
            <span style={css(`position:relative; flex:1; text-align:center; font-size:11px; font-weight:600; color:${!isDark ? theme.textPrimary : theme.textMuted};`)}>Light</span>
          </div>
          <button onClick={onEnterDashboard} style={css(`background:${theme.accent}; color:${theme.accentText}; border:none; border-radius:8px; padding:8px 14px; font-size:12.5px; font-weight:600; cursor:pointer; font-family:${FONT};`)}>
            Open dashboard
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "88px 28px 48px 28px", textAlign: "center" }}>
        <div style={css(`font-size:11.5px; font-weight:600; letter-spacing:0.08em; color:${theme.accent};`)}>AI DEVELOPER-SUPPORT CO-PILOT</div>
        <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, marginTop: 16 }}>
          Turn public complaints into shipped fixes — and sent replies.
        </div>
        <div style={css(`font-size:15.5px; color:${theme.textSecondary}; line-height:1.6; margin-top:18px; max-width:600px; margin-left:auto; margin-right:auto;`)}>
          PainSignal finds developer complaints about your product on GitHub, Hacker News and Reddit, has an LLM diagnose the root cause and draft a reply, then prepares a text or personalized AI avatar video reply for your team to review, correct if needed, and send.
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
          <button onClick={onEnterDashboard} style={css(`background:${theme.accent}; color:${theme.accentText}; border:none; border-radius:8px; padding:12px 20px; font-size:13.5px; font-weight:600; cursor:pointer; font-family:${FONT};`)}>
            Open dashboard
          </button>
          <a
            href="#how-it-works"
            style={css(`background:transparent; color:${theme.textPrimary}; border:1px solid ${theme.borderStrong}; border-radius:8px; padding:12px 20px; font-size:13.5px; font-weight:600; cursor:pointer; font-family:${FONT}; text-decoration:none; display:inline-flex; align-items:center;`)}
          >
            See how it works
          </a>
        </div>
      </div>

      <div style={css(`max-width:760px; margin:0 auto 64px auto; border:1px solid ${theme.border}; border-radius:12px; overflow:hidden; background:${theme.bgSurface}; box-shadow:${theme.shadow};`)}>
        <div style={css(`display:flex; align-items:center; gap:6px; padding:10px 16px; background:${theme.bgSurfaceAlt}; border-bottom:1px solid ${theme.border};`)}>
          <div style={css(`width:8px; height:8px; border-radius:50%; background:${theme.bgElevated};`)} />
          <div style={css(`width:8px; height:8px; border-radius:50%; background:${theme.bgElevated};`)} />
          <div style={css(`width:8px; height:8px; border-radius:50%; background:${theme.bgElevated};`)} />
          <div style={{ fontSize: 11.5, color: theme.textMuted as string, marginLeft: 8, fontFamily: MONO }}>painsignal.app/signals</div>
        </div>
        <div>
          {previewRows.length > 0 ? (
            previewRows.map((c) => {
              const meta = STATUS_META[c.status as keyof typeof STATUS_META];
              const confidence = c.diagnosis ? Math.round(c.diagnosis.confidence * 100) : null;
              return (
                <div key={c.signal.id} style={css(`display:flex; align-items:center; gap:12px; padding:11px 16px; border-top:1px solid ${theme.border};`)}>
                  {meta && (
                    <span style={css(`display:inline-flex; align-items:center; font-size:11px; font-weight:600; padding:3px 9px; border-radius:20px; color:${meta.color}; background:${meta.bg}; white-space:nowrap;`)}>
                      {meta.label}
                    </span>
                  )}
                  <div style={css(`width:8px; height:8px; border-radius:50%; background:${sourceColor(theme, c.signal.source)}; flex-shrink:0;`)} />
                  <div style={{ fontSize: 12.5, color: theme.textPrimary as string, fontWeight: 500, width: 130, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.signal.author}
                  </div>
                  <div style={{ fontSize: 12.5, color: theme.textSecondary as string, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.signal.text}
                  </div>
                  {confidence !== null && (
                    <span style={{ fontFamily: MONO, fontSize: 11.5, color: theme.textMuted as string, marginLeft: "auto", flexShrink: 0 }}>
                      {confidence}%
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div style={css(`padding:24px 16px; text-align:center; font-size:12.5px; color:${theme.textMuted};`)}>
              No signals scanned yet — open the dashboard and run a scan to see live data here.
            </div>
          )}
        </div>
      </div>

      <div id="how-it-works" style={{ maxWidth: 1040, margin: "0 auto", padding: "0 28px 64px 28px" }}>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", textAlign: "center" }}>How it works</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14, marginTop: 16 }}>
          {PIPELINE_STEPS.map((step) => (
            <div key={step.n} style={css(`background:${theme.bgSurface}; border:1px solid ${theme.border}; border-radius:10px; padding:14px 16px;`)}>
              <div style={css(`display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:7px; background:${theme.accentBg}; color:${theme.accent}; font-family:${MONO}; font-size:12px; font-weight:600;`)}>
                {step.n}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 12 }}>{step.title}</div>
              <div style={css(`font-size:12.5px; color:${theme.textSecondary}; margin-top:6px; line-height:1.5;`)}>{step.body}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={css(`max-width:1040px; margin:0 auto; padding:40px 28px; border-top:1px solid ${theme.border}; display:flex; align-items:center; justify-content:space-between; gap:20px;`)}>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>Stop losing developers to silence.</div>
        <button onClick={onEnterDashboard} style={css(`background:${theme.accent}; color:${theme.accentText}; border:none; border-radius:8px; padding:12px 20px; font-size:13.5px; font-weight:600; cursor:pointer; font-family:${FONT}; flex-shrink:0;`)}>
          Open dashboard
        </button>
      </div>

      <div style={css(`text-align:center; padding:24px 28px 40px 28px; font-size:12px; color:${theme.textMuted};`)}>
        © 2026 PainSignal. Human approval required before any reply is sent.
      </div>
    </div>
  );
}
