import { getStore } from "@netlify/blobs";
import type { Case } from "./cases";

export type Settings = {
  companyName: string;
  githubOrg: string;
  confidenceThreshold: number;
  scanCount: number;
};

const DEFAULT_SETTINGS: Settings = {
  companyName: "ElevenLabs",
  githubOrg: "elevenlabs",
  confidenceThreshold: 0.6,
  scanCount: 0,
};

function casesStore() {
  return getStore("cases");
}
function settingsStore() {
  return getStore("settings");
}

export async function getCases(): Promise<Case[]> {
  const raw = await casesStore().get("cases", { type: "json" });
  return (raw as Case[]) ?? [];
}

export async function saveCases(cases: Case[]): Promise<void> {
  await casesStore().setJSON("cases", cases);
}

export async function getSettings(): Promise<Settings> {
  const raw = await settingsStore().get("settings", { type: "json" });
  return { ...DEFAULT_SETTINGS, ...(raw as Partial<Settings> | null) };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await settingsStore().setJSON("settings", next);
  return next;
}

export async function incrementScanCount(): Promise<void> {
  const current = await getSettings();
  await settingsStore().setJSON("settings", { ...current, scanCount: current.scanCount + 1 });
}
