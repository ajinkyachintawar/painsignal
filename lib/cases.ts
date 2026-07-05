import type { Signal } from "./signals";
import type { CaseStatus } from "./theme";

export type Diagnosis = {
  is_real_complaint: boolean;
  confidence: number;
  product_area: string;
  root_cause: string;
  fix: string;
};

export type Case = {
  signal: Signal;
  status: CaseStatus;
  diagnosis: Diagnosis | null;
  script: string | null;
  videoUrl: string | null;
  error: string | null;
  createdAt: number;
};

export function formatTimeAgo(createdAt: number, now: number): string {
  const diffMs = now - createdAt;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}h`;
}
