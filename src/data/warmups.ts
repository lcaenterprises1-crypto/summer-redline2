import type { WarmupCard } from "../types";

export const warmupCards: WarmupCard[] = [
  {
    id: "full",
    title: "Full Throwing Warmup",
    steps: [
      "Raise Temp - 3-5 min: light jog, bike, jump rope, or lateral shuffle series.",
      "Dynamic Mobility - 5-7 min: leg swings, lunges with rotation, hamstring scoops, lateral lunges, world's greatest stretch, ankle rocks, thoracic rotations.",
      "Lower-Half Activation - 5 min: lateral band walks, glute bridge, single-leg RDL reach, reverse lunge, pogo hops.",
      "Core / Trunk Prep - 3-5 min: dead bugs, side plank, Pallof press, bear crawl.",
      "Arm Prep - 5-8 min: band rotations, pull-aparts, push-up plus, wrist work, pronation/supination, light grip.",
      "Mechanics Primer: use the session focus and drills.",
      "Progressive Catch: start easy, build gradually, no early test throws.",
    ],
  },
  {
    id: "yellow",
    title: "Yellow-Arm Warmup",
    steps: [
      "3-5 min general heat",
      "Easy dynamic mobility",
      "Light cuff/scap/forearm work",
      "Dry lower-half patterning",
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
      "Dry lower-half patterning",
      "Walk or bike",
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
      "Cuff/scap work if needed",
      "Log symptoms",
    ],
  },
];

export interface DailyDetailSection {
  title: string;
  summary: string;
  items: string[];
}

export const fullThrowingWarmupDetails: DailyDetailSection[] = [
  {
    title: "Raise Temp",
    summary: "3-5 min",
    items: ["Choose one: Light jog", "Bike", "Jump rope", "Lateral shuffle series"],
  },
  {
    title: "Dynamic Mobility",
    summary: "5-7 min",
    items: [
      "Leg swings forward/back - 10 each",
      "Leg swings side-to-side - 10 each",
      "Walking lunges with rotation - 6 each",
      "Hamstring scoops - 10 each",
      "Lateral lunges - 6 each",
      "World's greatest stretch - 3 each",
      "Ankle rocks - 10 each",
      "Thoracic rotations - 8 each",
    ],
  },
  {
    title: "Lower-Half Activation",
    summary: "5 min",
    items: [
      "Lateral band walks - 2x10 each way",
      "Glute bridge - 2x10",
      "Single-leg RDL reach - 2x5 each side",
      "Reverse lunge - 2x5 each side",
      "Pogo hops - 2x10",
    ],
  },
  {
    title: "Core / Trunk Prep",
    summary: "3-5 min",
    items: [
      "Dead bugs - 2x6 each side",
      "Side plank - 2x20-30 sec each side",
      "Pallof press - 2x8 each side",
      "Bear crawl - 2 short trips",
    ],
  },
  {
    title: "Arm Prep",
    summary: "5-8 min",
    items: [
      "Band external rotations - 2x12",
      "Band internal rotations - 2x12",
      "Band pull-aparts - 2x12",
      "Scap push-up / push-up plus - 2x10",
      "Wrist flexion/extension - 2x12",
      "Pronation/supination - 2x12",
      "Light grip - 1-2 sets",
    ],
  },
  {
    title: "Progressive Catch",
    summary: "Build gradually",
    items: [
      "Start easy",
      "Gradually build distance and intent",
      "No throw should feel like a test early in the session",
    ],
  },
];

export const yellowArmWarmupDetails: DailyDetailSection[] = [
  {
    title: "Yellow-Arm Warmup",
    summary: "Recheck before throwing",
    items: [
      "3-5 min general heat",
      "Easy dynamic mobility",
      "Light cuff/scap/forearm work",
      "Dry lower-half patterning",
      "Recheck symptoms",
      "Optional light catch only if symptoms clear",
    ],
  },
];

export const noThrowRecoveryWarmupDetails: DailyDetailSection[] = [
  {
    title: "No-Throw Recovery Warmup",
    summary: "Recovery only",
    items: [
      "Light movement",
      "Mobility",
      "Forearm/cuff/scap circuit",
      "Dry lower-half patterning",
      "Walk or bike",
    ],
  },
];

export const cooldownDetails: DailyDetailSection[] = [
  {
    title: "Walk",
    summary: "3-5 min",
    items: [
      "Easy walk after throwing",
      "Let heart rate and arm calm down",
    ],
  },
  {
    title: "Forearm flush",
    summary: "Easy tissue work",
    items: [
      "Wrist flexion/extension - 1x15",
      "Pronation/supination - 1x15",
      "Light grip squeezes - 1x20",
      "Optional forearm massage with hand or ball - 30-60 sec",
    ],
  },
  {
    title: "Back-of-shoulder mobility",
    summary: "Gentle range",
    items: [
      "Cross-body shoulder stretch - 2x20 sec each side",
      "Easy arm-across-chest breathing - 3-5 slow breaths",
      "Sleeper stretch only if it feels good - 1-2x20 sec",
    ],
  },
  {
    title: "Optional cuff/scap reset",
    summary: "Only if useful",
    items: [
      "Band external rotations - 1x12",
      "Band pull-aparts - 1x12",
      "Scap push-up plus - 1x10",
      "Wall slides - 1x8",
    ],
  },
  {
    title: "Log symptoms",
    summary: "Quick note",
    items: [
      "Forearm tightness",
      "Pain during",
      "Pain after",
      "Next-morning response",
    ],
  },
];
