import type { CheckInRecord, Drill, SessionPlan, Settings, TrainingLog } from "../types";

export const storageKeys = {
  plan: "summerRedline_plan",
  logs: "summerRedline_logs",
  settings: "summerRedline_settings",
  drills: "summerRedline_drills",
  checkIns: "summerRedline_checkins",
};

export interface AppBackup {
  version: 1;
  exportedAt: string;
  settings: Settings;
  plan: SessionPlan[];
  logs: TrainingLog[];
  drills: Drill[];
  checkIns: CheckInRecord[];
}

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeSummerRedlineData(): void {
  Object.values(storageKeys).forEach((key) => localStorage.removeItem(key));
}
