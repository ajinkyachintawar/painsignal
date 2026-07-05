import { css } from "../lib/cssString";
import { FONT, Theme } from "../lib/theme";
import type { ApiUsage } from "./SignalsView";
import type { ApiStatus } from "../lib/status";

export function IntegrationsView({ theme, status, apiUsage }: { theme: Theme; status: ApiStatus | null; apiUsage: ApiUsage }) {
  const rows = [
    {
      name: "Exa (GitHub + HN search)",
      detail: `${apiUsage.search} search call${apiUsage.search === 1 ? "" : "s"} this session`,
      connected: status?.exa ?? false,
      color: theme.accent,
    },
    {
      name: "Groq (Llama 3.3 70B)",
      detail: `${apiUsage.llm} diagnosis/script call${apiUsage.llm === 1 ? "" : "s"} this session`,
      connected: status?.groq ?? false,
      color: theme.teal,
    },
    {
      name: "HeyGen (avatar video)",
      detail: `${apiUsage.video} video render${apiUsage.video === 1 ? "" : "s"} this session`,
      connected: status?.heygen ?? false,
      color: theme.purple,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 720 }}>
      {rows.map((ig) => (
        <div key={ig.name} style={{ ...css(cardStyle(theme)), display: "flex", alignItems: "center", gap: 14 }}>
          <div style={css(`width:34px; height:34px; border-radius:9px; background:${ig.color}; opacity:0.85; flex-shrink:0;`)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{ig.name}</div>
            <div style={css(`font-size:12px; color:${theme.textSecondary}; margin-top:2px;`)}>{ig.detail}</div>
          </div>
          <span
            style={css(
              `display:inline-flex; align-items:center; font-size:11px; font-weight:600; padding:3px 9px; border-radius:20px; color:${
                ig.connected ? theme.success : theme.danger
              }; background:${ig.connected ? theme.successBg : theme.warningBg}; white-space:nowrap;`
            )}
          >
            {status === null ? "Checking…" : ig.connected ? "Connected" : "Not configured"}
          </span>
        </div>
      ))}
    </div>
  );
}

function cardStyle(theme: Theme) {
  return `background:${theme.bgSurface}; border:1px solid ${theme.border}; border-radius:10px; padding:14px 16px; font-family:${FONT};`;
}
