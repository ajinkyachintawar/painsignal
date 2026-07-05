import { useEffect, useState } from "react";
import { css } from "../lib/cssString";
import type { Case } from "../lib/cases";
import { formatTimeAgo } from "../lib/cases";
import { FONT, MONO, sourceColor, statusMeta, Theme } from "../lib/theme";

export function DetailDrawer({
  theme,
  item,
  now,
  onClose,
  onGenerateVideo,
  onApproveSend,
  onSaveEdit,
  onRegenerateScript,
}: {
  theme: Theme;
  item: Case;
  now: number;
  onClose: () => void;
  onGenerateVideo: () => void;
  onApproveSend: (mode: "text" | "video") => void;
  onSaveEdit: (patch: { root_cause: string; fix: string; script: string }) => void;
  onRegenerateScript: (patch: { root_cause: string; fix: string }) => Promise<string>;
}) {
  const meta = statusMeta(theme)[item.status as keyof ReturnType<typeof statusMeta>];
  const color = sourceColor(theme, item.signal.source);

  const [editing, setEditing] = useState(false);
  const [draftRootCause, setDraftRootCause] = useState(item.diagnosis?.root_cause ?? "");
  const [draftFix, setDraftFix] = useState(item.diagnosis?.fix ?? "");
  const [draftScript, setDraftScript] = useState(item.script ?? "");
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    setEditing(false);
    setDraftRootCause(item.diagnosis?.root_cause ?? "");
    setDraftFix(item.diagnosis?.fix ?? "");
    setDraftScript(item.script ?? "");
  }, [item.signal.id]);

  function saveEdit() {
    onSaveEdit({ root_cause: draftRootCause, fix: draftFix, script: draftScript });
    setEditing(false);
  }

  async function regenerateScript() {
    setRegenerating(true);
    try {
      const script = await onRegenerateScript({ root_cause: draftRootCause, fix: draftFix });
      setDraftScript(script);
    } finally {
      setRegenerating(false);
    }
  }

  const showVideoPending = item.status === "video-pending";
  const showVideoPlayer = (item.status === "video-ready" || item.status === "sent") && item.videoUrl;
  const showGenerateAction = item.status === "ready";
  const canSend = item.status === "ready" || item.status === "video-ready";
  const canSendVideo = item.status === "video-ready";
  const sentLabel = item.sentAs === "video" ? "Sent as video ✓" : "Sent as text ✓";

  return (
    <>
      <div onClick={onClose} style={css(`position:fixed; inset:0; background:oklch(0.1 0.01 260 / 0.5); z-index:40;`)} />
      <div
        style={css(
          `position:fixed; top:0; right:0; bottom:0; width:520px; max-width:92vw; background:${theme.bgSidebar}; border-left:1px solid ${theme.border}; z-index:41; display:flex; flex-direction:column; box-shadow:${theme.shadow};`
        )}
      >
        <div
          style={css(
            `padding:18px 22px; border-bottom:1px solid ${theme.border}; display:flex; align-items:flex-start; gap:12px; flex-shrink:0;`
          )}
        >
          <div style={css(`width:34px; height:34px; border-radius:9px; background:${color}; opacity:0.85; flex-shrink:0; margin-top:2px;`)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: FONT }}>{item.signal.author}</div>
            <div style={css(`font-size:11.5px; color:${theme.textMuted}; margin-top:1px;`)}>
              {item.signal.source} &middot; {formatTimeAgo(item.createdAt, now)}
            </div>
          </div>
          {meta && (
            <span
              style={css(
                `display:inline-flex; align-items:center; font-size:11px; font-weight:600; padding:3px 9px; border-radius:20px; color:${meta.color}; background:${meta.bg}; white-space:nowrap;`
              )}
            >
              {meta.label}
            </span>
          )}
          <button
            onClick={onClose}
            style={css(`background:none; border:none; color:${theme.textMuted}; font-size:18px; cursor:pointer; line-height:1; padding:2px 4px; font-family:${FONT};`)}
          >
            &times;
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <div style={css(sectionLabel(theme))}>Original complaint</div>
            <div style={css(insetBox(theme))}>{item.signal.text}</div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <div style={css(sectionLabel(theme))}>Diagnosis</div>
              {item.diagnosis && (
                <span
                  style={css(
                    `font-size:10.5px; font-weight:600; padding:2px 7px; border-radius:20px; color:${
                      item.diagnosis.grounded ? theme.teal : theme.textMuted
                    }; background:${item.diagnosis.grounded ? theme.tealBg : theme.bgElevated};`
                  )}
                >
                  {item.diagnosis.grounded ? "Grounded in real sources" : "Model's general knowledge"}
                </span>
              )}
              {item.edited && (
                <span
                  style={css(
                    `font-size:10.5px; font-weight:600; padding:2px 7px; border-radius:20px; color:${theme.warning}; background:${theme.warningBg};`
                  )}
                >
                  Corrected by you
                </span>
              )}
              {item.diagnosis && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  style={css(
                    `margin-left:auto; background:none; border:1px solid ${theme.borderStrong}; color:${theme.textSecondary}; border-radius:6px; padding:3px 9px; font-size:11px; cursor:pointer; font-family:${FONT};`
                  )}
                >
                  Edit
                </button>
              )}
            </div>
            <div style={{ ...css(insetBox(theme)), display: "flex", flexDirection: "column", gap: 9 }}>
              {item.diagnosis ? (
                <>
                  <div>
                    <div style={css(`font-size:11px; color:${theme.accent}; font-weight:600; margin-bottom:2px;`)}>Root cause</div>
                    {editing ? (
                      <textarea
                        value={draftRootCause}
                        onChange={(e) => setDraftRootCause(e.target.value)}
                        style={css(editableBox(theme))}
                        rows={3}
                      />
                    ) : (
                      <div style={{ fontSize: 13, lineHeight: 1.5, color: theme.textPrimary as string }}>
                        {item.diagnosis.root_cause}
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={css(`font-size:11px; color:${theme.success}; font-weight:600; margin-bottom:2px;`)}>Suggested fix</div>
                    {editing ? (
                      <textarea
                        value={draftFix}
                        onChange={(e) => setDraftFix(e.target.value)}
                        style={css(editableBox(theme))}
                        rows={3}
                      />
                    ) : (
                      <div style={{ fontSize: 13, lineHeight: 1.5, color: theme.textPrimary as string }}>{item.diagnosis.fix}</div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: theme.textMuted as string }}>Diagnosis in progress&hellip;</div>
              )}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <div style={{ ...css(sectionLabel(theme)), marginBottom: 0 }}>Drafted reply script</div>
              {editing && (
                <button
                  onClick={regenerateScript}
                  disabled={regenerating}
                  style={css(
                    `margin-left:auto; background:none; border:1px solid ${theme.borderStrong}; color:${theme.textSecondary}; border-radius:6px; padding:3px 9px; font-size:11px; cursor:${regenerating ? "default" : "pointer"}; font-family:${FONT}; opacity:${regenerating ? "0.6" : "1"};`
                  )}
                >
                  {regenerating ? "Redrafting…" : "Regenerate script from corrected diagnosis"}
                </button>
              )}
            </div>
            {editing ? (
              <textarea
                value={draftScript}
                onChange={(e) => setDraftScript(e.target.value)}
                style={css(editableBox(theme, true))}
                rows={6}
              />
            ) : (
              <div style={css(scriptBox(theme))}>
                {item.script ?? "Reply script drafts automatically once diagnosis completes."}
              </div>
            )}
            {editing && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  onClick={saveEdit}
                  style={css(
                    `flex:1; box-sizing:border-box; background:${theme.bgElevated}; border:1px solid ${theme.borderStrong}; color:${theme.textPrimary}; border-radius:8px; padding:10px; font-size:12.5px; font-weight:500; cursor:pointer; font-family:${FONT};`
                  )}
                >
                  Save correction
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setDraftRootCause(item.diagnosis?.root_cause ?? "");
                    setDraftFix(item.diagnosis?.fix ?? "");
                    setDraftScript(item.script ?? "");
                  }}
                  style={css(
                    `flex:1; box-sizing:border-box; background:none; border:1px solid ${theme.borderStrong}; color:${theme.textSecondary}; border-radius:8px; padding:10px 14px; font-size:12.5px; cursor:pointer; font-family:${FONT};`
                  )}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div>
            <div style={css(sectionLabel(theme))}>Reply video</div>

            {showVideoPending && (
              <div style={{ ...css(insetBox(theme)), display: "flex", alignItems: "center", gap: 10, padding: "20px 14px" }}>
                <div
                  style={css(
                    `width:14px; height:14px; border-radius:50%; border:2px solid ${theme.purple}44; border-top-color:${theme.purple}; animation:ps-spin 0.8s linear infinite; flex-shrink:0;`
                  )}
                />
                <div style={{ fontSize: 12.5, color: theme.textSecondary as string }}>
                  Generating avatar video &mdash; usually takes 2&ndash;3 minutes
                </div>
              </div>
            )}

            {showVideoPlayer && (
              <video src={item.videoUrl!} controls style={{ width: "100%", borderRadius: 8, border: `1px solid ${theme.border}` }} />
            )}

            {showGenerateAction && (
              <button onClick={onGenerateVideo} style={css(generateBtn(theme))}>
                Generate reply video
              </button>
            )}

            {item.error && (
              <div style={css(`margin-top:8px; font-size:12px; color:${theme.danger};`)}>{item.error}</div>
            )}
          </div>
        </div>

        <div
          style={css(`padding:16px 22px; border-top:1px solid ${theme.border}; flex-shrink:0; display:flex; flex-direction:column; gap:9px;`)}
        >
          <div style={{ fontSize: 11, color: theme.textSecondary as string, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={css(`width:5px; height:5px; border-radius:50%; background:${theme.warning}; flex-shrink:0;`)} />
            <span>
              {item.status === "sent"
                ? `Approved and sent by you as ${item.sentAs ?? "video"} (simulated, not a real GitHub post).`
                : "Nothing goes out without your explicit approval below. Review the draft, correct it if needed, then choose how to send it."}
            </span>
          </div>
          {item.status === "sent" ? (
            <button
              disabled
              style={css(
                `width:100%; box-sizing:border-box; border-radius:8px; padding:11px; font-size:13px; font-weight:600; font-family:${FONT}; border:none; cursor:default; background:${theme.successBg}; color:${theme.success};`
              )}
            >
              {sentLabel}
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => onApproveSend("text")}
                disabled={!canSend}
                style={css(
                  `flex:1; box-sizing:border-box; border-radius:8px; padding:11px; font-size:13px; font-weight:600; font-family:${FONT}; border:none; cursor:${
                    canSend ? "pointer" : "default"
                  }; background:${canSend ? theme.accent : theme.bgElevated}; color:${canSend ? theme.accentText : theme.textMuted};`
                )}
              >
                Send as text
              </button>
              <button
                onClick={() => onApproveSend("video")}
                disabled={!canSendVideo}
                style={css(
                  `flex:1; box-sizing:border-box; border-radius:8px; padding:11px; font-size:13px; font-weight:600; font-family:${FONT}; border:none; cursor:${
                    canSendVideo ? "pointer" : "default"
                  }; background:${canSendVideo ? theme.teal : theme.bgElevated}; color:${canSendVideo ? theme.accentText : theme.textMuted};`
                )}
              >
                Send as video
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function sectionLabel(theme: Theme) {
  return `font-size:10.5px; font-weight:600; color:${theme.textMuted}; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:7px;`;
}
function insetBox(theme: Theme) {
  return `font-size:13px; line-height:1.55; color:${theme.textPrimary}; background:${theme.bgInset}; border:1px solid ${theme.border}; border-radius:8px; padding:12px 14px;`;
}
function scriptBox(theme: Theme) {
  return `font-family:${MONO}; font-size:12px; line-height:1.6; color:${theme.textPrimary}; background:${theme.bgInset}; border:1px solid ${theme.border}; border-radius:8px; padding:12px 14px; white-space:pre-wrap;`;
}
function generateBtn(theme: Theme) {
  return `width:100%; box-sizing:border-box; background:${theme.bgElevated}; border:1px solid ${theme.borderStrong}; color:${theme.textPrimary}; border-radius:8px; padding:10px; font-size:12.5px; font-weight:500; cursor:pointer; font-family:${FONT};`;
}
function editableBox(theme: Theme, mono = false) {
  return `width:100%; box-sizing:border-box; font-family:${mono ? MONO : FONT}; font-size:${mono ? "12px" : "13px"}; line-height:1.55; color:${theme.textPrimary}; background:${theme.bgSurface}; border:1px solid ${theme.borderStrong}; border-radius:8px; padding:10px 12px; resize:vertical;`;
}
