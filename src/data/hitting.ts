export type HittingSessionType =
  | "Recovery / Feel"
  | "Contact Quality"
  | "Game Transfer"
  | "Bat Speed"
  | "EV / Damage"
  | "Bat Speed / EV Microdose"
  | "Game Prep"
  | "Minimum Hitting"
  | "Off";

export interface HittingTemplate {
  sessionType: HittingSessionType;
  stress: "Low" | "Medium" | "High";
  intent: "Low" | "Medium" | "High";
  purpose: string;
  bestUsed: string;
  downgradeWhen: string;
  focusedBlock: string[];
  freedomBlock: string[];
  avoid: string[];
  mainCue: string;
  typicalVolume: string;
  trackingFields: string[];
  outputKind?: "batSpeed" | "evDamage" | "contactQuality" | "recoveryFeel" | "gameTransfer" | "microdose" | "gamePrep" | "minimum";
}

export const hittingSessionTypes: HittingSessionType[] = [
  "Recovery / Feel",
  "Contact Quality",
  "Game Transfer",
  "Bat Speed",
  "EV / Damage",
  "Bat Speed / EV Microdose",
  "Game Prep",
  "Minimum Hitting",
  "Off",
];

export const hittingTemplates: Record<HittingSessionType, HittingTemplate> = {
  "Recovery / Feel": {
    sessionType: "Recovery / Feel",
    stress: "Low",
    intent: "Low",
    purpose: "Stay sharp, find feel, maintain swing rhythm, leave better than started.",
    bestUsed: "After throwing/lifting, tired workdays, yellow readiness, pre/post mound, game prep days, or when swing feels off.",
    downgradeWhen: "Red readiness, pain, or frustration swings taking over.",
    focusedBlock: ["Short warmup", "Dry swing feel", "Easy tee contact", "Direction feel block", "Feel finder block", "Confidence finish"],
    freedomBlock: ["Allowed if green", "Keep it controlled", "Stop while swing feels better"],
    avoid: ["Radar", "Weighted bat work", "Max effort", "Frustration swings", "Turning it into EV Day"],
    mainCue: "Leave better than you started.",
    typicalVolume: "35-80 swings, or 20-40 if tired/yellow.",
    trackingFields: ["Swing feel before/after", "Best cue", "Worst miss", "Left better than started"],
    outputKind: "recoveryFeel",
  },
  "Contact Quality": {
    sessionType: "Contact Quality",
    stress: "Medium",
    intent: "Medium",
    purpose: "Make power cleaner, more repeatable, and more game-usable.",
    bestUsed: "Normal cage days, body good but not explosive, after throwing/lifting if moving well, when productive volume is desired.",
    downgradeWhen: "Quality drops, rollovers pile up, or high intent is not a good idea.",
    focusedBlock: ["Dry swing ramp", "Middle-field baseline", "Slightly away through center/right-center", "Middle-in without rollover", "Rollover correction round", "Usable Power Finish"],
    freedomBlock: ["Middle-field barrels", "Stance/rhythm tinkering", "Away-pitch work", "Pull-side damage test if green", "Confidence finish"],
    avoid: ["Turning every Contact Quality day into EV Day", "Forcing weak oppo", "Swinging forever after quality drops"],
    mainCue: "Hard contact through the big part of the field.",
    typicalVolume: "60-85 swings.",
    trackingFields: ["Usable Power Finish", "Rollover count", "Best direction", "Away-pitch block", "Middle-in block"],
    outputKind: "contactQuality",
  },
  "Game Transfer": {
    sessionType: "Game Transfer",
    stress: "Medium",
    intent: "Medium",
    purpose: "Make cage work more game-like.",
    bestUsed: "Tee-only decision rounds now, moving-ball timing and competitive rounds later.",
    downgradeWhen: "Swing gets rushed, decision quality drops, or body is flat.",
    focusedBlock: ["Random Location Round - 15 swings", "Damage-or-Take Simulation - 20 reps", "Pressure Finish - 10 swings"],
    freedomBlock: ["Game-like locations", "Count-based work", "Competitive finish", "Stop before fake pressure turns sloppy"],
    avoid: ["Mindless tee swings", "Ignoring take discipline", "Power without a purpose"],
    mainCue: "Use power with a purpose.",
    typicalVolume: "25-35 actual swings.",
    trackingFields: ["Block type", "Quality contact score", "Take discipline", "Best location", "Worst miss", "Power stayed organized"],
    outputKind: "gameTransfer",
  },
  "Bat Speed": {
    sessionType: "Bat Speed",
    stress: "High",
    intent: "High",
    purpose: "Move the bat faster and transfer that speed into normal bat swings.",
    bestUsed: "Fresh body days, output build phases, Blast available, and away from mound/high-intent throwing windows.",
    downgradeWhen: "Yellow arm, wrist/forearm irritation, back/oblique tightness, poor energy, or heavy upper/trunk nearby.",
    focusedBlock: ["Dynamic warmup", "Optional tiny med ball primer if green", "Dry swing ramp with normal bat", "Lighter bat speed block", "Optional heavy dry primer only", "Normal bat transfer swings", "Short tee contact finish"],
    freedomBlock: ["Normal tee work", "Middle-field barrels", "Contact quality", "Rhythm work"],
    avoid: ["Endless max-speed swings", "Fake bat speed", "Turning the session into sloppy output"],
    mainCue: "Move fast, then transfer clean.",
    typicalVolume: "35-50 focused swings.",
    trackingFields: ["Blast bat speed", "Rotational acceleration", "Attack angle", "On-plane efficiency", "Transfer feel", "Clean contact finish"],
    outputKind: "batSpeed",
  },
  "EV / Damage": {
    sessionType: "EV / Damage",
    stress: "High",
    intent: "High",
    purpose: "Train maximum clean collision.",
    bestUsed: "Radar days, fresh body days, clean swing, and early/mid-summer output windows.",
    downgradeWhen: "Back/oblique/forearm/wrist feels off, body flat, near mound/high-intent throwing, or contact quality poor.",
    focusedBlock: ["Warmup", "Optional tiny med ball primer if green", "Dry swing ramp", "Middle-middle damage", "Middle-in damage", "Slightly away damage through the big part", "Best 10 finish"],
    freedomBlock: ["Keep damage going if clean", "Contact quality reset", "Stance/rhythm tinkering", "Confidence finish"],
    avoid: ["Max EV chasing after quality drops", "Sloppy pull-side rollovers", "Forcing one more number"],
    mainCue: "Maximum clean intent.",
    typicalVolume: "45-60 focused swings.",
    trackingFields: ["Max EV", "Top-5 EV average", "95+ balls", "Best 10 finish", "Worst miss", "Body response"],
    outputKind: "evDamage",
  },
  "Bat Speed / EV Microdose": {
    sessionType: "Bat Speed / EV Microdose",
    stress: "Medium",
    intent: "High",
    purpose: "Keep explosiveness alive without running a full high-output session.",
    bestUsed: "Weeks 7-13, green readiness, high workload, or near important throwing weeks.",
    downgradeWhen: "Yellow readiness, radar chasing, or one-more-max-swing cycle starting.",
    focusedBlock: ["Short warmup", "5-8 fast dry swings", "5 normal bat transfer swings", "5-8 tee swings", "5 clean contact finish swings"],
    freedomBlock: ["Only if green", "Downgrade into Recovery / Feel or Contact Quality", "Get out before it becomes a full output day"],
    avoid: ["Turning microdose into full Bat Speed/EV", "Radar chasing", "Heavy bat work", "One-more-max-swing cycle"],
    mainCue: "Touch speed, then get out.",
    typicalVolume: "15-30 swings.",
    trackingFields: ["Speed touch quality", "Transfer feel", "Best contact", "Body response"],
    outputKind: "microdose",
  },
  "Game Prep": {
    sessionType: "Game Prep",
    stress: "Low",
    intent: "Medium",
    purpose: "Prepare to compete without overthinking.",
    bestUsed: "Before games, live ABs, showcases/workouts, late summer, or readiness instead of training a new skill.",
    downgradeWhen: "Confidence is already good or fatigue is rising.",
    focusedBlock: ["Short warmup", "Dry rhythm", "Tee middle-middle", "Damage feel", "Approach reminder", "Confidence finish"],
    freedomBlock: ["Keep it athletic", "Short confidence finish", "Approach reminders only"],
    avoid: ["Mechanical rabbit holes", "Chasing EV before competing", "Grinding if confidence is already good"],
    mainCue: "Feel athletic, on time, and confident.",
    typicalVolume: "25-45 swings.",
    trackingFields: ["Feel", "Approach cue", "Confidence finish", "Worst miss"],
    outputKind: "gamePrep",
  },
  "Minimum Hitting": {
    sessionType: "Minimum Hitting",
    stress: "Low",
    intent: "Low",
    purpose: "Smallest version that keeps rhythm and momentum when time/readiness is limited.",
    bestUsed: "Busy workdays, yellow energy, post-mound, post-lift, or when normal session is not realistic.",
    downgradeWhen: "Pain or red readiness.",
    focusedBlock: ["Dry swings", "Easy tee", "One focus", "Stop before fatigue"],
    freedomBlock: ["None needed", "The win is keeping rhythm"],
    avoid: ["Adding volume because it feels too easy", "Turning minimum into a full session"],
    mainCue: "Minimum useful work.",
    typicalVolume: "10-25 swings.",
    trackingFields: ["Completed", "Swing feel", "One cue", "Left fresh"],
    outputKind: "minimum",
  },
  Off: {
    sessionType: "Off",
    stress: "Low",
    intent: "Low",
    purpose: "Protect the body or reset.",
    bestUsed: "Red readiness, pain, full reset day, or clear need to protect.",
    downgradeWhen: "No downgrade. Off means off.",
    focusedBlock: ["No hitting required"],
    freedomBlock: ["Recovery only"],
    avoid: ["Sneaking in high intent", "Testing pain"],
    mainCue: "Protect tomorrow.",
    typicalVolume: "0 swings.",
    trackingFields: ["Reason", "Recovery note"],
  },
};

export function getHittingTemplate(type: string): HittingTemplate {
  const key = hittingSessionTypes.includes(type as HittingSessionType) ? (type as HittingSessionType) : "Contact Quality";
  return hittingTemplates[key];
}

export function isHighIntentHitting(type: string): boolean {
  return ["Bat Speed", "EV / Damage", "Bat Speed / EV Microdose"].includes(type);
}
