import type { AppBackup } from "./storage";
import type { Drill, TrainingLog } from "../types";

function downloadText(filename: string, text: string, type: string): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvValue(value: unknown): string {
  const text = value === undefined || value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function exportLogsCsv(logs: TrainingLog[], drills: Drill[]): void {
  const drillNames = new Map(drills.map((drill) => [drill.id, drill.name]));
  const headers = [
    "date",
    "lane",
    "phase",
    "plannedDayType",
    "actualDayType",
    "armStatus",
    "totalThrows",
    "highIntentThrows",
    "moundPitches",
    "maxDistanceFt",
    "intentRange",
    "drillsUsed",
    "mainCue",
    "forearmTightnessAfter",
    "bicepsTightnessAfter",
    "painDuring",
    "painOneHourAfter",
    "hotRedHandForearm",
    "nextMorningSymptoms",
    "notes",
    "decision",
  ];

  const rows = logs.map((log) =>
    [
      log.date,
      log.lane ?? "throwing",
      log.phase,
      log.plannedDayType,
      log.actualDayType,
      log.armStatus,
      log.totalThrows,
      log.highIntentThrows,
      log.moundPitches,
      log.maxDistanceFt,
      log.intentRange,
      (log.drillIds ?? []).map((id) => drillNames.get(id) ?? id).join(" | "),
      log.mainCue,
      log.forearmTightnessAfter,
      log.bicepsTightnessAfter,
      log.painDuring,
      log.painOneHourAfter,
      log.hotRedHandForearm,
      log.nextMorningSymptoms,
      log.notes,
      log.decision,
    ].map(csvValue),
  );

  const csv = [headers.map(csvValue), ...rows].map((row) => row.join(",")).join("\n");
  downloadText("summer-redline-logs.csv", csv, "text/csv;charset=utf-8");
}

export function exportBackupJson(backup: AppBackup): void {
  downloadText("summer-redline-backup.json", JSON.stringify(backup, null, 2), "application/json");
}
