import type { SessionPlan } from "../types";

type TemplateDay = Omit<SessionPlan, "id" | "date" | "week" | "phase">;

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function parseLocalDate(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function defaultStartDate(today = new Date()): string {
  const year = today.getFullYear();
  const midMay = new Date(year, 4, 13, 12);
  const june = new Date(year, 5, 1, 12);

  if (today < midMay) return toIsoDate(midMay);
  if (today < june) return toIsoDate(today);
  return toIsoDate(midMay);
}

export function addDays(iso: string, days: number): string {
  const date = parseLocalDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function formatDisplayDate(iso: string, options?: Intl.DateTimeFormatOptions): string {
  return parseLocalDate(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...options,
  });
}

export function weekFromDate(dateIso: string, startDateIso: string): number {
  const diff = parseLocalDate(dateIso).getTime() - parseLocalDate(startDateIso).getTime();
  return Math.floor(diff / MS_PER_DAY / 7) + 1;
}

export function phaseForWeek(week: number): string {
  if (week <= 2) return "Phase 1 - Restore + Patterning";
  if (week <= 5) return "Phase 2 - Capacity + Mechanics Build";
  if (week <= 8) return "Phase 3 - Flat-Ground + Mound Reintroduction";
  if (week <= 11) return "Phase 4 - Mound Transfer + Controlled Velo Build";
  return "Phase 5 - Higher Intent + Maintain Health";
}

function defaultGoalForWeek(week: number): string {
  if (week <= 2) return "Arm feels clean, low-intent throwing returns, lower-half feel begins.";
  if (week <= 5) return "Build throwing volume, keep arm clean, improve lower-half pattern.";
  if (week <= 8) return "Transfer mechanics into controlled pitching without chasing velo.";
  if (week <= 11) return "Convert athleticism and arm speed to mound velo while protecting the arm.";
  return "Sharpen mound output while keeping the arm healthy.";
}

function throwingDefaults(week: number) {
  const values = [
    { throws: "20-35", distanceFt: "45-60", intent: "40-55%" },
    { throws: "30-45", distanceFt: "60-90", intent: "50-60%" },
    { throws: "40-55", distanceFt: "Up to 90", intent: "50-65%" },
    { throws: "45-65", distanceFt: "90-120", intent: "55-70%" },
    { throws: "50-70", distanceFt: "120-150", intent: "60-75%" },
    { throws: "50-75", distanceFt: "120-150", intent: "60-75%" },
    { throws: "45-70", distanceFt: "90-150", intent: "50-70%" },
    { throws: "50-75", distanceFt: "120-150", intent: "60-75%" },
    { throws: "55-80", distanceFt: "120-180", intent: "65-80%" },
    { throws: "55-85", distanceFt: "120-180", intent: "70-85%" },
    { throws: "55-85", distanceFt: "120-180", intent: "75-90% if clean" },
    { throws: "55-85", distanceFt: "120-180", intent: "70-90% if clean" },
    { throws: "50-80", distanceFt: "120-180", intent: "70-90% if clean" },
  ];

  return values[week - 1] ?? values[0];
}

const noThrow: Pick<TemplateDay, "throws" | "distanceFt" | "intent" | "mound"> = {
  throws: "0",
  distanceFt: "0",
  intent: "0%",
  mound: false,
};

function make(
  week: number,
  template: Partial<TemplateDay> & Pick<TemplateDay, "dayType" | "focus" | "mainCue" | "drillIds">,
): TemplateDay {
  const base = throwingDefaults(week);
  const isNoThrow =
    template.dayType === "Full Off" ||
    template.dayType === "Recovery / Arm-Care" ||
    template.dayType === "Lift / Med Balls / No Throw";

  return {
    dayType: template.dayType,
    focus: template.focus,
    goal: template.goal ?? defaultGoalForWeek(week),
    throws: template.throws ?? (isNoThrow ? noThrow.throws : base.throws),
    distanceFt: template.distanceFt ?? (isNoThrow ? noThrow.distanceFt : base.distanceFt),
    intent: template.intent ?? (isNoThrow ? noThrow.intent : base.intent),
    mound: template.mound ?? false,
    plyoGuidance: template.plyoGuidance ?? plyoForWeek(week, isNoThrow),
    mainCue: template.mainCue,
    drillIds: template.drillIds,
    notes: template.notes,
  };
}

function plyoForWeek(week: number, isNoThrow: boolean): string {
  if (isNoThrow) return "No plyos needed. Optional dry movement only if it helps.";
  if (week <= 1) return "Optional low-intent only on green days.";
  if (week <= 2) return "Optional low-intent warmup plyos on green days.";
  if (week <= 5) return "Low/moderate mechanics primer. No high-intent plyos.";
  if (week <= 8) return "Use plyos before mound or catch as a movement bridge.";
  return "Higher-intent plyos only if green and earned. Start 1x/week max.";
}

function weekTemplates(week: number): TemplateDay[] {
  if (week === 1) {
    return [
      make(week, {
        dayType: "Mechanics Catch",
        focus: "Back-Leg Tension",
        goal: "Build arm tolerance and feel back-leg pressure.",
        mainCue: "Create pressure early.",
        drillIds: ["loading-hinge", "trx-drift", "step-back-throws"],
        notes: "No mound, pulldowns, aggressive long toss, or breaking balls.",
      }),
      make(week, {
        dayType: "Recovery / Arm-Care",
        focus: "Tissue quality + easy movement",
        mainCue: "Keep the arm quiet.",
        drillIds: ["arm-care-circuit", "dry-loading-hinge"],
      }),
      make(week, {
        dayType: "Recovery Catch",
        focus: "Easy rhythm",
        throws: "15-25",
        distanceFt: "45-60",
        intent: "35-50%",
        mainCue: "Loose arm, smooth feet.",
        drillIds: ["rhythm-rocker", "pendulum"],
      }),
      make(week, {
        dayType: "Full Off",
        focus: "Recover",
        mainCue: "Do less well.",
        drillIds: ["arm-care-circuit"],
      }),
      make(week, {
        dayType: "Mechanics Catch",
        focus: "Drift/Control",
        mainCue: "Ride the drift.",
        drillIds: ["trx-drift", "dynamic-rocker", "rhythm-rocker"],
      }),
      make(week, {
        dayType: "Lift / Med Balls / No Throw",
        focus: "Lower-half patterning",
        mainCue: "Train the body, spare the arm.",
        drillIds: ["med-ball-scoop", "med-ball-lead-leg", "dry-drift-reps"],
      }),
      make(week, {
        dayType: "Full Off",
        focus: "Recover",
        mainCue: "Let clean work absorb.",
        drillIds: ["arm-care-circuit"],
      }),
    ];
  }

  if (week === 2) {
    return [
      make(week, {
        dayType: "Mechanics Catch",
        focus: "Back-Leg Tension",
        mainCue: "Create pressure early.",
        drillIds: ["loading-hinge", "step-back-throws", "rhythm-rocker"],
      }),
      make(week, {
        dayType: "Recovery / Arm-Care",
        focus: "Arm care + mobility",
        mainCue: "Clean beats more.",
        drillIds: ["arm-care-circuit", "dry-loading-hinge"],
      }),
      make(week, {
        dayType: "Recovery Catch",
        focus: "Easy catch progression",
        throws: "20-30",
        distanceFt: "45-75",
        intent: "40-55%",
        mainCue: "Loose arm, body starts.",
        drillIds: ["pendulum", "rhythm-rocker"],
      }),
      make(week, {
        dayType: "Full Off",
        focus: "Recover",
        mainCue: "No make-up throws.",
        drillIds: ["arm-care-circuit"],
      }),
      make(week, {
        dayType: "Mechanics Catch",
        focus: "Drift/Control",
        mainCue: "Ride the drift.",
        drillIds: ["trx-drift", "dynamic-rocker", "walking-windup"],
      }),
      make(week, {
        dayType: "Lift / Med Balls / No Throw",
        focus: "Med-ball patterning",
        mainCue: "Rotate through the block.",
        drillIds: ["med-ball-scoop", "med-ball-lead-leg"],
      }),
      make(week, {
        dayType: "Full Off",
        focus: "Recover",
        mainCue: "Win the next morning.",
        drillIds: ["arm-care-circuit"],
      }),
    ];
  }

  if (week >= 3 && week <= 5) {
    const fourthThrowDay = week >= 5;
    return [
      make(week, {
        dayType: "Mechanics Catch",
        focus: "Back-Leg Tension",
        mainCue: "Create pressure early.",
        drillIds: ["loading-hinge", "trx-drift", "step-back-throws"],
      }),
      make(week, {
        dayType: "Recovery / Arm-Care",
        focus: "Arm care + trunk mobility",
        mainCue: "Let the arm rebound.",
        drillIds: ["arm-care-circuit", "dry-drift-reps"],
      }),
      make(week, {
        dayType: "Medium Build Day",
        focus: "Drift/Control",
        mainCue: "Ride the move.",
        drillIds: ["dynamic-rocker", "walking-windup", "rhythm-rocker"],
        notes: "No high-intent pulldowns.",
      }),
      make(week, {
        dayType: "Full Off",
        focus: "Recover",
        mainCue: "No make-up throws.",
        drillIds: ["arm-care-circuit"],
      }),
      make(week, {
        dayType: "Mechanics Catch",
        focus: "Lead-Leg Patterning",
        mainCue: "Catch the move.",
        drillIds: ["rocker-throws", "lead-leg-patterning", "ten-toes"],
      }),
      fourthThrowDay
        ? make(week, {
            dayType: "Recovery Catch",
            focus: "Easy volume",
            throws: "20-35",
            distanceFt: "60-90",
            intent: "40-55%",
            mainCue: "Smooth catch, clean next day.",
            drillIds: ["pendulum", "rhythm-rocker"],
          })
        : make(week, {
            dayType: "Lift / Med Balls / No Throw",
            focus: "Lower-half strength transfer",
            mainCue: "Firm, athletic front side.",
            drillIds: ["med-ball-scoop", "med-ball-lead-leg"],
          }),
      make(week, {
        dayType: "Full Off",
        focus: "Recover",
        mainCue: "Earn the next week.",
        drillIds: ["arm-care-circuit"],
      }),
    ];
  }

  if (week >= 6 && week <= 8) {
    const moundDay =
      week === 6
        ? make(week, {
            dayType: "Mechanics Catch",
            focus: "Dry Mound Transfer",
            throws: "40-60",
            distanceFt: "90-120",
            intent: "55-70%",
            mound: false,
            mainCue: "Same move on flat ground.",
            drillIds: ["controlled-stretch", "rhythm-rocker", "lead-leg-patterning"],
            notes: "Dry mound only if it helps. No true mound pitches yet.",
          })
        : make(week, {
            dayType: "Mound Transfer Day",
            focus: "Controlled Fastballs",
            throws: week === 7 ? "10-20 mound fastballs + catch" : "15-25 mound fastballs + catch",
            distanceFt: "Mound",
            intent: week === 7 ? "50-65%" : "60-70%",
            mound: true,
            plyoGuidance: "Green-day plyo primer before mound as a movement bridge.",
            mainCue: "One clean move.",
            drillIds: ["step-back-mound", "controlled-stretch", "low-intent-bullpen"],
            notes: "Fastballs only. No velo chasing.",
          });

    return [
      make(week, {
        dayType: "Mechanics Catch",
        focus: "Lead-Leg Block",
        mainCue: "Land athletic, firm, rotate.",
        drillIds: ["rocker-throws", "roll-in-throws", "lead-leg-patterning"],
      }),
      make(week, {
        dayType: "Recovery Catch",
        focus: "Arm feel",
        throws: "20-35",
        distanceFt: "60-90",
        intent: "40-55%",
        mainCue: "Easy rhythm.",
        drillIds: ["pendulum", "arm-care-circuit"],
      }),
      make(week, {
        dayType: "Medium Build Day",
        focus: "Sequencing",
        mainCue: "Hips start, trunk waits.",
        drillIds: ["rhythm-rocker", "ten-toes", "pivot-pickoff"],
      }),
      make(week, {
        dayType: "Full Off",
        focus: "Recover",
        mainCue: "Keep capacity clean.",
        drillIds: ["arm-care-circuit"],
      }),
      moundDay,
      make(week, {
        dayType: "Recovery Catch",
        focus: "Post-mound response",
        throws: "15-30",
        distanceFt: "45-75",
        intent: "35-50%",
        mainCue: "Flush, do not chase.",
        drillIds: ["pendulum", "arm-care-circuit"],
      }),
      make(week, {
        dayType: "Full Off",
        focus: "Recover",
        mainCue: "Next morning decides.",
        drillIds: ["arm-care-circuit"],
      }),
    ];
  }

  if (week >= 9 && week <= 11) {
    const secondMound = week >= 10;
    const intentNote = week === 11 ? "75-90% only if previous sessions are clean." : "Controlled intent only.";
    return [
      make(week, {
        dayType: "Mechanics Catch",
        focus: "Mound Transfer Pattern",
        mainCue: "Same athletic move.",
        drillIds: ["step-back-throws", "rhythm-rocker", "lead-leg-patterning"],
      }),
      make(week, {
        dayType: "Recovery Catch",
        focus: "Arm rebound",
        throws: "20-35",
        distanceFt: "60-90",
        intent: "40-55%",
        mainCue: "Smooth catch only.",
        drillIds: ["pendulum", "arm-care-circuit"],
      }),
      secondMound
        ? make(week, {
            dayType: "Mound Transfer Day",
            focus: "Controlled Fastballs",
            throws: week === 10 ? "18-28 mound fastballs + catch" : "20-32 mound fastballs + catch",
            distanceFt: "Mound",
            intent: week === 10 ? "70-80%" : "75-85%",
            mound: true,
            mainCue: "Clean delivery, clean next day.",
            drillIds: ["controlled-stretch", "low-intent-bullpen", "rocker-throws"],
            notes: intentNote,
          })
        : make(week, {
            dayType: "Medium Build Day",
            focus: "Controlled Intent",
            mainCue: "Fast without forcing.",
            drillIds: ["dynamic-rocker", "walking-windup", "rocker-throws"],
            notes: intentNote,
          }),
      make(week, {
        dayType: "Recovery / Arm-Care",
        focus: "Tissue response",
        mainCue: "Hold the line.",
        drillIds: ["arm-care-circuit", "dry-drift-reps"],
      }),
      make(week, {
        dayType: "Mound Transfer Day",
        focus: "Fastball-First Bullpen",
        throws: week === 9 ? "20-30 mound fastballs + catch" : "25-35 mound pitches if clean",
        distanceFt: "Mound",
        intent: week === 9 ? "65-80%" : week === 10 ? "70-85%" : "75-90% if clean",
        mound: true,
        mainCue: "Catch the move.",
        drillIds: ["step-back-mound", "controlled-stretch", "low-intent-bullpen"],
        notes: "Fastballs first. Add intensity only if the arm is clean.",
      }),
      make(week, {
        dayType: "Recovery Catch",
        focus: "Flush + feel",
        throws: "15-30",
        distanceFt: "45-75",
        intent: "35-50%",
        mainCue: "Let it recover.",
        drillIds: ["pendulum", "arm-care-circuit"],
      }),
      make(week, {
        dayType: "Full Off",
        focus: "Recover",
        mainCue: "Do not chase missed work.",
        drillIds: ["arm-care-circuit"],
      }),
    ];
  }

  return [
    make(week, {
      dayType: "Recovery Catch",
      focus: "Arm rebound",
      throws: "20-35",
      distanceFt: "60-90",
      intent: "40-55%",
      mainCue: "Easy rhythm.",
      drillIds: ["pendulum", "arm-care-circuit"],
    }),
    make(week, {
      dayType: "Mechanics Catch",
      focus: "One Cue Transfer",
      mainCue: "One clean move.",
      drillIds: ["rhythm-rocker", "lead-leg-patterning", "step-back-throws"],
    }),
    make(week, {
      dayType: "Full Off",
      focus: "Recover",
      mainCue: "Absorb the work.",
      drillIds: ["arm-care-circuit"],
    }),
    make(week, {
      dayType: "Mound Transfer Day",
      focus: "Bullpen Build",
      throws: week === 12 ? "25-35 mound pitches if clean" : "30-40 mound pitches if clean",
      distanceFt: "Mound",
      intent: "75-90% if clean",
      mound: true,
      mainCue: "Fastballs first.",
      drillIds: ["controlled-stretch", "low-intent-bullpen", "rocker-throws"],
      notes: "Secondary pitches controlled. Do not add pitch type and intensity jump on the same day.",
    }),
    make(week, {
      dayType: "Recovery Catch",
      focus: "Post-mound response",
      throws: "15-30",
      distanceFt: "45-75",
      intent: "35-50%",
      mainCue: "Flush only.",
      drillIds: ["pendulum", "arm-care-circuit"],
    }),
    make(week, {
      dayType: week === 12 ? "High-Intent / Velo Day" : "Mound Transfer Day",
      focus: week === 12 ? "Earned High Intent" : "Final Controlled Bullpen",
      throws: week === 12 ? "6-10 higher-intent throws inside normal catch if clean" : "25-40 mound pitches if clean",
      distanceFt: week === 12 ? "120-180" : "Mound",
      intent: "80-90% if clean",
      mound: week !== 12,
      plyoGuidance: "Only if green, previous week was clean, and no next-day symptoms.",
      mainCue: "High intent is earned.",
      drillIds:
        week === 12
          ? ["plyo-roll-ins", "plyo-walking-windups", "walking-windup"]
          : ["controlled-stretch", "low-intent-bullpen", "step-back-mound"],
      notes: "Skip high-intent exposure if any yellow signs show up.",
    }),
    make(week, {
      dayType: "Full Off",
      focus: "Recover",
      mainCue: "Finish clean.",
      drillIds: ["arm-care-circuit"],
    }),
  ];
}

export function generateDefaultPlan(startDate: string): SessionPlan[] {
  const sessions: SessionPlan[] = [];

  for (let week = 1; week <= 13; week += 1) {
    const phase = phaseForWeek(week);
    const templates = weekTemplates(week);

    templates.forEach((template, dayIndex) => {
      const absoluteDay = (week - 1) * 7 + dayIndex;
      const date = addDays(startDate, absoluteDay);

      sessions.push({
        id: `week-${week}-day-${dayIndex + 1}-${date}`,
        date,
        week,
        phase,
        ...template,
      });
    });
  }

  return sessions;
}

export function findSessionForToday(plan: SessionPlan[], today = todayIso()): SessionPlan | undefined {
  const exact = plan.find((session) => session.date === today);
  if (exact) return exact;

  const future = plan.find((session) => session.date > today);
  if (future) return future;

  return plan[plan.length - 1];
}
