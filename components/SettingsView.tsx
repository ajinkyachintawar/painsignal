import { useState } from "react";
import { css } from "../lib/cssString";
import { FONT, Theme } from "../lib/theme";
import type { Settings } from "../lib/store";

export function SettingsView({
  theme,
  settings,
  onUpdate,
}: {
  theme: Theme;
  settings: Settings;
  onUpdate: (patch: Partial<Settings>) => void;
}) {
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [githubOrg, setGithubOrg] = useState(settings.githubOrg);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
      <div style={css(cardStyle(theme))}>
        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>Target company</div>
        <div style={css(`font-size:12px; color:${theme.textSecondary}; margin-bottom:14px; line-height:1.5;`)}>
          PainSignal scrapes this company's GitHub org directly (all open issues, comprehensive) plus Reddit/Hacker
          News via Exa. The hourly scheduled scan and manual "Pull signals now" both target this.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={css(`font-size:11.5px; color:${theme.textMuted};`)}>Company display name</span>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onBlur={() => companyName !== settings.companyName && onUpdate({ companyName })}
              style={css(inputStyle(theme))}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={css(`font-size:11.5px; color:${theme.textMuted};`)}>GitHub org (e.g. "elevenlabs" for github.com/elevenlabs)</span>
            <input
              value={githubOrg}
              onChange={(e) => setGithubOrg(e.target.value)}
              onBlur={() => githubOrg !== settings.githubOrg && onUpdate({ githubOrg })}
              style={css(inputStyle(theme))}
            />
          </label>
        </div>
      </div>

      <div style={css(cardStyle(theme))}>
        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>Approval policy</div>
        <div style={css(`font-size:12px; color:${theme.textSecondary}; margin-bottom:14px; line-height:1.5;`)}>
          Every reply — script and video — requires an explicit human approval before it is sent (simulated, not a
          real post). This is a safety guarantee, not a configurable default.
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
              Signals below {Math.round(settings.confidenceThreshold * 100)}% confidence are filtered out automatically
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={0.9}
            step={0.05}
            value={settings.confidenceThreshold}
            onChange={(e) => onUpdate({ confidenceThreshold: Number(e.target.value) })}
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
function inputStyle(theme: Theme) {
  return `background:${theme.bgInset}; border:1px solid ${theme.border}; color:${theme.textPrimary}; border-radius:7px; padding:8px 10px; font-size:12.5px; font-family:${FONT};`;
}
