import { ClipboardCheck, RotateCcw, SlidersHorizontal, Undo2 } from "lucide-react";
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

type TodayMode = "overview" | "adjust" | "adjusted" | "active";

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
        onStart={() => {
          setActiveAdjusted(false);
          setMode("active");
        }}
        onAdjust={() => setMode("adjust")}
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
  onStart,
  onAdjust,
}: {
  session: SessionPlan;
  drills: Drill[];
  todayDrills: Drill[];
  plyoSummary: string;
  onStart: () => void;
  onAdjust: () => void;
}) {
  const warmup = warmupNameForSession(session);

  return (
    <>
      <Card accent className="today-launch-card">
        <div className="today-launch-kicker">
          <span>Today</span>
          <span>{formatDisplayDate(todayIso(), { weekday: "long" })}</span>
        </div>
        <div className="today-launch-title">
          <span>{session.phase}</span>
          <h2>{session.dayType}</h2>
          <p>{session.focus}</p>
        </div>

        <div className="today-prescription">
          <strong>
            {session.throws} throws / {session.distanceFt} ft / {session.intent}
          </strong>
          <span>{session.mound ? "Mound day" : "No mound"}</span>
          <span>Cue: {session.mainCue}</span>
        </div>

        <div className="button-stack">
          <Button variant="primary" icon={<ClipboardCheck size={18} />} fullWidth onClick={onStart}>
            Start Full Plan
          </Button>
          <Button variant="secondary" icon={<SlidersHorizontal size={18} />} fullWidth onClick={onAdjust}>
            Adjust Full Plan
          </Button>
        </div>
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
    </>
  );
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
