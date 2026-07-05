import { css } from "../lib/cssString";
import { Theme } from "../lib/theme";

export function SettingsView({
  theme,
  confidenceThreshold,
  onChangeThreshold,
}: {
  theme: Theme;
  confidenceThreshold: number;
  onChangeThreshold: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
      <div style={css(cardStyle(theme))}>
        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>Approval policy</div>
        <div style={css(`font-size:12px; color:${theme.textSecondary}; margin-bottom:14px; line-height:1.5;`)}>
          Every reply — script and video — requires an explicit human approval before it is sent. This is a safety
          guarantee, not a configurable default.
        </div>
        <div
          style={css(
            `display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-top:1px solid ${theme.border};`
          )}
        >
          <div>
            <div style={{ fontSize: 12.5, color: theme.textPrimary as string }}>Require human approval before send</div>
            <div style={css(`font-size:11.5px; color:${theme.textMuted}; margin-top:1px;`)}>Locked on for all workspaces</div>
          </div>
          <div style={css(`position:relative; width:36px; height:20px; border-radius:20px; background:${theme.accent}; opacity:0.5; flex-shrink:0;`)}>
            <div style={css(`position:absolute; top:2px; right:2px; width:16px; height:16px; border-radius:50%; background:${theme.bgSurface};`)} />
          </div>
        </div>
        <div
          style={css(
            `display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-top:1px solid ${theme.border};`
          )}
        >
          <div>
            <div style={{ fontSize: 12.5, color: theme.textPrimary as string }}>Auto-triage confidence threshold</div>
            <div style={css(`font-size:11.5px; color:${theme.textMuted}; margin-top:1px;`)}>
              Signals below {Math.round(confidenceThreshold * 100)}% confidence are filtered out automatically
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={0.9}
            step={0.05}
            value={confidenceThreshold}
            onChange={(e) => onChangeThreshold(Number(e.target.value))}
            style={{ width: 120 }}
          />
        </div>
      </div>

      <div style={css(cardStyle(theme))}>
        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 12 }}>Team</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={css(
              `width:28px; height:28px; border-radius:7px; background:${theme.bgElevated}; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; color:${theme.textPrimary};`
            )}
          >
            You
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, color: theme.textPrimary as string }}>Solo builder</div>
            <div style={css(`font-size:11.5px; color:${theme.textMuted};`)}>This workspace</div>
          </div>
          <span style={css(`font-size:11.5px; color:${theme.textSecondary};`)}>Owner</span>
        </div>
      </div>

      <div style={css(cardStyle(theme))}>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>Plan</div>
        <div style={css(`font-size:11.5px; color:${theme.textMuted}; margin-top:2px;`)}>
          Hackathon build — no billing, running on personal API keys.
        </div>
      </div>
    </div>
  );
}

function cardStyle(theme: Theme) {
  return `background:${theme.bgSurface}; border:1px solid ${theme.border}; border-radius:10px; padding:14px 16px;`;
}
