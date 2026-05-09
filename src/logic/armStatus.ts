import type { ArmStatus, CheckIn } from "../types";

export interface ArmStatusResult {
  status: ArmStatus;
  title: string;
  reasons: string[];
  recommendation: string;
}

export const mechanicalIssues = [
  "Do not feel legs",
  "Moving but just falling",
  "Momentum not transferring",
  "Timing feels off",
  "Mound feels dead",
  "Falling toward first",
  "Arm feels tight/disconnected",
  "Arm is yellow",
  "Feel great / no issue",
];

export const intentPreferences = [
  "I want to throw today",
  "I want to modify",
  "I just want to review",
];

export function emptyCheckIn(): CheckIn {
  return {
    forearmTightness: 0,
    bicepsTightness: 0,
    elbowPain: 0,
    shoulderPain: 0,
    armFreshness: 4,
    sleepHours: 8,
    bodyFatigue: 2,
    hotRedHandForearm: false,
    nerveSymptoms: false,
    nextMorningSymptoms: false,
    mechanicalIssue: "Feel great / no issue",
    intentPreference: "I want to throw today",
  };
}

export function evaluateArmStatus(checkIn: CheckIn): ArmStatusResult {
  const redReasons: string[] = [];
  const yellowReasons: string[] = [];

  if (checkIn.elbowPain > 2) redReasons.push("Elbow pain is above 2/10.");
  if (checkIn.forearmTightness > 3) redReasons.push("Forearm/brachioradialis tightness is above 3/10.");
  if (checkIn.bicepsTightness > 3) redReasons.push("Biceps/anterior elbow tightness is above 3/10.");
  if (checkIn.shoulderPain > 3) redReasons.push("Shoulder pain is above 3/10.");
  if (checkIn.hotRedHandForearm) redReasons.push("Hot/red hand or forearm is present.");
  if (checkIn.nerveSymptoms) redReasons.push("Numbness, tingling, burning, or zapping is present.");
  if (checkIn.nextMorningSymptoms) redReasons.push("Symptoms carried into the next morning.");

  if (redReasons.length > 0) {
    return {
      status: "red",
      title: "Red - Recover Today",
      reasons: redReasons,
      recommendation: "Recommended: no throwing today. Recovery warmup + arm care only.",
    };
  }

  if (checkIn.forearmTightness >= 2) yellowReasons.push("Forearm tightness is 2-3/10.");
  if (checkIn.bicepsTightness >= 2) yellowReasons.push("Biceps/anterior elbow tightness is 2-3/10.");
  if (checkIn.elbowPain > 0) yellowReasons.push("Elbow pain is present.");
  if (checkIn.shoulderPain === 2 || checkIn.shoulderPain === 3) yellowReasons.push("Shoulder pain is mild/moderate.");
  if (checkIn.armFreshness <= 3) yellowReasons.push("Arm freshness is below green.");
  if (checkIn.sleepHours < 6) yellowReasons.push("Sleep was low.");
  if (checkIn.bodyFatigue >= 4) yellowReasons.push("Body fatigue is high.");
  if (checkIn.mechanicalIssue === "Arm feels tight/disconnected") {
    yellowReasons.push("Mechanics feel guarded or disconnected.");
  }
  if (checkIn.mechanicalIssue === "Arm is yellow") yellowReasons.push("You marked the arm as yellow.");

  if (yellowReasons.length > 0) {
    return {
      status: "yellow",
      title: "Yellow - Downgrade",
      reasons: yellowReasons,
      recommendation:
        "Downgrade today. No mound, pulldowns, high-intent throws, or aggressive plyos. Use dry drills, arm care, med balls, and possibly light catch.",
    };
  }

  return {
    status: "green",
    title: "Green - Follow Plan",
    reasons: ["Arm checks are clean enough to follow the planned session."],
    recommendation: "Follow the planned session.",
  };
}
