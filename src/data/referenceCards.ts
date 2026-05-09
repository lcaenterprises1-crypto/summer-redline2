import type { ReferenceCard } from "../types";

export const referenceCards: ReferenceCard[] = [
  {
    id: "green-yellow-red",
    title: "Green / Yellow / Red Rules",
    bullets: [
      "Green: follow the planned session.",
      "Yellow: downgrade volume, intensity, mound, and plyos.",
      "Red: recommended no throwing. Recovery warmup + arm care only.",
      "Guidance never locks the plan.",
    ],
  },
  {
    id: "progression",
    title: "Progression Rules",
    bullets: [
      "Only increase one variable at a time.",
      "Volume, distance, intensity, mound exposure, pitch type, and frequency are separate variables.",
      "Next morning decides if the session worked.",
    ],
  },
  {
    id: "plyos",
    title: "Plyo Rules",
    bullets: [
      "Plyos are movement tools first, not early velo tools.",
      "Phase 1: optional low intent on green days.",
      "Phase 2-3: regular low/moderate mechanics primer.",
      "Phase 4-5: higher intent only if clean.",
    ],
  },
  {
    id: "mound",
    title: "Mound Rules",
    bullets: [
      "No mound on yellow days.",
      "Fastballs first when reintroducing mound work.",
      "No velo chasing during reintroduction.",
      "Stop mound work if pain/tightness changes mechanics.",
    ],
  },
  {
    id: "high-intent",
    title: "High-Intent Rules",
    bullets: [
      "High intent is earned.",
      "No high intent unless the previous week was clean.",
      "Do not pair early high-intent plyos with another max-intent day.",
      "Tightness matters even if pain is low.",
    ],
  },
  {
    id: "substitution",
    title: "Substitution Rules",
    bullets: [
      "Yellow: dry drills, arm care, med balls, optional light catch if symptoms clear.",
      "Red: no baseball throws recommended.",
      "Dry lower-half patterning is okay only if pain-free.",
      "No mound, pulldowns, or aggressive plyos on yellow/red days.",
    ],
  },
  {
    id: "missed",
    title: "No Making Up Missed Throws",
    bullets: [
      "Do not stack missed throws onto the next day.",
      "Resume the plan from the current day or downgrade if needed.",
      "Capacity builds from clean repeats, not catch-up volume.",
    ],
  },
  {
    id: "cue",
    title: "One Cue Rule",
    bullets: [
      "Pick one main cue per day.",
      "Mechanical changes happen at low intent first.",
      "If the cue makes the arm guarded, simplify.",
    ],
  },
  {
    id: "warmups",
    title: "Warmup Rules",
    bullets: [
      "Warm up to read the arm, not to force the day.",
      "Symptoms that rise during warmup push the day to red.",
      "Progressive catch should feel smoother as it goes.",
    ],
  },
];

export const plyoGuidanceCards: ReferenceCard[] = [
  {
    id: "type-a",
    title: "Type A: Warmup Plyos",
    bullets: [
      "Reverse throws 1x5.",
      "Pivot picks 1x5.",
      "Roll-ins/rockers 1x5.",
      "Walking windups 1x5.",
      "Intent: 40-60%.",
    ],
  },
  {
    id: "type-b",
    title: "Type B: Mechanics Plyos",
    bullets: [
      "Step-backs 2x5.",
      "Rockers 2x5.",
      "Walking windups 2x5.",
      "Intent: 50-70%.",
    ],
  },
  {
    id: "type-c",
    title: "Type C: Velo Plyos",
    bullets: [
      "Phase 4 or later.",
      "Green day only.",
      "Start 1x/week max.",
      "No next-day symptoms or forearm/biceps tightness.",
    ],
  },
];
