import type { AdjustedSession, ArmStatus, SessionPlan } from "../types";

export interface MechanicalPlan {
  drillIds: string[];
  cue: string;
}

export const mechanicalIssueMap: Record<string, MechanicalPlan> = {
  "Do not feel legs": {
    drillIds: ["loading-hinge", "trx-drift", "step-back-throws"],
    cue: "Create pressure early.",
  },
  "Moving but just falling": {
    drillIds: ["trx-drift", "dynamic-rocker", "walking-windup"],
    cue: "Ride the drift.",
  },
  "Momentum not transferring": {
    drillIds: ["rocker-throws", "roll-in-throws", "lead-leg-patterning"],
    cue: "Catch the move.",
  },
  "Timing feels off": {
    drillIds: ["rhythm-rocker", "ten-toes", "pivot-pickoff"],
    cue: "Hips start, trunk waits.",
  },
  "Mound feels dead": {
    drillIds: ["step-back-mound", "controlled-stretch", "low-intent-bullpen"],
    cue: "Same athletic move, smaller window.",
  },
  "Falling toward first": {
    drillIds: ["dynamic-rocker", "rocker-throws", "lead-leg-patterning"],
    cue: "Rotate through, do not leak off.",
  },
  "Arm feels tight/disconnected": {
    drillIds: ["pendulum", "lasso", "rhythm-rocker"],
    cue: "Arm loose, body starts.",
  },
  "Arm is yellow": {
    drillIds: [
      "dry-loading-hinge",
      "dry-drift-reps",
      "med-ball-scoop",
      "med-ball-lead-leg",
      "arm-care-circuit",
    ],
    cue: "Protect the arm, train the body.",
  },
  "Feel great / no issue": {
    drillIds: [],
    cue: "",
  },
};

const yellowAvoid = ["Mound", "Pulldowns", "High-intent throws", "Aggressive plyos"];
const redAvoid = ["Baseball throws", "Mound", "Pulldowns", "High-intent throws", "Aggressive plyos"];

export function buildAdjustedSession(
  plannedSession: SessionPlan,
  status: ArmStatus,
  mechanicalIssue: string,
): AdjustedSession {
  const mechanical = mechanicalIssueMap[mechanicalIssue] ?? mechanicalIssueMap["Feel great / no issue"];
  const issueDrills = mechanical.drillIds.length > 0 ? mechanical.drillIds : plannedSession.drillIds;
  const mainCue = mechanical.cue || plannedSession.mainCue;

  if (status === "green") {
    return {
      status,
      statusTitle: "Green - Follow Plan",
      recommendation:
        mechanicalIssue === "Feel great / no issue"
          ? "Follow the planned session."
          : "Follow the planned session and bias the drill block toward today's mechanical issue.",
      dayType: plannedSession.dayType,
      goal: plannedSession.goal,
      warmup: plannedSession.mound ? "Pre-Mound Warmup" : "Full Throwing Warmup",
      throwing: `${plannedSession.throws} throws, ${plannedSession.distanceFt} ft, ${plannedSession.intent}.`,
      plyoGuidance: plannedSession.plyoGuidance,
      drillIds: issueDrills,
      mainCue,
      avoid: ["Adding extra volume", "Chasing a radar number", "More than one main cue"],
      logAfter: ["Arm response", "One cue quality", "Next-morning symptoms"],
      note: "This is guidance, not a restriction. You can still follow or edit any session.",
    };
  }

  if (status === "red") {
    return {
      status,
      statusTitle: "Red - No Throw Recommended",
      recommendation: "Recommended: no throwing today. Recovery warmup + arm care only.",
      dayType: "Recovery / Arm-Care",
      goal: "Calm symptoms, keep the body moving, and protect tomorrow.",
      warmup: "No-Throw Recovery Warmup",
      throwing: "No baseball throws recommended.",
      plyoGuidance: "No plyos. Dry lower-half patterning only if pain-free.",
      drillIds: ["arm-care-circuit", "dry-loading-hinge", "dry-drift-reps"],
      mainCue: "Protect the arm, train the body.",
      avoid: redAvoid,
      logAfter: ["What symptom drove the red day", "What helped it calm down", "Next-morning response"],
      note: "This is guidance, not a restriction. You can still review or manually edit any session.",
    };
  }

  const yellow = yellowAdjustment(plannedSession.dayType);

  return {
    status,
    statusTitle: "Yellow - Downgraded Session",
    recommendation: yellow.recommendation,
    dayType: yellow.dayType,
    goal: yellow.goal,
    warmup: "Yellow-Arm Warmup",
    throwing: yellow.throwing,
    plyoGuidance: "Low-intent dry movement only. Skip aggressive plyos.",
    drillIds: mechanicalIssue === "Feel great / no issue" ? yellow.drillIds : issueDrills,
    mainCue: mechanicalIssue === "Feel great / no issue" ? yellow.cue : mainCue,
    avoid: yellowAvoid,
    logAfter: ["Symptoms before and after", "Whether warmup cleared symptoms", "Next-morning response"],
    note: "This is guidance, not a restriction. You can still follow or edit any session.",
  };
}

