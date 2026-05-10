import type { AdjustedSession, ArmStatus, Drill, SessionPlan } from "../types";
import {
  cooldownDetails,
  fullThrowingWarmupDetails,
  noThrowRecoveryWarmupDetails,
  type DailyDetailSection,
  yellowArmWarmupDetails,
} from "../data/warmups";

export interface PlyoPlan {
  title: string;
  summary: string;
  items: string[];
  avoid: string[];
  goal?: string;
  rules?: string[];
}

export function warmupNameForSession(session: SessionPlan, adjusted?: AdjustedSession): string {
  if (adjusted?.warmup) return adjusted.warmup;
  if (session.dayType === "Full Off" || session.dayType === "Recovery / Arm-Care") {
    return "No-Throw Recovery Warmup";
  }
  return session.mound ? "Pre-Mound Warmup" : "Full Throwing Warmup";
}

export function warmupDetailsForSession(session: SessionPlan, adjusted?: AdjustedSession): DailyDetailSection[] {
  const warmupName = warmupNameForSession(session, adjusted);
  if (warmupName.includes("Yellow")) return yellowArmWarmupDetails;
  if (warmupName.includes("No-Throw") || warmupName.includes("Recovery")) return noThrowRecoveryWarmupDetails;
  return fullThrowingWarmupDetails;
}

export function cooldownDetailsForSession(): DailyDetailSection[] {
  return cooldownDetails;
}

export function plyoPlanForSession(session: SessionPlan, status: ArmStatus | "not checked" = "not checked"): PlyoPlan {
  if (status === "red") {
    return {
      title: "Plyos - No Throwing Plyos",
      summary: "Recovery only.",
      items: ["Arm-care circuit", "Dry movement only if pain-free"],
      avoid: ["Plyo throws", "High intent", "Adding volume"],
    };
  }

  if (status === "yellow") {
    return {
      title: "Plyos - Skip Throws Today",
      summary: "Protect the arm, train the body.",
      items: ["Dry loading pattern - 2x5", "Dry drift reps - 2x5", "Low-intent dry movement only"],
      avoid: ["Aggressive plyos", "High intent", "Adding volume"],
    };
  }

  if (session.week <= 2) {
    return {
      title: "Plyos - Optional Low Intent",
      summary: "Movement prep, not velocity work.",
      items: [
        "Reverse throws - 1x5",
        "Pivot picks - 1x5",
        "Rockers / roll-ins - 1x5",
        "Intent: 40-60%",
      ],
      avoid: ["Max effort", "Forearm/biceps tightness", "Chasing velo", "Adding extra volume"],
      goal: "Early plyos are not a velocity tool. They are warmup/movement/constraint tools.",
    };
  }

  if (session.week <= 5) {
    return {
      title: "Mechanics Plyos",
      summary: "Movement patterning and lower-half rhythm, not velocity.",
      items: ["Step-backs - 2x5", "Rockers - 2x5", "Walking windups - 2x5", "Intent: 50-70%"],
      avoid: ["High-intent plyos", "Pulldown feel", "Letting the arm lead the move"],
      goal: "Early plyos are not a velocity tool. They are warmup/movement/constraint tools.",
    };
  }

  if (session.week <= 8) {
    return {
      title: "Movement Bridge Before Mound",
      summary: "Get the body sequenced before mound work.",
      items: [
        "Reverse throws - 1x5",
        "Pivot picks - 1x5",
        "Rockers / roll-ins - 1x5",
        "Walking windups - 1x5",
        "Intent: 50-70%",
      ],
      avoid: ["Velo chasing", "Adding mound intensity because plyos feel good"],
      goal: "Early plyos are not a velocity tool. They are warmup/movement/constraint tools.",
    };
  }

  return {
    title: "Higher-Intent Plyos Only If Earned",
    summary: "Only on clean green days.",
    rules: [
      "Green day only",
      "Previous week clean",
      "1x/week max at first",
      "No next-day symptoms",
      "No forearm/biceps tightness",
      "Do not pair with another max-intent day early",
    ],
    items: ["Step-backs - 2x5", "Rockers - 2x5", "Walking windups - 2x5", "Intent: phase dependent, never reckless"],
    avoid: ["Pairing with another max-intent day early", "Using plyos to chase radar"],
    goal: "Early plyos are not a velocity tool. They are warmup/movement/constraint tools.",
  };
}

export function drillSummary(drillIds: string[], drills: Drill[]): string {
  const names = drillIds
    .map((id) => drills.find((drill) => drill.id === id)?.name)
    .filter(Boolean) as string[];
  return names.length ? names.join(", ") : "No drills planned";
}

export function selectedDrills(drillIds: string[], drills: Drill[]): Drill[] {
  return drillIds.map((id) => drills.find((drill) => drill.id === id)).filter(Boolean) as Drill[];
}
