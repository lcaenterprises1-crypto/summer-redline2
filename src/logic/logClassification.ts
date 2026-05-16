import type { TrainingLog } from "../types";

export type LogLane = "throwing" | "hitting" | "physical" | "recovery" | "unknown";

const hittingTypes = ["recovery / feel", "contact quality", "game transfer", "bat speed", "ev / damage", "microdose", "game prep", "minimum hitting"];
const physicalTypes = ["main strength", "upper + trunk", "speed + power", "maintenance lift", "power primer", "recovery / tissue", "knee capacity", "arm care", "mobility / recovery", "physical"];
const throwingTerms = ["throw", "throwing", "pitch", "pitching", "bullpen", "mound", "catch", "velo", "flat-ground", "flat ground"];

export function classifyLog(log: TrainingLog): LogLane {
  if (log.lane === "throwing" || log.lane === "hitting" || log.lane === "physical" || log.lane === "recovery") return log.lane;

  const text = logText(log);

  if (safeNumber(log.totalThrows) > 0 || safeNumber(log.moundPitches) > 0 || safeNumber(log.highIntentThrows) > 0 || safeNumber(log.maxDistanceFt) > 0) {
    return "throwing";
  }

  if (hittingTypes.some((term) => text.includes(term)) || text.includes("hitting")) return "hitting";
  if (physicalTypes.some((term) => text.includes(term))) return "physical";
  if (text.includes("recovery") || text.includes("arm-care") || text.includes("arm care") || text.includes("mobility")) return "recovery";
  if (throwingTerms.some((term) => text.includes(term))) return "throwing";

  return "unknown";
}

export function isThrowingTrainingLog(log: TrainingLog): boolean {
  return classifyLog(log) === "throwing";
}

export function isHittingTrainingLog(log: TrainingLog): boolean {
  return classifyLog(log) === "hitting";
}

export function isPhysicalTrainingLog(log: TrainingLog): boolean {
  return classifyLog(log) === "physical";
}

export function isRecoveryTrainingLog(log: TrainingLog): boolean {
  return classifyLog(log) === "recovery";
}

export function isHighIntentHittingExposure(log: TrainingLog): boolean {
  if (!isHittingTrainingLog(log)) return false;
  const sessionType = laneText(log, "sessionType").toLowerCase();
  const intent = laneText(log, "intent").toLowerCase();
  return (
    sessionType.includes("bat speed") ||
    sessionType.includes("ev / damage") ||
    (sessionType.includes("microdose") && (intent.includes("medium-high") || intent.includes("high"))) ||
    intent === "high" ||
    laneNumber(log, "maxEv") > 0 ||
    laneNumber(log, "blastBatSpeed") > 0 ||
    laneNumber(log, "balls95") > 0 ||
    log.laneData?.highIntent === true
  );
}

export function laneText(log: TrainingLog, key: string): string {
  const value = log.laneData?.[key];
  return typeof value === "string" ? value : "";
}

export function laneNumber(log: TrainingLog, key: string): number {
  const value = log.laneData?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function logText(log: TrainingLog): string {
  return [
    log.lane,
    log.phase,
    log.plannedDayType,
    log.actualDayType,
    log.mainCue,
    log.notes,
    laneText(log, "sessionType"),
    laneText(log, "type"),
    laneText(log, "category"),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function safeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