function yellowAdjustment(dayType: string) {
  if (dayType === "Recovery Catch") {
    return {
      dayType: "Recovery Catch or Dry Arm-Care",
      recommendation: "Shorten catch or use dry drills only.",
      goal: "Keep the arm calm while maintaining rhythm.",
      throwing: "Optional 10-20 very light throws at 45-60 ft only if symptoms clear.",
      drillIds: ["dry-loading-hinge", "dry-drift-reps", "arm-care-circuit"],
      cue: "Smooth and quiet.",
    };
  }

  if (dayType === "Mechanics Catch") {
    return {
      dayType: "Dry Mechanics + Optional Light Catch",
      recommendation: "Use dry drills plus light catch only if symptoms clear.",
      goal: "Train the pattern without pushing the arm.",
      throwing: "Optional 15-20 very light throws at 45-60 ft, 30-45% intent.",
      drillIds: ["dry-loading-hinge", "dry-drift-reps", "med-ball-scoop", "arm-care-circuit"],
      cue: "Protect the arm, train the body.",
    };
  }

  if (dayType === "Medium Build Day") {
    return {
      dayType: "Recovery Catch or Dry Mechanics",
      recommendation: "Downgrade from build work to recovery catch or dry mechanics.",
      goal: "Hold capacity without adding stress.",
      throwing: "Optional 15-25 light throws at 45-75 ft, 35-50% intent.",
      drillIds: ["dry-drift-reps", "rhythm-rocker", "arm-care-circuit"],
      cue: "Less is the win.",
    };
  }

  if (dayType === "Mound Transfer Day") {
    return {
      dayType: "Flat-Ground Mechanics or Recovery Catch",
      recommendation: "No mound. Use flat-ground mechanics or recovery catch only.",
      goal: "Protect the arm and keep the delivery feel simple.",
      throwing: "No mound. Optional 15-25 light flat-ground throws at 45-75 ft.",
      drillIds: ["dry-loading-hinge", "dry-drift-reps", "lead-leg-patterning", "arm-care-circuit"],
      cue: "Same move, lower stress.",
    };
  }

  if (dayType === "High-Intent / Velo Day") {
    return {
      dayType: "Medium Catch or Recovery Catch",
      recommendation: "Skip high intent. Use medium catch or recovery catch only.",
      goal: "Preserve the week by avoiding intensity.",
      throwing: "Optional 15-30 light/moderate throws. No high-intent exposure.",
      drillIds: ["rhythm-rocker", "pendulum", "arm-care-circuit"],
      cue: "Fast later, clean today.",
    };
  }

  return {
    dayType: "Recovery / Arm-Care",
    recommendation: "Keep this as recovery warmup, arm care, and dry movement.",
    goal: "Let the arm rebound.",
    throwing: "No required throws. Optional very light catch only if symptoms clear.",
    drillIds: ["arm-care-circuit", "dry-loading-hinge", "dry-drift-reps"],
    cue: "Hold the line.",
  };
}
