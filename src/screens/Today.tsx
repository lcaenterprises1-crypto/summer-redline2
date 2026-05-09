import { ClipboardCheck, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import type { AdjustedSession, CheckIn, CheckInRecord, Drill, SessionPlan } from "../types";
import { evaluateArmStatus, type ArmStatusResult } from "../logic/armStatus";
import { buildAdjustedSession } from "../logic/adjustedSession";
import { formatDisplayDate, todayIso } from "../logic/schedule";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { CheckInForm } from "../components/CheckInForm";
import { DrillCard } from "../components/DrillCard";
import { SessionCard } from "../components/SessionCard";
import { StatusBadge } from "../components/StatusBadge";

interface TodayProps {
  session: SessionPlan;
  drills: Drill[];
  onLogSession: (session: SessionPlan) => void;
  onSaveCheckIn: (record: CheckInRecord) => void;
}

interface ResultState {
  status: ArmStatusResult;
  adjusted: AdjustedSession;
}

export function Today({ session, drills, onLogSession, onSaveCheckIn }: TodayProps) {
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [followMessage, setFollowMessage] = useState("");

  const drillMap = useMemo(() => new Map(drills.map((drill) => [drill.id, drill])), [drills]);
  const todayDrills = session.drillIds.map((id) => drillMap.get(id)).filter(Boolean) as Drill[];
  const yellow = buildAdjustedSession(session, "yellow", "Arm is yellow");
  const red = buildAdjustedSession(session, "red", "Arm is yellow");

  const handleCheckIn = (checkIn: CheckIn) => {
    const status = evaluateArmStatus(checkIn);
    const adjusted = buildAdjustedSession(session, status.status, checkIn.mechanicalIssue);
    setResult({ status, adjusted });
    onSaveCheckIn({
      id: `checkin-${Date.now()}`,
      date: todayIso(),
      sessionId: session.id,
      input: checkIn,
      status: status.status,
      recommendation: adjusted.recommendation,
    });
  };

  return (
    <div className="screen stack">
      <SessionCard session={session} drills={drills} showActions={false} title="Today's Plan" />

      <div className="quick-actions">
        <Button
          variant="primary"
          fullWidth
          icon={<ClipboardCheck size={18} />}
          onClick={() => setFollowMessage("Planned session selected. Keep the cue simple and log if useful.")}
        >
          Follow Planned Session
        </Button>
        <Button
          variant="secondary"
          fullWidth
          icon={<SlidersHorizontal size={18} />}
          onClick={() => setGuidedOpen((open) => !open)}
        >
          Build Adjusted Session
        </Button>
        <Button variant="ghost" fullWidth onClick={() => onLogSession(session)}>
          Log Session
        </Button>
      </div>

      {followMessage ? <p className="inline-message">{followMessage}</p> : null}

      <Card>
        <div className="section-heading">
          <div>
            <span className="eyebrow">{formatDisplayDate(session.date)}</span>
            <h2>Do This Today</h2>
          </div>
        </div>
        <div className="do-list">
          <PlanBlock
            title="Warmup"
            lines={[session.mound ? "Pre-Mound Warmup" : session.dayType === "Full Off" ? "No-Throw Recovery Warmup" : "Full Throwing Warmup"]}
          />
          <PlanBlock
            title="Drills"
            lines={todayDrills.map((drill, index) => `${index + 1}. ${drill.name} - ${drill.dose}`)}
          />
          <PlanBlock
            title="Throwing"
            lines={[
              `${session.throws} throws`,
              `${session.distanceFt} ft`,
              `${session.intent} intent`,
              session.mound ? "Mound: yes" : "No mound",
              "No pulldowns unless explicitly planned and earned.",
            ]}
          />
        </div>
      </Card>

      <Card>
        <div className="section-heading">
          <div>
            <span className="eyebrow">Simple substitutions</span>
            <h2>Yellow / Red Alternatives</h2>
          </div>
        </div>
        <div className="substitution-grid">
          <div className="substitution yellow">
            <StatusBadge status="yellow" />
            <h3>{yellow.dayType}</h3>
            <p>{yellow.throwing}</p>
            <p>{yellow.recommendation}</p>
          </div>
          <div className="substitution red">
            <StatusBadge status="red" />
            <h3>Recommended: no throwing</h3>
            <p>Recovery warmup + arm care only.</p>
            <p>{red.throwing}</p>
          </div>
        </div>
      </Card>

      {todayDrills.length > 0 ? (
        <div className="stack">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Tap for details</span>
              <h2>Today's Drills</h2>
            </div>
          </div>
          <div className="card-list">
            {todayDrills.map((drill) => (
              <DrillCard key={drill.id} drill={drill} compact />
            ))}
          </div>
        </div>
      ) : null}

      {guidedOpen ? <CheckInForm onSubmit={handleCheckIn} /> : null}

      {result ? <AdjustedSessionCard result={result} drills={drills} /> : null}
    </div>
  );
}

function PlanBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="plan-block">
      <h3>{title}</h3>
      {lines.length > 0 ? (
        <ul>
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : (
        <p>None planned.</p>
      )}
    </div>
  );
}

function AdjustedSessionCard({ result, drills }: { result: ResultState; drills: Drill[] }) {
  const drillMap = new Map(drills.map((drill) => [drill.id, drill]));
  const adjustedDrills = result.adjusted.drillIds.map((id) => drillMap.get(id)).filter(Boolean) as Drill[];

  return (
    <Card accent className="adjusted-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Adjusted session</span>
          <h2>{result.status.title}</h2>
        </div>
        <StatusBadge status={result.status.status} />
      </div>

      <p className="recommendation">{result.adjusted.recommendation}</p>
      <p className="note">{result.adjusted.note}</p>

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
          <dt>Throwing</dt>
          <dd>{result.adjusted.throwing}</dd>
        </div>
        <div>
          <dt>Plyos</dt>
          <dd>{result.adjusted.plyoGuidance}</dd>
        </div>
        <div>
          <dt>Main cue</dt>
          <dd>{result.adjusted.mainCue}</dd>
        </div>
      </dl>

      <div className="mini-columns">
        <PlanBlock title="Avoid" lines={result.adjusted.avoid} />
        <PlanBlock title="Log after" lines={result.adjusted.logAfter} />
      </div>

      {adjustedDrills.length > 0 ? (
        <div className="card-list">
          {adjustedDrills.map((drill) => (
            <DrillCard key={drill.id} drill={drill} compact />
          ))}
        </div>
      ) : null}
    </Card>
  );
}
