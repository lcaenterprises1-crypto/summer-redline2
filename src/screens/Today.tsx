import { Activity, ClipboardCheck, Dumbbell, HeartPulse, RotateCcw, SlidersHorizontal, Target, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { AdjustedSession, CheckIn, CheckInRecord, Drill, SessionPlan, TrainingLog } from "../types";
import { evaluateArmStatus, type ArmStatusResult } from "../logic/armStatus";
import { buildAdjustedSession } from "../logic/adjustedSession";
import {
  cooldownDetailsForSession,
  drillSummary,
  plyoPlanForSession,
  selectedDrills,
  warmupDetailsForSession,
  warmupNameForSession,
} from "../logic/dailyPlan";
import { formatDisplayDate, todayIso } from "../logic/schedule";
import { AccordionCard } from "../components/AccordionCard";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { CheckInForm } from "../components/CheckInForm";
import { DrillCard } from "../components/DrillCard";
import { QuickLogCard } from "../components/QuickLogCard";
import { StatusBadge } from "../components/StatusBadge";

interface TodayProps {
  session: SessionPlan;
  drills: Drill[];
  onSaveCheckIn: (record: CheckInRecord) => void;
  onSaveLog: (log: TrainingLog) => void;
  onOpenPlan: () => void;
}

type TodayMode = "overview" | "adjust" | "adjusted" | "active" | "hitting" | "physical" | "recovery";
type LaneStatus = "Completed" | "Modified" | "Skipped";

interface ResultState {
  status: ArmStatusResult;
  adjusted: AdjustedSession;
}

export function Today({ session, drills, onSaveCheckIn, onSaveLog, onOpenPlan }: TodayProps) {
  const [mode, setMode] = useState<TodayMode>("overview");
  const [result, setResult] = useState<ResultState | null>(null);
  const [activeAdjusted, setActiveAdjusted] = useState(false);

  const todayDrills = useMemo(() => selectedDrills(session.drillIds, drills), [drills, session.drillIds]);
  const todayPlyos = useMemo(() => plyoPlanForSession(session), [session]);
  const readiness = useMemo(() => buildReadiness(result?.status.status), [result]);
  const lanePlans = useMemo(() => buildLanePlans(session, readiness), [readiness, session]);
  const stressCheck = useMemo(() => buildDailyStressCheck(session, lanePlans), [lanePlans, session]);

  const handleCheckIn = (checkIn: CheckIn) => {
    const status = evaluateArmStatus(checkIn);
    const adjusted = buildAdjustedSession(session, status.status, checkIn.mechanicalIssue);
    setResult({ status, adjusted });
    setActiveAdjusted(false);
    setMode("adjusted");
    onSaveCheckIn({
      id: `checkin-${Date.now()}`,
      date: todayIso(),
      sessionId: session.id,
      input: checkIn,
      status: status.status,
      recommendation: adjusted.recommendation,
    });
  };

  const saveLaneLog = (log: TrainingLog) => {
    onSaveLog(log);
    setMode("overview");
  };

  if (mode === "active") {
    return (
      <FullPlanView
        session={session}
        drills={drills}
        adjusted={activeAdjusted ? result?.adjusted : undefined}
        status={activeAdjusted ? result?.status.status : "not checked"}
        onBack={() => setMode("overview")}
        onAdjust={() => setMode("adjust")}
        onReset={() => {
          setActiveAdjusted(false);
          setMode("active");
        }}
        onSaveLog={onSaveLog}
        onOpenPlan={onOpenPlan}
      />
    );
  }

  if (mode === "hitting") {
    return (
      <LaneSessionView
        lane="hitting"
        title="Hitting"
        plan={lanePlans.hitting}
        onBack={() => setMode("overview")}
        onSave={saveLaneLog}
      />
    );
  }

  if (mode === "physical") {
    return (
      <LaneSessionView
        lane="physical"
        title="Physical Performance"
        plan={lanePlans.physical}
        onBack={() => setMode("overview")}
        onSave={saveLaneLog}
      />
    );
  }

  if (mode === "recovery") {
    return (
      <LaneSessionView
        lane="recovery"
        title="Recovery"
        plan={lanePlans.recovery}
        onBack={() => setMode("overview")}
        onSave={saveLaneLog}
      />
    );
  }

  if (mode === "adjust") {
    return (
      <div className="screen stack today-flow">
        <TodayTopper label="Adjust Full Plan" onBack={() => setMode("overview")} />
        <CheckInForm onSubmit={handleCheckIn} compact />
      </div>
    );
  }

  if (mode === "adjusted" && result) {
    return (
      <div className="screen stack today-flow">
        <TodayTopper label="Adjusted Plan Ready" onBack={() => setMode("overview")} />
        <AdjustedPlanReady
          session={session}
          result={result}
          drills={drills}
          onStart={() => {
            setActiveAdjusted(true);
            setMode("active");
          }}
          onEdit={() => setMode("adjust")}
          onUseOriginal={() => {
            setActiveAdjusted(false);
            setMode("overview");
          }}
        />
      </div>
    );
  }

  return (
    <div className="screen stack today-flow">
      <TodayLaunch
        session={session}
        drills={drills}
        todayDrills={todayDrills}
        plyoSummary={todayPlyos.summary}
        readiness={readiness}
        lanePlans={lanePlans}
        stressCheck={stressCheck}
        onStart={() => {
          setActiveAdjusted(false);
          setMode("active");
        }}
        onAdjust={() => setMode("adjust")}
        onHitting={() => setMode("hitting")}
        onPhysical={() => setMode("physical")}
        onRecovery={() => setMode("recovery")}
      />
    </div>
  );
}

function TodayTopper({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <div className="today-topper">
      <button type="button" onClick={onBack}>
        <Undo2 size={17} />
        <span>Today Overview</span>
      </button>
      <strong>{label}</strong>
    </div>
  );
}

function TodayLaunch({
  session,
  drills,
  todayDrills,
  plyoSummary,
  readiness,
  lanePlans,
  stressCheck,
  onStart,
  onAdjust,
  onHitting,
  onPhysical,
  onRecovery,
}: {
  session: SessionPlan;
  drills: Drill[];
  todayDrills: Drill[];
  plyoSummary: string;
  readiness: ReadinessSnapshot;
  lanePlans: LanePlans;
  stressCheck: DailyStressCheck;
  onStart: () => void;
  onAdjust: () => void;
  onHitting: () => void;
  onPhysical: () => void;
  onRecovery: () => void;
}) {
  const warmup = warmupNameForSession(session);

  return (
    <>
      <Card accent className="today-build-card">
        <div className="today-launch-kicker">
          <span>Today&apos;s Build</span>
          <span>{formatDisplayDate(todayIso(), { weekday: "long" })}</span>
        </div>
        <div className="today-launch-title">
          <span>{session.phase}</span>
          <h2>{session.dayType} + {lanePlans.hitting.sessionType} + {lanePlans.physical.sessionType}</h2>
          <p>Main rule: Build today without making tomorrow worse.</p>
        </div>
        <p className="daily-note">Priority: {session.focus} + contact quality + strength bridge.</p>
      </Card>

      <Card className="readiness-card">
        <div className="section-heading compact-heading">
          <div>
            <span className="eyebrow">Readiness</span>
            <h2>{readiness.overall}</h2>
          </div>
        </div>
        <div className="lane-metrics">
          <MiniLaneMetric label="Arm" value={readiness.arm} />
          <MiniLaneMetric label="Knee" value={readiness.knee} />
          <MiniLaneMetric label="Energy" value={readiness.energy} />
        </div>
        <p className="muted-line">{readiness.recommendation}</p>
      </Card>

      <Card className="today-preview-card">
        <div className="preview-line">
          <span>Warmup</span>
          <strong>{warmup}</strong>
        </div>
        <div className="preview-line">
          <span>Plyos</span>
          <strong>{plyoSummary}</strong>
        </div>
        <div className="preview-line">
          <span>Drills</span>
          <strong>{todayDrills.length ? `${Math.min(todayDrills.length, 3)} drills` : "None planned"}</strong>
        </div>
      </Card>

      <ThrowingLaneCard session={session} onStart={onStart} onAdjust={onAdjust} />
      <HittingLaneCard plan={lanePlans.hitting} stressCheck={stressCheck} onStart={onHitting} />
      <PhysicalLaneCard plan={lanePlans.physical} stressCheck={stressCheck} onStart={onPhysical} />
      <RecoveryLaneCard plan={lanePlans.recovery} onStart={onRecovery} />
      <DailyStressCard stressCheck={stressCheck} />
    </>
  );
}

interface ReadinessSnapshot {
  arm: "Green" | "Yellow" | "Red";
  knee: "Green" | "Yellow" | "Red";
  energy: "Green" | "Yellow" | "Red";
  overall: "Normal Path" | "Modified Path" | "Recovery Path";
  recommendation: string;
}

interface LanePlan {
  sessionType: string;
  stress: "Low" | "Medium" | "High";
  intent?: "Low" | "Medium" | "High";
  focus: string;
  highIntent?: "Allowed" | "Not Recommended" | "Downgraded" | "Off";
  location?: string;
  recommended?: "Full" | "Short" | "Minimum" | "Recovery" | "Skip";
  modifier?: string;
  reason?: string;
  avoid: string[];
  sections: string[];
}

interface LanePlans {
  hitting: LanePlan;
  physical: LanePlan;
  recovery: LanePlan;
}

interface DailyStressCheck {
  status: "Manageable" | "Watch";
  recommendation: string;
  reason: string;
  alternatives: string[];
}

function MiniLaneMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className={`mini-lane-metric status-${slug(value)}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ThrowingLaneCard({ session, onStart, onAdjust }: { session: SessionPlan; onStart: () => void; onAdjust: () => void }) {
  const stress = session.mound || session.dayType.includes("High") ? "High" : session.dayType.includes("Medium") ? "Medium" : "Low-Medium";

  return (
    <Card className="lane-card throwing-lane">
      <div className="lane-card-header">
        <div>
          <span className="eyebrow">Throwing</span>
          <h2>{session.dayType}</h2>
        </div>
        <ClipboardCheck size={22} />
      </div>
      <p className="lane-prescription">{session.throws} throws / {session.distanceFt} ft / {session.intent}</p>
      <p className="muted-line">Cue: {session.mainCue}</p>
      <div className="lane-metrics">
        <MiniLaneMetric label="Stress" value={stress} />
        <MiniLaneMetric label="Status" value="Planned" />
      </div>
      <div className="button-row">
        <Button variant="primary" icon={<ClipboardCheck size={17} />} onClick={onStart}>
          Start Throwing
        </Button>
        <Button variant="secondary" icon={<SlidersHorizontal size={17} />} onClick={onAdjust}>
          Adjust
        </Button>
        <Button variant="ghost" onClick={onStart}>
          Quick Log
        </Button>
      </div>
    </Card>
  );
}

function HittingLaneCard({ plan, stressCheck, onStart }: { plan: LanePlan; stressCheck: DailyStressCheck; onStart: () => void }) {
  return (
    <Card className="lane-card">
      <div className="lane-card-header">
        <div>
          <span className="eyebrow">Hitting</span>
          <h2>{plan.sessionType}</h2>
        </div>
        <Target size={22} />
      </div>
      <div className="lane-metrics">
        <MiniLaneMetric label="Stress" value={plan.stress} />
        <MiniLaneMetric label="Intent" value={plan.intent ?? "Medium"} />
        <MiniLaneMetric label="High intent" value={plan.highIntent ?? "Off"} />
      </div>
      <p className="muted-line">Focus: {plan.focus}</p>
      {stressCheck.status === "Watch" ? <p className="warning-line">{stressCheck.recommendation}</p> : null}
      <div className="button-row">
        <Button variant="primary" icon={<Target size={17} />} onClick={onStart}>
          Start Hitting
        </Button>
        <Button variant="ghost" onClick={onStart}>
          Quick Log
        </Button>
      </div>
    </Card>
  );
}

function PhysicalLaneCard({ plan, stressCheck, onStart }: { plan: LanePlan; stressCheck: DailyStressCheck; onStart: () => void }) {
  return (
    <Card className="lane-card">
      <div className="lane-card-header">
        <div>
          <span className="eyebrow">Physical Performance</span>
          <h2>{plan.sessionType}</h2>
        </div>
        <Dumbbell size={22} />
      </div>
      <div className="lane-metrics">
        <MiniLaneMetric label="Focus" value={plan.stress} />
        <MiniLaneMetric label="Version" value={plan.recommended ?? "Full"} />
      </div>
      <p className="muted-line">Focus: {plan.focus}</p>
      <p className="muted-line">Location: {plan.location}</p>
      {plan.reason ? <p className="warning-line">{plan.reason}</p> : null}
      {stressCheck.status === "Watch" ? <p className="warning-line">{stressCheck.reason}</p> : null}
      <div className="button-row">
        <Button variant="primary" icon={<Dumbbell size={17} />} onClick={onStart}>
          Start Physical
        </Button>
        <Button variant="secondary" onClick={onStart}>
          Options
        </Button>
        <Button variant="ghost" onClick={onStart}>
          Quick Log
        </Button>
      </div>
    </Card>
  );
}

function RecoveryLaneCard({ plan, onStart }: { plan: LanePlan; onStart: () => void }) {
  return (
    <Card className="lane-card">
      <div className="lane-card-header">
        <div>
          <span className="eyebrow">Recovery</span>
          <h2>{plan.sessionType}</h2>
        </div>
        <HeartPulse size={22} />
      </div>
      <p className="muted-line">{plan.focus}</p>
      <ul className="tight-list">
        {plan.sections.slice(0, 4).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="button-row">
        <Button variant="primary" icon={<HeartPulse size={17} />} onClick={onStart}>
          Start Recovery
        </Button>
        <Button variant="ghost" onClick={onStart}>
          Quick Log
        </Button>
      </div>
    </Card>
  );
}

function DailyStressCard({ stressCheck }: { stressCheck: DailyStressCheck }) {
  return (
    <Card className={`lane-card stress-${stressCheck.status.toLowerCase()}`}>
      <div className="lane-card-header">
        <div>
          <span className="eyebrow">Daily Stress Check</span>
          <h2>{stressCheck.status}</h2>
        </div>
        <Activity size={22} />
      </div>
      <p className="recommendation">{stressCheck.recommendation}</p>
      <p className="muted-line">{stressCheck.reason}</p>
      <div className="safe-alternatives">
        <span>Safe alternatives</span>
        {stressCheck.alternatives.map((item) => (
          <strong key={item}>{item}</strong>
        ))}
      </div>
      <p className="muted-line">Override: guidance only. Nothing is locked.</p>
    </Card>
  );
}

function LaneSessionView({
  lane,
  title,
  plan,
  onBack,
  onSave,
}: {
  lane: "hitting" | "physical" | "recovery";
  title: string;
  plan: LanePlan;
  onBack: () => void;
  onSave: (log: TrainingLog) => void;
}) {
  return (
    <div className="screen stack active-session">
      <TodayTopper label={title} onBack={onBack} />
      <Card accent className="active-session-hero lane-session-hero">
        <span className="eyebrow">{title}</span>
        <h2>{plan.sessionType}</h2>
        <p>{plan.focus}</p>
        <dl className="detail-grid">
          <div>
            <dt>Stress</dt>
            <dd>{plan.stress}</dd>
          </div>
          {plan.intent ? (
            <div>
              <dt>Intent</dt>
              <dd>{plan.intent}</dd>
            </div>
          ) : null}
          {plan.recommended ? (
            <div>
              <dt>Recommended</dt>
              <dd>{plan.recommended}</dd>
            </div>
          ) : null}
          {plan.location ? (
            <div>
              <dt>Location</dt>
              <dd>{plan.location}</dd>
            </div>
          ) : null}
        </dl>
        {plan.reason ? <p className="warning-line">{plan.reason}</p> : null}
      </Card>

      <Card className="lane-card">
        <div className="section-heading compact-heading">
          <div>
            <span className="eyebrow">Session Framework</span>
            <h2>{lane === "hitting" ? "Focused Block + Freedom Block" : lane === "physical" ? "Session Sections" : "Recovery Checklist"}</h2>
          </div>
        </div>
        <ul className="tight-list">
          {plan.sections.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="avoid-line">Avoid: {plan.avoid.join(", ")}</p>
      </Card>

      <LaneQuickLog lane={lane} plan={plan} onSave={onSave} />
    </div>
  );
}

function LaneQuickLog({
  lane,
  plan,
  onSave,
}: {
  lane: "hitting" | "physical" | "recovery";
  plan: LanePlan;
  onSave: (log: TrainingLog) => void;
}) {
  const [status, setStatus] = useState<LaneStatus>("Completed");
  const [intent, setIntent] = useState("Medium");
  const [swingVolume, setSwingVolume] = useState("Medium");
  const [swingFeel, setSwingFeel] = useState("3");
  const [hittingFelt, setHittingFelt] = useState("Good");
  const [bestDirection, setBestDirection] = useState("Middle");
  const [worstMiss, setWorstMiss] = useState("None");
  const [forearmFatigue, setForearmFatigue] = useState("None");
  const [trunkFatigue, setTrunkFatigue] = useState("None");
  const [sessionRpe, setSessionRpe] = useState("5");
  const [armAfter, setArmAfter] = useState<"green" | "yellow" | "red">("green");
  const [kneeAfter, setKneeAfter] = useState("Yellow");
  const [energy, setEnergy] = useState("Green");
  const [armCare, setArmCare] = useState("Yes");
  const [kneeCapacity, setKneeCapacity] = useState("Yes");
  const [mobility, setMobility] = useState("Yes");
  const [feltBetter, setFeltBetter] = useState("Same");
  const [notes, setNotes] = useState("");

  const save = () => {
    const laneData: Record<string, string | number | boolean> =
      lane === "hitting"
        ? { status, intent, swingVolume, swingFeel: Number(swingFeel), hittingFelt, bestDirection, worstMiss, forearmFatigue, trunkFatigue }
        : lane === "physical"
          ? { status, sessionRpe: Number(sessionRpe), armAfter, kneeAfter, energy }
          : { status, armCare, kneeCapacity, mobility, feltBetter };

    onSave({
      id: `${lane}-${Date.now()}`,
      lane,
      date: todayIso(),
      phase: "Full Athlete Framework",
      plannedDayType: plan.sessionType,
      actualDayType: `${titleCase(lane)} - ${plan.sessionType}`,
      armStatus: lane === "recovery" ? (feltBetter === "Worse" ? "yellow" : "not checked") : armAfter,
      totalThrows: 0,
      highIntentThrows: 0,
      moundPitches: 0,
      maxDistanceFt: 0,
      intentRange: lane === "hitting" ? intent : "",
      drillIds: [],
      mainCue: plan.focus,
      forearmTightnessAfter: forearmFatigue === "High" ? 4 : forearmFatigue === "Moderate" ? 3 : forearmFatigue === "Mild" ? 1 : 0,
      bicepsTightnessAfter: 0,
      painDuring: 0,
      painOneHourAfter: 0,
      hotRedHandForearm: false,
      nextMorningSymptoms: false,
      notes,
      decision: status === "Modified" ? "hold" : status === "Skipped" ? "regress" : "progress",
      laneData,
    });
  };

  return (
    <Card className="lane-card lane-log-card">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">Quick Log</span>
          <h2>{titleCase(lane)} Log</h2>
        </div>
      </div>

      <label className="field">
        <span>Status</span>
        <select value={status} onChange={(event) => setStatus(event.target.value as LaneStatus)}>
          <option>Completed</option>
          <option>Modified</option>
          <option>Skipped</option>
        </select>
      </label>

      {lane === "hitting" ? (
        <div className="lane-log-grid">
          <SelectField label="Intent" value={intent} options={["Low", "Medium", "High"]} onChange={setIntent} />
          <SelectField label="Swing volume" value={swingVolume} options={["Low", "Medium", "High"]} onChange={setSwingVolume} />
          <SelectField label="Swing feel" value={swingFeel} options={["1", "2", "3", "4", "5"]} onChange={setSwingFeel} />
          <SelectField label="Hitting felt" value={hittingFelt} options={["Sharp", "Good", "Flat", "Forced"]} onChange={setHittingFelt} />
          <SelectField label="Best contact" value={bestDirection} options={["Pull", "Middle", "Oppo", "Mixed"]} onChange={setBestDirection} />
          <SelectField label="Worst miss" value={worstMiss} options={["Rollover", "Under", "Late-foul", "Push", "Yank-spin", "Off-balance", "Weak contact", "None"]} onChange={setWorstMiss} />
          <SelectField label="Forearm/hand" value={forearmFatigue} options={["None", "Mild", "Moderate", "High"]} onChange={setForearmFatigue} />
          <SelectField label="Trunk/back" value={trunkFatigue} options={["None", "Mild", "Moderate", "High"]} onChange={setTrunkFatigue} />
          <SelectField label="Arm after" value={armAfter} options={["green", "yellow", "red"]} onChange={(value) => setArmAfter(value as "green" | "yellow" | "red")} />
        </div>
      ) : null}

      {lane === "physical" ? (
        <div className="lane-log-grid">
          <SelectField label="RPE" value={sessionRpe} options={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]} onChange={setSessionRpe} />
          <SelectField label="Arm after" value={armAfter} options={["green", "yellow", "red"]} onChange={(value) => setArmAfter(value as "green" | "yellow" | "red")} />
          <SelectField label="Knee after" value={kneeAfter} options={["Green", "Yellow", "Red"]} onChange={setKneeAfter} />
          <SelectField label="Energy" value={energy} options={["Green", "Yellow", "Red"]} onChange={setEnergy} />
        </div>
      ) : null}

      {lane === "recovery" ? (
        <div className="lane-log-grid">
          <SelectField label="Arm care" value={armCare} options={["Yes", "No"]} onChange={setArmCare} />
          <SelectField label="Knee capacity" value={kneeCapacity} options={["Yes", "No"]} onChange={setKneeCapacity} />
          <SelectField label="Mobility" value={mobility} options={["Yes", "No"]} onChange={setMobility} />
          <SelectField label="Felt after" value={feltBetter} options={["Better", "Same", "Worse"]} onChange={setFeltBetter} />
        </div>
      ) : null}

      <label className="field">
        <span>One note</span>
        <textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>

      <Button variant="primary" fullWidth onClick={save}>
        Save {titleCase(lane)} Log
      </Button>
    </Card>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function buildReadiness(armStatus?: "green" | "yellow" | "red"): ReadinessSnapshot {
  const arm = armStatus === "red" ? "Red" : armStatus === "yellow" ? "Yellow" : "Green";
  const knee = "Yellow";
  const energy = "Green";
  const overall = arm === "Red" ? "Recovery Path" : arm === "Yellow" || knee === "Yellow" ? "Modified Path" : "Normal Path";
  const recommendation =
    overall === "Recovery Path"
      ? "Recovery comes first. Keep non-throwing work pain-free and low stress."
      : overall === "Modified Path"
        ? "Train today's main priority, but modify knee-heavy or arm-heavy work."
        : "Train today's main priority and keep the next-morning response clean.";
  return { arm, knee, energy, overall, recommendation };
}

function buildLanePlans(session: SessionPlan, readiness: ReadinessSnapshot): LanePlans {
  return {
    hitting: {
      sessionType: "Contact Quality",
      stress: "Medium",
      intent: "Medium",
      focus: "Middle-field barrels + away pitch through the big part.",
      highIntent: session.mound || readiness.arm !== "Green" ? "Not Recommended" : "Allowed",
      avoid: ["Turning contact work into an EV test", "High-intent finish if arm is yellow", "Overswinging late"],
      sections: [
        "Focused Block: middle-field barrel work.",
        "Freedom Block: compete, but keep intent contained.",
        "Limit redlining, not normal hitting.",
      ],
    },
    physical: {
      sessionType: "Main Strength Bridge",
      stress: "High",
      focus: "Lower strength + knee capacity.",
      location: "Planet Fitness",
      recommended: readiness.knee === "Yellow" ? "Short" : "Full",
      modifier: readiness.knee === "Yellow" ? "Reduce painful knee-dominant work." : "Normal path.",
      reason: readiness.knee === "Yellow" ? "Yellow knee - keep hinge/posterior-chain work, reduce painful knee-dominant work." : undefined,
      avoid: ["Painful knee-dominant volume", "Max lower body if mound/high-output day is next", "Adding extra finishers"],
      sections: [
        "Primer: easy movement + tissue temperature.",
        "Strength Bridge: hinge/posterior-chain priority.",
        "Knee Capacity: pain-free isometric or controlled work.",
        "Arm Support: cuff/scap/serratus if needed.",
      ],
    },
    recovery: {
      sessionType: "Arm care + knee reset",
      stress: "Low",
      focus: "Support tomorrow's response.",
      recommended: "Recovery",
      avoid: ["Chasing fatigue", "Skipping next-morning notes"],
      sections: ["Forearm flush", "Light cuff/scap", "Knee isometric", "Mobility", "Hydration + next-morning response note"],
    },
  };
}

function buildDailyStressCheck(session: SessionPlan, lanePlans: LanePlans): DailyStressCheck {
  const throwingHigh = session.mound || session.dayType.includes("High") || session.intent.includes("90");
  const hittingHigh = lanePlans.hitting.sessionType.includes("Bat Speed") || lanePlans.hitting.sessionType.includes("EV");
  const physicalHigh = lanePlans.physical.stress === "High";

  if ((throwingHigh && physicalHigh) || (hittingHigh && physicalHigh) || (throwingHigh && hittingHigh)) {
    return {
      status: "Watch",
      recommendation: "Choose one priority.",
      reason: "High-output elements are stacking across lanes.",
      alternatives: ["Full lift + Contact Quality", "Reduced lift + Bat Speed microdose", "Recovery / Feel hitting"],
    };
  }

  return {
    status: "Manageable",
    recommendation: "No major stress stack detected.",
    reason: "Throwing, hitting, and physical work are not all redlining today.",
    alternatives: ["Follow the plan", "Keep hitting medium intent", "Use the short lift if knee feels yellow"],
  };
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function AdjustedPlanReady({
  session,
  result,
  drills,
  onStart,
  onEdit,
  onUseOriginal,
}: {
  session: SessionPlan;
  result: ResultState;
  drills: Drill[];
  onStart: () => void;
  onEdit: () => void;
  onUseOriginal: () => void;
}) {
  const adjustedDrills = selectedDrills(result.adjusted.drillIds, drills);
  const adjustedPlyos = plyoPlanForSession(session, result.status.status);

  return (
    <Card accent className="adjusted-ready-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">This is guidance, not a restriction</span>
          <h2>Adjusted Plan Ready</h2>
        </div>
        <StatusBadge status={result.status.status} />
      </div>
      <p className="recommendation">{result.adjusted.recommendation}</p>

      <dl className="detail-grid">
        <div>
          <dt>Adjusted type</dt>
          <dd>{result.adjusted.dayType}</dd>
        </div>
        <div>
          <dt>Goal</dt>
          <dd>{result.adjusted.goal}</dd>
        </div>
        <div>
          <dt>Warmup</dt>
          <dd>{result.adjusted.warmup}</dd>
        </div>
        <div>
          <dt>Plyos</dt>
          <dd>{adjustedPlyos.title}: {adjustedPlyos.summary}</dd>
        </div>
        <div className="wide">
          <dt>Throwing</dt>
          <dd>{result.adjusted.throwing}</dd>
        </div>
        <div className="wide">
          <dt>Drills</dt>
          <dd>{adjustedDrills.map((drill) => drill.name).join(", ") || "None"}</dd>
        </div>
        <div className="wide">
          <dt>Avoid</dt>
          <dd>{result.adjusted.avoid.join(", ")}</dd>
        </div>
      </dl>

      <div className="button-stack">
        <Button variant="primary" fullWidth onClick={onStart}>
          Start Adjusted Plan
        </Button>
        <Button variant="secondary" fullWidth onClick={onEdit}>
          Edit Check-In
        </Button>
        <Button variant="ghost" fullWidth onClick={onUseOriginal}>
          Use Original Plan
        </Button>
      </div>
    </Card>
  );
}

function FullPlanView({
  session,
  drills,
  adjusted,
  status = "not checked",
  onBack,
  onAdjust,
  onReset,
  onSaveLog,
  onOpenPlan,
}: {
  session: SessionPlan;
  drills: Drill[];
  adjusted?: AdjustedSession;
  status?: "green" | "yellow" | "red" | "not checked";
  onBack: () => void;
  onAdjust: () => void;
  onReset: () => void;
  onSaveLog: (log: TrainingLog) => void;
  onOpenPlan: () => void;
}) {
  const activeDrillIds = adjusted?.drillIds ?? session.drillIds;
  const activeDrills = selectedDrills(activeDrillIds, drills);
  const plyos = plyoPlanForSession(session, status);
  const throwing = adjusted?.throwing ?? `${session.throws} throws, ${session.distanceFt} ft, ${session.intent}.`;
  const dayType = adjusted?.dayType ?? session.dayType;
  const focus = adjusted?.goal ?? session.focus;
  const cue = adjusted?.mainCue ?? session.mainCue;

  return (
    <div className="screen stack active-session">
      <TodayTopper label="Full Plan" onBack={onBack} />

      <Card accent className="active-session-hero">
        <span className="eyebrow">{adjusted ? "Adjusted plan" : "Planned session"}</span>
        <h2>Full Plan - {dayType}</h2>
        <p>{focus}</p>
        <strong>Cue: {cue}</strong>
        <div className="button-row">
          <Button variant="secondary" icon={<SlidersHorizontal size={17} />} onClick={onAdjust}>
            Adjust Full Plan
          </Button>
          {adjusted ? (
            <Button variant="ghost" icon={<RotateCcw size={17} />} onClick={onReset}>
              Reset to Planned
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onOpenPlan}>
            Edit in Plan
          </Button>
        </div>
      </Card>

      <AccordionCard title="1. Warmup" summary={warmupNameForSession(session, adjusted)} defaultOpen>
        <DailySections sections={warmupDetailsForSession(session, adjusted)} />
      </AccordionCard>

      <AccordionCard title={`2. ${plyos.title}`} summary={plyos.summary}>
        <PlyoDetail plyos={plyos} />
      </AccordionCard>

      <AccordionCard title="3. Mechanics Primer / Drills" summary={drillSummary(activeDrillIds, drills)}>
        <div className="card-list compact-drill-list">
          {activeDrills.length ? (
            activeDrills.map((drill) => <DrillCard key={drill.id} drill={drill} compact embedded />)
          ) : (
            <p className="muted-line">No drills planned.</p>
          )}
        </div>
      </AccordionCard>

      <AccordionCard title="4. Throwing" summary={throwing}>
        <dl className="detail-grid">
          <div>
            <dt>Prescription</dt>
            <dd>{throwing}</dd>
          </div>
          <div>
            <dt>Mound</dt>
            <dd>{adjusted ? (adjusted.avoid.includes("Mound") ? "No" : session.mound ? "Yes" : "No") : session.mound ? "Yes" : "No"}</dd>
          </div>
          <div className="wide">
            <dt>Main cue</dt>
            <dd>{cue}</dd>
          </div>
        </dl>
        <p className="stop-if-line">Stop if: tightness increases, arm speed disappears, or mechanics change.</p>
      </AccordionCard>

      <AccordionCard title="5. Post-Throw Cooldown" summary="5-10 min">
        <DailySections sections={cooldownDetailsForSession()} />
      </AccordionCard>

      <AccordionCard title="6. Quick Log" summary="Fast optional save">
        <QuickLogCard
          session={session}
          armStatus={status}
          actualDayType={dayType}
          onSave={onSaveLog}
          embedded
        />
      </AccordionCard>
    </div>
  );
}

function DailySections({ sections }: { sections: { title: string; summary: string; items: string[] }[] }) {
  return (
    <div className="daily-sections">
      {sections.map((section) => (
        <div key={section.title} className="daily-detail-section">
          <div>
            <strong>{section.title}</strong>
            <span>{section.summary}</span>
          </div>
          <ChecklistRows items={section.items} />
        </div>
      ))}
    </div>
  );
}

function ChecklistRows({ items }: { items: string[] }) {
  return (
    <div className="checklist-rows">
      {items.map((item) => (
        <label key={item} className="check-row">
          <input type="checkbox" />
          <span>{item}</span>
        </label>
      ))}
    </div>
  );
}

function PlyoDetail({ plyos }: { plyos: ReturnType<typeof plyoPlanForSession> }) {
  return (
    <div className="plyo-detail">
      <div>
        <h3>{plyos.title}</h3>
        {plyos.goal ? <p>{plyos.goal}</p> : null}
      </div>
      {plyos.rules ? (
        <div className="daily-detail-section">
          <div>
            <strong>Rules</strong>
            <span>Earn it</span>
          </div>
          <ChecklistRows items={plyos.rules} />
        </div>
      ) : null}
      <div className="daily-detail-section">
        <div>
          <strong>{plyos.rules ? "Possible work" : "Work"}</strong>
          <span>{plyos.summary}</span>
        </div>
        <ChecklistRows items={plyos.items} />
      </div>
      <p className="avoid-line">Avoid: {plyos.avoid.join(", ")}</p>
    </div>
  );
}
