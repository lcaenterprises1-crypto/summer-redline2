export type PhysicalSessionType =
  | "Main Strength"
  | "Upper + Trunk"
  | "Speed + Power"
  | "Maintenance Lift"
  | "Power Primer"
  | "Recovery / Tissue Capacity"
  | "Knee Capacity"
  | "Arm Care"
  | "Mobility / Recovery"
  | "Off";

export type PhysicalVersion = "Full" | "Short" | "Minimum" | "Recovery" | "Skip";
export type PhysicalLocation = "Planet Fitness" | "YMCA" | "Field" | "Home";

export interface PhysicalExerciseRow {
  name: string;
  prescription: string;
  note?: string;
  swap?: string;
}

export interface PhysicalBlock {
  title: string;
  rows: PhysicalExerciseRow[];
}

export interface PhysicalTemplate {
  sessionType: PhysicalSessionType;
  stress: "Low" | "Medium" | "High";
  purpose: string;
  bestUsed: string;
  defaultLocation: PhysicalLocation;
  locations: PhysicalLocation[];
  defaultVersion: PhysicalVersion;
  versions: Partial<Record<PhysicalVersion, PhysicalBlock[]>>;
  yellowArmAdjustment: string;
  yellowKneeAdjustment: string;
  avoid: string[];
}

export const physicalSessionTypes: PhysicalSessionType[] = [
  "Main Strength",
  "Upper + Trunk",
  "Speed + Power",
  "Maintenance Lift",
  "Power Primer",
  "Recovery / Tissue Capacity",
  "Knee Capacity",
  "Arm Care",
  "Mobility / Recovery",
  "Off",
];

export const physicalVersions: PhysicalVersion[] = ["Full", "Short", "Minimum", "Recovery", "Skip"];
export const physicalLocations: PhysicalLocation[] = ["Planet Fitness", "YMCA", "Field", "Home"];

const mainStrengthFull: PhysicalBlock[] = [
  block("Primer", [
    row("Bike or walk", "5 min"),
    row("Hip mobility", "1-2 rounds"),
    row("Knee warmup", "Easy pain-free range"),
  ]),
  block("Main Lower Strength", [row("Leg press or Smith squat", "3x6-8", "Clean reps, no grinders")]),
  block("Hinge / Posterior Chain", [row("DB RDL", "3x8"), row("Leg curl", "2-3x10")]),
  block("Knee Capacity", [row("Wall sit or Spanish squat", "2-3 sets"), row("Step-down or split squat", "Pain-free range")]),
  block("Trunk + Arm Support", [row("Pallof press", "2x8 each side"), row("Side plank", "2x20-30 sec"), row("Light cuff/scap/serratus", "1-2 easy sets")]),
];

const upperFull: PhysicalBlock[] = [
  block("Primer", [row("Bike or walk", "3-5 min"), row("Shoulder/scap prep", "1-2 rounds")]),
  block("Upper Pull", [row("Lat pulldown or assisted pull-up", "3x8"), row("Chest-supported row or cable row", "3x8-10")]),
  block("Arm-Friendly Push", [row("DB press or machine press", "2-3x8", "Only if arm is green")]),
  block("Trunk + Scap", [row("Pallof press", "2x8 each side"), row("Dead bug", "2x6 each side"), row("Serratus wall slide or scap push-up", "2x10")]),
  block("Arm Care", [row("Band external rotation", "2x12")]),
];

const speedFull: PhysicalBlock[] = [
  block("Movement Prep", [row("Dynamic warmup", "5-8 min"), row("Skips / buildups", "2-3 reps")]),
  block("Sprint / Acceleration", [row("10-20 m accelerations", "4-6 reps", "Full rest, crisp quality only")]),
  block("Jump / Power", [row("Broad jump or pogo series", "2-3 sets", "Stop if knee gets worse")]),
  block("Med Ball / Rotational Power", [row("Rotational scoop toss", "Low volume", "Only if arm is green"), row("Shotput throw", "Low volume", "Only if arm is green")]),
];

const recoveryBlocks: PhysicalBlock[] = [
  block("Easy Blood Flow", [row("Easy bike/walk", "5-10 min")]),
  block("Mobility", [row("Hip mobility", "1-2 rounds"), row("Breathing / reset", "2-3 min")]),
  block("Arm + Knee Support", [row("Forearm flush", "1-2 sets"), row("Light cuff/scap", "1-2 sets"), row("Wall sit or Spanish squat", "Pain-free")]),
];

