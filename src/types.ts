export type Screen = "today" | "plan" | "drills" | "log" | "progress" | "reference";

export type ArmStatus = "green" | "yellow" | "red";

export interface Settings {
  startDate: string;
}

export interface SessionPlan {
  id: string;
  date: string;
  week: number;
  phase: string;
  dayType: string;
  focus: string;
  goal: string;
  throws: string;
  distanceFt: string;
  intent: string;
  mound: boolean;
  plyoGuidance: string;
  mainCue: string;
  drillIds: string[];
  notes?: string;
}

export interface Drill {
  id: string;
  name: string;
  category: string;
  problem: string;
  useWhen: string;
  dose: string;
  cue: string;
  avoidIf?: string;
  mediaUrl?: string;
  mediaLabel?: string;
}

export interface CheckIn {
  forearmTightness: number;
  bicepsTightness: number;
  elbowPain: number;
  shoulderPain: number;
  armFreshness: number;
  sleepHours: number;
  bodyFatigue: number;
  hotRedHandForearm: boolean;
  nerveSymptoms: boolean;
  nextMorningSymptoms: boolean;
  mechanicalIssue: string;
  intentPreference: string;
}

export interface CheckInRecord {
  id: string;
  date: string;
  sessionId: string;
  input: CheckIn;
  status: ArmStatus;
  recommendation: string;
}

export interface TrainingLog {
  id: string;
  date: string;
  phase: string;
  plannedDayType: string;
  actualDayType: string;
  armStatus: ArmStatus | "not checked";
  totalThrows: number;
  highIntentThrows: number;
  moundPitches: number;
  maxDistanceFt: number;
  intentRange: string;
  drillIds: string[];
  mainCue: string;
  forearmTightnessAfter: number;
  bicepsTightnessAfter: number;
  painDuring: number;
  painOneHourAfter: number;
  hotRedHandForearm: boolean;
  nextMorningSymptoms: boolean;
  notes: string;
  decision: "progress" | "hold" | "regress" | "";
}

export interface AdjustedSession {
  status: ArmStatus;
  statusTitle: string;
  recommendation: string;
  dayType: string;
  goal: string;
  warmup: string;
  throwing: string;
  plyoGuidance: string;
  drillIds: string[];
  mainCue: string;
  avoid: string[];
  logAfter: string[];
  note: string;
}

export interface ReferenceCard {
  id: string;
  title: string;
  bullets: string[];
}

export interface WarmupCard {
  id: string;
  title: string;
  steps: string[];
}
