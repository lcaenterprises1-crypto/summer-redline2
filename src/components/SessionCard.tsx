import { Edit3, NotebookPen, Play } from "lucide-react";
import type { Drill, SessionPlan } from "../types";
import { Button } from "./Button";
import { Card } from "./Card";

interface SessionCardProps {
  session: SessionPlan;
  drills: Drill[];
  title?: string;
  showActions?: boolean;
  onEdit?: (session: SessionPlan) => void;
  onLog?: (session: SessionPlan) => void;
  onFollow?: (session: SessionPlan) => void;
}

export function SessionCard({
  session,
  drills,
  title = "Today's Plan",
  showActions = true,
  onEdit,
  onLog,
  onFollow,
}: SessionCardProps) {
  const drillNames = session.drillIds
    .map((id) => drills.find((drill) => drill.id === id)?.name)
    .filter(Boolean)
    .join(", ");
  const warmup =
    session.dayType === "Full Off" || session.dayType === "Recovery / Arm-Care"
      ? "No-Throw Recovery Warmup"
      : session.mound
        ? "Pre-Mound Warmup"
        : "Full Throwing Warmup";

  return (
    <Card accent className="session-card">
      <div className="card-topline">
        <span>{title}</span>
        <span>Week {session.week}</span>
      </div>
      <h2>{session.phase}</h2>
      <div className="session-title-row">
        <strong>{session.dayType}</strong>
        <span>{session.focus}</span>
      </div>

      <dl className="detail-grid">
        <div>
          <dt>Goal</dt>
          <dd>{session.goal}</dd>
        </div>
        <div>
          <dt>Throws</dt>
          <dd>{session.throws}</dd>
        </div>
        <div>
          <dt>Distance</dt>
          <dd>{session.distanceFt}</dd>
        </div>
        <div>
          <dt>Intent</dt>
          <dd>{session.intent}</dd>
        </div>
        <div>
          <dt>Mound</dt>
          <dd>{session.mound ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt>Main cue</dt>
          <dd>{session.mainCue}</dd>
        </div>
        <div className="wide">
          <dt>Warmup</dt>
          <dd>{warmup}</dd>
        </div>
        <div className="wide">
          <dt>Plyos</dt>
          <dd>{session.plyoGuidance}</dd>
        </div>
        <div className="wide">
          <dt>Drills</dt>
          <dd>{drillNames || "None planned"}</dd>
        </div>
      </dl>

      {session.notes ? <p className="note">{session.notes}</p> : null}

      {showActions ? (
        <div className="button-stack">
          <Button variant="primary" icon={<Play size={18} />} fullWidth onClick={() => onFollow?.(session)}>
            Follow Planned Session
          </Button>
          <Button variant="secondary" icon={<NotebookPen size={18} />} fullWidth onClick={() => onLog?.(session)}>
            Log Session
          </Button>
          {onEdit ? (
            <Button variant="ghost" icon={<Edit3 size={18} />} fullWidth onClick={() => onEdit(session)}>
              Edit Session
            </Button>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
