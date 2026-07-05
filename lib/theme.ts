export type Mode = "dark" | "light";

export const THEMES = {
  dark: {
    bg: "oklch(0.16 0.004 260)",
    bgSidebar: "oklch(0.145 0.004 260)",
    bgSurface: "oklch(0.19 0.005 260)",
    bgSurfaceAlt: "oklch(0.17 0.005 260)",
    bgElevated: "oklch(0.235 0.006 260)",
    bgHover: "oklch(0.225 0.006 260)",
    bgInset: "oklch(0.20 0.006 260)",
    border: "oklch(0.34 0.006 260 / 0.55)",
    borderStrong: "oklch(0.4 0.006 260 / 0.8)",
    textPrimary: "oklch(0.90 0.004 260)",
    textSecondary: "oklch(0.66 0.006 260)",
    textMuted: "oklch(0.5 0.006 260)",
    accent: "oklch(0.60 0.085 250)",
    accentBg: "oklch(0.60 0.085 250 / 0.15)",
    accentText: "oklch(0.15 0.015 250)",
    success: "oklch(0.62 0.09 155)",
    successBg: "oklch(0.62 0.09 155 / 0.14)",
    warning: "oklch(0.7 0.1 78)",
    warningBg: "oklch(0.7 0.1 78 / 0.14)",
    purple: "oklch(0.62 0.09 300)",
    purpleBg: "oklch(0.62 0.09 300 / 0.14)",
    teal: "oklch(0.64 0.08 195)",
    tealBg: "oklch(0.64 0.08 195 / 0.14)",
    danger: "oklch(0.6 0.1 25)",
    github: "oklch(0.68 0.006 260)",
    hn: "oklch(0.65 0.1 55)",
    reddit: "oklch(0.62 0.1 35)",
    shadow: "0 24px 48px oklch(0.04 0 0 / 0.45)",
  },
  light: {
    bg: "oklch(0.975 0.003 260)",
    bgSidebar: "oklch(0.955 0.004 260)",
    bgSurface: "oklch(1 0 0)",
    bgSurfaceAlt: "oklch(0.955 0.004 260)",
    bgElevated: "oklch(0.92 0.005 260)",
    bgHover: "oklch(0.94 0.005 260)",
    bgInset: "oklch(0.965 0.004 260)",
    border: "oklch(0.85 0.006 260 / 0.9)",
    borderStrong: "oklch(0.76 0.006 260)",
    textPrimary: "oklch(0.22 0.006 260)",
    textSecondary: "oklch(0.46 0.008 260)",
    textMuted: "oklch(0.6 0.008 260)",
    accent: "oklch(0.5 0.1 250)",
    accentBg: "oklch(0.5 0.1 250 / 0.10)",
    accentText: "oklch(0.98 0.006 250)",
    success: "oklch(0.48 0.09 155)",
    successBg: "oklch(0.48 0.09 155 / 0.12)",
    warning: "oklch(0.56 0.11 75)",
    warningBg: "oklch(0.56 0.11 75 / 0.13)",
    purple: "oklch(0.5 0.1 300)",
    purpleBg: "oklch(0.5 0.1 300 / 0.12)",
    teal: "oklch(0.48 0.08 195)",
    tealBg: "oklch(0.48 0.08 195 / 0.12)",
    danger: "oklch(0.5 0.13 25)",
    github: "oklch(0.4 0.006 260)",
    hn: "oklch(0.5 0.11 55)",
    reddit: "oklch(0.48 0.11 35)",
    shadow: "0 24px 48px oklch(0.4 0 0 / 0.16)",
  },
} as const;

export type Theme = { [K in keyof (typeof THEMES)["dark"]]: string };

export const FONT = "'IBM Plex Sans',sans-serif";
export const MONO = "'IBM Plex Mono',monospace";

export type CaseStatus = "triaging" | "rejected" | "ready" | "video-pending" | "video-ready" | "sent";

export function statusMeta(theme: Theme): Record<Exclude<CaseStatus, "rejected">, { label: string; color: string; bg: string }> {
  return {
    triaging: { label: "Triaging", color: theme.warning, bg: theme.warningBg },
    ready: { label: "Ready", color: theme.accent, bg: theme.accentBg },
    "video-pending": { label: "Video pending", color: theme.purple, bg: theme.purpleBg },
    "video-ready": { label: "Video ready", color: theme.teal, bg: theme.tealBg },
    sent: { label: "Sent", color: theme.success, bg: theme.successBg },
  };
}

export const SOURCE_KEYS = ["GitHub", "Hacker News", "Reddit", "Web"] as const;

export function sourceColor(theme: Theme, source: string): string {
  if (source === "GitHub") return theme.github;
  if (source === "Hacker News") return theme.hn;
  if (source === "Reddit") return theme.reddit;
  return theme.textSecondary;
}
