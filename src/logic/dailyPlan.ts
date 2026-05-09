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
      title: "Plyos",
      summary: "Skip plyo throws today",
      items: ["Use recovery warmup and arm care only.", "Dry lower-half patterning only if pain-free."],
      avoid: ["Plyo throws", "Baseball throws", "Aggressive intent"],
    };
  }

  if (status === "yellow") {
    return {
      title: "Plyos",
      summary: "Skip plyo throws today or use dry patterning only",
      items: ["Dry loading or dry drift reps only.", "Recheck symptoms before any optional light catch."],
      avoid: ["Plyo throws", "Mound", "Pulldowns", "High intent"],
    };
  }

  if (session.week <= 2) {
    return {
      title: "Plyos",
      summary: "Optional low-intent only",
      items: [
        "Reverse throws - 1x5",
        "Pivot picks - 1x5",
        "Rockers or roll-ins - 1x5",
        "Intent: 40-60%",
      ],
      avoid: ["Max effort", "Forearm/biceps tightness", "Using plyos to chase velo"],
    };
  }

  if (session.week <= 5) {
    return {
      title: "Plyos",
      summary: "Low/moderate mechanics primer",
      items: ["Step-backs - 2x5", "Rockers - 2x5", "Walking windups - 2x5", "Intent: 50-70%"],
      avoid: ["High-intent plyos", "Pulldown feel", "Letting the arm lead the move"],
    };
  }

  if (session.week <= 8) {
    return {
      title: "Plyos",
      summary: "Movement bridge before catch or mound",
      items: [
        "Reverse throws - 1x5",
        "Pivot picks - 1x5",
        "Rockers/roll-ins - 1x5",
        "Walking windups - 1x5",
        "Intent: 50-70%",
      ],
      avoid: ["Velo chasing", "Adding mound intensity because plyos feel good"],
    };
  }

  return {
    title: "Plyos",
    summary: "Higher-intent plyos only if earned",
    items: [
      "Green day only",
      "Previous week clean",
      "1x/week max at first",
      "No next-day symptoms",
      "No forearm/biceps tightness",
      "Do not pair with another max-intent day early",
    ],
    avoid: ["Stacking max intent", "Plyos after symptoms appear", "Chasing a number"],
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
