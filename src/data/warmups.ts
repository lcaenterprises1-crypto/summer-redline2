import type { WarmupCard } from "../types";

export const warmupCards: WarmupCard[] = [
  {
    id: "full",
    title: "Full Throwing Warmup",
    steps: [
      "Raise temperature 3-5 min",
      "Dynamic mobility 5-7 min",
      "Lower-half activation 5 min",
      "Core/trunk prep 3-5 min",
      "Arm prep 5-8 min",
      "Mechanics primer 3-6 min",
      "Progressive catch",
    ],
  },
  {
    id: "yellow",
    title: "Yellow-Arm Warmup",
    steps: [
      "General heat",
      "Mobility",
      "Light cuff/scap/forearm",
      "Dry lower-half drills",
      "Recheck symptoms",
      "Optional light catch only if symptoms clear",
    ],
  },
  {
    id: "recovery",
    title: "No-Throw Recovery Warmup",
    steps: [
      "Light movement",
      "Mobility",
      "Forearm/cuff/scap circuit",
      "Lower-half patterning",
      "Walk/bike",
    ],
  },
  {
    id: "pre-mound",
    title: "Pre-Mound Warmup",
    steps: [
      "Full throwing warmup",
      "Plyo primer if green",
      "Catch progression",
      "1-2 lower-half drills",
      "Controlled mound ramp",
    ],
  },
  {
    id: "cooldown",
    title: "Post-Throw Cooldown",
    steps: [
      "3-5 min walk",
      "Light forearm flush",
      "Posterior shoulder mobility",
      "Cuff/scap if needed",
      "Log symptoms",
    ],
  },
];
