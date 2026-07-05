import type { Signal } from "./signals";
import type { CaseStatus } from "./theme";

export type Diagnosis = {
  is_real_complaint: boolean;
  confidence: number;
  product_area: string;
  root_cause: string;
  fix: string;
  grounded: boolean;
};

export type Case = {
  signal: Signal;
  status: CaseStatus;
  diagnosis: Diagnosis | null;
  script: string | null;
  videoUrl: string | null;
  heygenVideoId: string | null;
  error: string | null;
  createdAt: number;
  sentAs: "text" | "video" | null;
  edited: boolean;
};

// Derived from real persisted data (not a client-side click counter), so it reflects
// background scheduled scans too, not just this browser tab's actions.
export function computeApiUsage(cases: Case[], scanCount: number) {
  const llm = cases.reduce((sum, c) => sum + (c.diagnosis ? 1 : 0) + (c.script ? 1 : 0), 0);
  const video = cases.filter((c) => c.heygenVideoId).length;
  return { search: scanCount, llm, video };
}

export function formatTimeAgo(createdAt: number, now: number): string {
  const diffMs = now - createdAt;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}h`;
}
