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
      title: "Plyos - Skip Throws Today",
      summary: "No plyo throws",
      items: ["Skip plyo throws", "Use recovery warmup and arm care only", "Dry lower-half patterning only if pain-free"],
      avoid: ["Aggressive plyos", "High intent", "Adding volume"],
    };
  }

  if (status === "yellow") {
    return {
      title: "Plyos - Skip Throws Today",
      summary: "Dry patterning only if pain-free",
      items: ["Skip plyo throws", "Use dry patterning only if pain-free"],
      avoid: ["Aggressive plyos", "High intent", "Adding volume"],
    };
  }

  if (session.week <= 2) {
    return {
      title: "Plyos - Optional Low Intent",
      summary: "Optional low-intent only",
      items: [
        "Reverse throws - 1x5",
        "Pivot picks - 1x5",
        "Rockers / roll-ins - 1x5",
        "Intent: 40-60%",
      ],
      avoid: ["Max effort", "Forearm/biceps tightness", "Chasing velo", "Adding extra volume"],
      goal: "Early plyos are warmup/movement/constraint tools, not a velocity tool.",
    };
  }

  if (session.week <= 5) {
    return {
      title: "Mechanics Plyos",
      summary: "Low/moderate mechanics primer",
      items: ["Step-backs - 2x5", "Rockers - 2x5", "Walking windups - 2x5", "Intent: 50-70%"],
      avoid: ["High-intent plyos", "Pulldown feel", "Letting the arm lead the move"],
      goal: "Movement patterning and lower-half rhythm, not velocity.",
    };
  }

  if (session.week <= 8) {
    return {
      title: "Movement Bridge Before Mound",
      summary: "Movement bridge before catch or mound",
      items: [
        "Reverse throws - 1x5",
        "Pivot picks - 1x5",
        "Rockers / roll-ins - 1x5",
        "Walking windups - 1x5",
        "Intent: 50-70%",
      ],
      avoid: ["Velo chasing", "Adding mound intensity because plyos feel good"],
      goal: "Get the body sequenced before mound work.",
    };
  }

  return {
    title: "Higher-Intent Plyos Only If Earned",
    summary: "Higher-intent plyos only if earned",
    rules: [
      "Green day only",
      "Previous week clean",
      "1x/week max at first",
      "No next-day symptoms",
      "No forearm/biceps tightness",
      "Do not pair with another max-intent day early",
    ],
    items: ["Step-backs - 2x5", "Rockers - 2x5", "Walking windups - 2x5", "Intent: phase dependent, never reckless"],
    avoid: ["Stacking max intent", "Plyos after symptoms appear", "Chasing a number"],
    goal: "Early high-intent work is earned. Never use plyos to force velocity.",
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
