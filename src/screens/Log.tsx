import { Trash2 } from "lucide-react";
import type { Drill, SessionPlan, TrainingLog } from "../types";
import { formatDisplayDate } from "../logic/schedule";
import { AccordionCard } from "../components/AccordionCard";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { LogForm } from "../components/LogForm";
import { QuickLogCard } from "../components/QuickLogCard";
import { StatusBadge } from "../components/StatusBadge";

interface LogProps {
  logs: TrainingLog[];
  drills: Drill[];
  draftSession?: SessionPlan;
  onSave: (log: TrainingLog) => void;
  onDelete: (id: string) => void;
}

export function Log({ logs, drills, draftSession, onSave, onDelete }: LogProps) {
  const drillNames = new Map(drills.map((drill) => [drill.id, drill.name]));

  return (
    <div className="screen stack">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Quick and optional</span>
          <h2>Log</h2>
        </div>
      </div>

      {draftSession ? (
        <QuickLogCard session={draftSession} onSave={onSave} />
      ) : (
        <Card>
          <p className="muted-line">Open Today or Plan and tap Log to prefill a quick log for that session.</p>
        </Card>
      )}

      <AccordionCard title="More Details" summary="Full log form">
        <LogForm drills={drills} session={draftSession} onSave={onSave} embedded />
      </AccordionCard>

      <div className="section-heading">
        <div>
          <span className="eyebrow">{logs.length} saved</span>
          <h2>Saved Logs</h2>
        </div>
      </div>

      <div className="card-list">
        {logs.length === 0 ? (
          <Card>
            <p className="muted-line">No logs yet. The plan still works without them.</p>
          </Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id} className="log-card">
              <div className="card-topline">
                <span>{formatDisplayDate(log.date)}</span>
                <StatusBadge status={log.armStatus} />
              </div>
              {log.lane ? <span className="lane-log-badge">{log.lane}</span> : null}
              <h3>{log.actualDayType}</h3>
              <dl className="compact-details">
                <div>
                  <dt>Throws</dt>
                  <dd>{log.totalThrows}</dd>
                </div>
                <div>
                  <dt>High intent</dt>
                  <dd>{log.highIntentThrows}</dd>
                </div>
                <div>
                  <dt>Mound</dt>
                  <dd>{log.moundPitches}</dd>
                </div>
              </dl>
              {log.laneData ? (
                <p className="muted-line">{formatLaneData(log.laneData)}</p>
              ) : null}
              <p className="note">{log.mainCue || "No cue logged"}</p>
              {log.drillIds?.length > 0 ? (
                <p className="muted-line">
                  {log.drillIds.map((id) => drillNames.get(id) ?? id).join(", ")}
                </p>
              ) : null}
              {log.notes ? <p>{log.notes}</p> : null}
              <Button variant="ghost" icon={<Trash2 size={17} />} onClick={() => onDelete(log.id)}>
                Delete
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function formatLaneData(data: Record<string, string | number | boolean>): string {
  return Object.entries(data)
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" / ");
}