const kneeBlocks: PhysicalBlock[] = [
  block("Warmup", [row("Bike", "5 min")]),
  block("Isometric", [row("Wall sit or Spanish squat", "2-4 sets")]),
  block("Controlled Range", [row("Step-down or split squat ISO", "Pain-free")]),
  block("Posterior Chain", [row("Leg curl", "2-3 sets"), row("Calf/tib work", "2 sets")]),
];

const armCareBlocks: PhysicalBlock[] = [
  block("Forearm", [row("Wrist flexion/extension", "1-2 sets"), row("Pronation/supination", "1-2 sets")]),
  block("Cuff", [row("Band external rotation", "2x12")]),
  block("Scap / Serratus", [row("Scap push-up / push-up plus", "2x10"), row("Serratus wall slide", "2x10")]),
  block("Shoulder Mobility", [row("Cross-body stretch", "Easy range")]),
];

const mobilityBlocks: PhysicalBlock[] = [
  block("Hips", [row("Hip flexor mobility", "1-2 min"), row("Hamstring floss / scoop", "Easy")]),
  block("T-spine + Shoulders", [row("T-spine rotations", "8 each"), row("Cross-body shoulder stretch", "Easy")]),
  block("Breathing", [row("Breathing reset", "2-3 min")]),
];

export const physicalTemplates: Record<PhysicalSessionType, PhysicalTemplate> = {
  "Main Strength": {
    sessionType: "Main Strength",
    stress: "High",
    purpose: "Build lower-body strength, posterior chain, trunk strength, and knee capacity without interfering with baseball work.",
    bestUsed: "Green or mostly green readiness, normal physical build days, and not immediately before high-priority mound/high-intent throwing.",
    defaultLocation: "Planet Fitness",
    locations: ["Planet Fitness", "YMCA"],
    defaultVersion: "Full",
    versions: {
      Full: mainStrengthFull,
      Short: [mainStrengthFull[0], mainStrengthFull[1], mainStrengthFull[2], block("Quick Trunk", [row("Pallof press", "2x8 each side")])],
      Minimum: [mainStrengthFull[0], block("One Main Lift", [row("Leg press / Smith squat / DB RDL", "2-3 clean sets")]), block("One Knee Capacity Piece", [row("Wall sit or Spanish squat", "2 sets")])],
      Recovery: recoveryBlocks,
    },
    yellowArmAdjustment: "Remove med balls and heavy pressing. Keep lower body, mobility, trunk, and light arm support.",
    yellowKneeAdjustment: "Use Short or Minimum. Keep hinge/posterior-chain work, reduce painful knee-dominant work, and skip jumps/sprints.",
    avoid: ["Max lower-body grinders", "Painful knee-dominant volume", "Extra finishers", "Heavy lower-body work if mound/high-output day is next"],
  },
  "Upper + Trunk": {
    sessionType: "Upper + Trunk",
    stress: "Medium",
    purpose: "Build upper-body support, pulling strength, trunk control, scap/serratus strength, and arm-friendly durability.",
    bestUsed: "After lower-body heavy day, when knee needs a break, or on moderate training days.",
    defaultLocation: "Planet Fitness",
    locations: ["Planet Fitness", "YMCA"],
    defaultVersion: "Full",
    versions: {
      Full: upperFull,
      Short: [upperFull[0], upperFull[1], upperFull[3]],
      Minimum: [block("Pull", [row("Lat pulldown or row", "2 clean sets")]), block("Trunk + Arm Support", [row("Pallof press", "2 sets"), row("Band external rotation", "1-2 sets")])],
      Recovery: armCareBlocks,
    },
    yellowArmAdjustment: "Remove heavy pressing and aggressive grip. Keep easy pulling, trunk, scap/serratus, and light cuff work.",
    yellowKneeAdjustment: "Knee can rest today. Keep upper/trunk work and avoid painful lower-body setup positions.",
    avoid: ["Heavy pressing if arm is yellow", "Aggressive forearm/grip work", "Max upper-body strain before high-intent throwing"],
  },
  "Speed + Power": {
    sessionType: "Speed + Power",
    stress: "High",
    purpose: "Keep speed, explosiveness, and athletic power alive without overloading knees or interfering with high-output windows.",
    bestUsed: "Green knee, green arm, fresh energy, and field/open space available.",
    defaultLocation: "Field",
    locations: ["Field", "YMCA", "Home"],
    defaultVersion: "Full",
    versions: {
      Full: speedFull,
      Short: [speedFull[0], block("Microdose", [row("Accelerations OR low-volume jumps", "2-4 crisp reps")])],
      Minimum: [speedFull[0], block("Crisp Touches", [row("Accelerations or low-impact power substitute", "2-4 reps")])],
      Recovery: recoveryBlocks,
    },
    yellowArmAdjustment: "Remove med balls and aggressive rotational power. Use movement prep and lower-impact speed only if knee is green.",
    yellowKneeAdjustment: "Remove sprinting and jumping. Use bike, mobility, low-impact power substitute, or Recovery version.",
    avoid: ["Sprinting/jumping with yellow knee", "Med balls with yellow arm", "Conditioning disguised as speed", "Stacking with mound/high-intent throwing"],
  },
  "Maintenance Lift": {
    sessionType: "Maintenance Lift",
    stress: "Medium",
    purpose: "Keep strength and tissue capacity alive during higher baseball workload.",
    bestUsed: "Mid/late summer, busy weeks, and around higher throwing/hitting demand.",
    defaultLocation: "Planet Fitness",
    locations: ["Planet Fitness", "YMCA"],
    defaultVersion: "Short",
    versions: {
      Full: [block("Primer", [row("Easy warmup", "5 min")]), block("Main Lift", [row("Leg press / Smith squat / DB RDL", "2-3 clean sets")]), block("Support", [row("Row / pulldown", "2-3 clean sets"), row("Trunk anti-rotation", "2 sets"), row("Knee or arm support", "1-2 sets")])],
      Short: [block("Primer", [row("Easy warmup", "3-5 min")]), block("Main Lift", [row("One main lift", "2-3 clean sets")]), block("Support", [row("One support piece", "1-2 sets")])],
      Minimum: [block("Minimum", [row("One main lift", "2 sets"), row("One support piece", "1-2 sets")])],
      Recovery: recoveryBlocks,
    },
    yellowArmAdjustment: "Avoid heavy pressing and extra grip. Choose lower/trunk support or Recovery version.",
    yellowKneeAdjustment: "Choose hinge/posterior-chain bias and reduce knee-dominant work.",
    avoid: ["Chasing PRs", "Junk volume", "Soreness that disrupts baseball work"],
  },
  "Power Primer": {
    sessionType: "Power Primer",
    stress: "Medium",
    purpose: "Touch explosiveness without creating fatigue.",
    bestUsed: "Before hitting output if green, late-summer fall-prep microdose, or when full speed/power is too much.",
    defaultLocation: "Field",
    locations: ["Field", "YMCA", "Home"],
    defaultVersion: "Short",
    versions: {
      Full: [block("Dynamic Warmup", [row("Dynamic warmup", "5 min")]), block("Explosive Touch", [row("Low-volume jumps OR med ball throws", "2-3 sets"), row("Fast dry movements", "3-5 reps")])],
      Short: [block("Primer", [row("Movement prep", "5-10 min"), row("Explosive touches", "2-4 reps")])],
      Minimum: [block("Minimum Primer", [row("Movement prep", "5 min"), row("Fast clean movement", "2 reps")])],
      Recovery: recoveryBlocks,
    },
    yellowArmAdjustment: "Remove med balls. Use jumps only if knee is green or keep movement prep only.",
    yellowKneeAdjustment: "Remove jumps. Use med ball only if arm is green or switch to Recovery.",
    avoid: ["Chasing fatigue", "Too many jumps", "Med balls if arm is yellow", "Using primer as a full workout"],
  },
  "Recovery / Tissue Capacity": {
    sessionType: "Recovery / Tissue Capacity",
    stress: "Low",
    purpose: "Improve recovery, tissue tolerance, mobility, and next-day response.",
    bestUsed: "Yellow readiness, after high-output days, tired workdays, or when full training is not smart.",
    defaultLocation: "Home",
    locations: ["Home", "Planet Fitness", "YMCA"],
    defaultVersion: "Recovery",
    versions: { Full: recoveryBlocks, Short: recoveryBlocks.slice(0, 2), Minimum: [recoveryBlocks[0]], Recovery: recoveryBlocks },
    yellowArmAdjustment: "Keep cuff/scap/forearm light and pain-free.",
    yellowKneeAdjustment: "Use pain-free range and isometrics only.",
    avoid: ["Turning recovery into a hard workout", "Chasing soreness", "Random finishers"],
  },
  "Knee Capacity": {
    sessionType: "Knee Capacity",
    stress: "Medium",
    purpose: "Build knee tolerance, pain-free strength, and confidence.",
    bestUsed: "Yellow knee, lower-body support days, recovery days, or when sprint/jump is removed.",
    defaultLocation: "Home",
    locations: ["Home", "Planet Fitness", "YMCA"],
    defaultVersion: "Short",
    versions: { Full: kneeBlocks, Short: kneeBlocks.slice(0, 3), Minimum: [kneeBlocks[1]], Recovery: [kneeBlocks[0], kneeBlocks[1]] },
    yellowArmAdjustment: "Arm can stay quiet. Keep knee work controlled.",
    yellowKneeAdjustment: "Stay pain-free. Use isometrics and controlled range; remove plyos and deep painful positions.",
    avoid: ["Sharp pain", "Swelling/limping", "Deep painful ranges", "Plyos if knee is yellow/red"],
  },
  "Arm Care": {
    sessionType: "Arm Care",
    stress: "Low",
    purpose: "Support throwing readiness, shoulder/scap control, cuff strength, and forearm health.",
    bestUsed: "After throwing, recovery days, yellow-arm days, light pre-throw prep, or before next throwing exposure.",
    defaultLocation: "Home",
    locations: ["Home", "Planet Fitness", "YMCA"],
    defaultVersion: "Short",
    versions: { Full: armCareBlocks, Short: armCareBlocks.slice(0, 3), Minimum: [armCareBlocks[1], armCareBlocks[2]], Recovery: armCareBlocks },
    yellowArmAdjustment: "Keep everything easy and pain-free. No aggressive band volume or heavy grip.",
    yellowKneeAdjustment: "Knee can rest while arm support gets done.",
    avoid: ["Aggressive band volume", "Heavy grip if forearm irritated", "Painful shoulder positions"],
  },
  "Mobility / Recovery": {
    sessionType: "Mobility / Recovery",
    stress: "Low",
    purpose: "Keep movement quality, hips/trunk/shoulders, and recovery moving.",
    bestUsed: "Off days, after work, after travel, low energy, or minimum daily support.",
    defaultLocation: "Home",
    locations: ["Home"],
    defaultVersion: "Recovery",
    versions: { Full: mobilityBlocks, Short: mobilityBlocks.slice(0, 2), Minimum: [mobilityBlocks[2]], Recovery: mobilityBlocks },
    yellowArmAdjustment: "Keep shoulder mobility easy and non-irritating.",
    yellowKneeAdjustment: "Avoid painful end ranges and use easy hip/trunk work.",
    avoid: ["Forcing end ranges", "Painful stretching", "Turning mobility into fatigue"],
  },
  Off: {
    sessionType: "Off",
    stress: "Low",
    purpose: "No physical training today.",
    bestUsed: "Red readiness, pain flare, heavy baseball load, or true full rest needed.",
    defaultLocation: "Home",
    locations: ["Home"],
    defaultVersion: "Skip",
    versions: { Skip: [block("Allowed", [row("Walking", "Easy"), row("Hydration + sleep", "Priority"), row("Optional arm/knee check", "Only if useful")])] },
    yellowArmAdjustment: "No adjustment needed.",
    yellowKneeAdjustment: "No adjustment needed.",
    avoid: ["Testing pain", "Sneaking in a workout", "Adding stress because off feels too easy"],
  },
};

export function getPhysicalTemplate(type: string): PhysicalTemplate {
  const key = physicalSessionTypes.includes(type as PhysicalSessionType) ? (type as PhysicalSessionType) : "Main Strength";
  return physicalTemplates[key];
}

export function blocksForVersion(template: PhysicalTemplate, version: PhysicalVersion): PhysicalBlock[] {
  if (version === "Skip" && !template.versions.Skip) {
    return [block("Skipped", [row("No physical training", "Log the skip and protect tomorrow")])];
  }
  return template.versions[version] ?? template.versions.Short ?? template.versions.Full ?? template.versions.Recovery ?? template.versions.Skip ?? [];
}

function block(title: string, rows: PhysicalExerciseRow[]): PhysicalBlock {
  return { title, rows };
}

function row(name: string, prescription: string, note?: string, swap?: string): PhysicalExerciseRow {
  return { name, prescription, note, swap };
}
