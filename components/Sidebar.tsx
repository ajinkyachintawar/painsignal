import { css } from "../lib/cssString";
import { FONT, Mode, Theme } from "../lib/theme";

type NavKey = "signals" | "analytics" | "integrations" | "settings";

const NAV_ITEMS: { key: NavKey; label: string }[] = [
  { key: "signals", label: "Signals" },
  { key: "analytics", label: "Analytics" },
  { key: "integrations", label: "Integrations" },
  { key: "settings", label: "Settings" },
];

export function Sidebar({
  theme,
  mode,
  page,
  signalCount,
  onNavigate,
  onToggleMode,
  onLogoClick,
}: {
  theme: Theme;
  mode: Mode;
  page: NavKey;
  signalCount: number;
  onNavigate: (page: NavKey) => void;
  onToggleMode: () => void;
  onLogoClick?: () => void;
}) {
  const isDark = mode === "dark";

  return (
    <div
      style={css(
        `width:232px; flex-shrink:0; border-right:1px solid ${theme.border}; display:flex; flex-direction:column; background:${theme.bgSidebar};`
      )}
    >
      <div
        onClick={onLogoClick}
        style={{ display: "flex", alignItems: "center", gap: 9, padding: "20px 18px 16px 18px", cursor: onLogoClick ? "pointer" : "default" }}
      >
        <div
          style={css(
            `width:26px; height:26px; border-radius:7px; background:${theme.accent}; display:flex; align-items:center; justify-content:center; flex-shrink:0;`
          )}
        >
          <div
            style={css(`width:10px; height:10px; border-radius:2px; background:${theme.accentText}; transform:rotate(45deg);`)}
          />
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.01em" }}>PainSignal</div>
      </div>

      <div style={{ padding: "0 12px", marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const active = item.key === page;
          return (
            <div
              key={item.key}
              onClick={() => onNavigate(item.key)}
              style={css(
                `display:flex; align-items:center; gap:9px; padding:8px 10px; border-radius:7px; font-size:13px; font-weight:500; cursor:pointer; background:${
                  active ? theme.bgElevated : "transparent"
                }; color:${active ? theme.textPrimary : theme.textSecondary};`
              )}
            >
              <div
                style={css(
                  `width:16px; height:16px; border-radius:4px; background:${active ? theme.accent : theme.bgElevated}; flex-shrink:0;`
                )}
              />
              <span>{item.label}</span>
              {item.key === "signals" && (
                <span
                  style={css(
                    `margin-left:auto; font-size:10.5px; font-family:'IBM Plex Mono',monospace; color:${theme.textSecondary}; background:${theme.bgElevated}; padding:1px 6px; border-radius:20px;`
                  )}
                >
                  {signalCount}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div style={css(`margin-top:auto; padding:14px 14px 18px 14px; border-top:1px solid ${theme.border};`)}>
        <div
          onClick={onToggleMode}
          style={css(
            `position:relative; width:100%; height:30px; border-radius:8px; background:${theme.bgElevated}; border:1px solid ${theme.border}; cursor:pointer; display:flex; align-items:center;`
          )}
        >
          <div
            style={css(
              `position:absolute; top:2px; bottom:2px; width:calc(50% - 3px); left:${
                isDark ? "2px" : "calc(50% + 1px)"
              }; border-radius:6px; background:${theme.bgSurface}; border:1px solid ${theme.borderStrong}; transition:left 0.15s ease;`
            )}
          />
          <span
            style={css(
              `position:relative; flex:1; text-align:center; font-size:11px; font-weight:600; color:${
                isDark ? theme.textPrimary : theme.textMuted
              };`
            )}
          >
            Dark
          </span>
          <span
            style={css(
              `position:relative; flex:1; text-align:center; font-size:11px; font-weight:600; color:${
                !isDark ? theme.textPrimary : theme.textMuted
              };`
            )}
          >
            Light
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: 8, borderRadius: 8, marginTop: 10 }}>
          <div
            style={css(
              `width:28px; height:28px; border-radius:7px; background:${theme.bgElevated}; display:flex; align-items:center; justify-content:center; font-size:11.5px; font-weight:600; flex-shrink:0; color:${theme.textPrimary};`
            )}
          >
            You
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, fontFamily: FONT }}>Solo builder</div>
            <div style={css(`font-size:11px; color:${theme.textMuted};`)}>Hackathon build</div>
          </div>
        </div>
      </div>
    </div>
  );
}
