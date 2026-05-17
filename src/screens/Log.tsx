import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { Drill, SessionPlan, TrainingLog } from "../types";
import { isHighIntentHittingExposure, isThrowingTrainingLog } from "../logic/logClassification";
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
  const [laneFilter, setLaneFilter] = useState<"all" | "throwing" | "hitting" | "physical" | "recovery">("all");
  const drillNames = new Map(drills.map((drill) => [drill.id, drill.name]));
  const visibleLogs = useMemo(
    () => (laneFilter === "all" ? logs : logs.filter((log) => (log.lane ?? (isThrowingTrainingLog(log) ? "throwing" : "recovery")) === laneFilter)),
    [laneFilter, logs],
  );

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

      <div className="log-filter-tabs" aria-label="Filter saved logs">
        {(["all", "throwing", "hitting", "physical", "recovery"] as const).map((lane) => (
          <button key={lane} type="button" className={laneFilter === lane ? "active" : ""} onClick={() => setLaneFilter(lane)}>
            {lane}
          </button>
        ))}
      </div>

      <div className="card-list">
        {visibleLogs.length === 0 ? (
          <Card>
            <p className="muted-line">No logs here yet. Use Quick Log from Today when you finish a session.</p>
          </Card>
        ) : (
          visibleLogs.map((log) => (
            <Card key={log.id} className="log-card">
              <div className="card-topline">
                <span>{formatDisplayDate(log.date)}</span>
                <StatusBadge status={log.armStatus} />
              </div>
              {log.lane ? <span className="lane-log-badge">{log.lane}</span> : null}
              <h3>{log.actualDayType}</h3>
              {isThrowingTrainingLog(log) ? (
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
              ) : null}
              {log.laneData ? <LaneLogDetails log={log} /> : null}
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

function LaneLogDetails({ log }: { log: TrainingLog }) {
  if (!log.laneData) return null;
  if (log.lane === "hitting") {
    return (
      <dl className="compact-details lane-log-details">
        <Detail label="Status" value={log.laneData.status} />
        <Detail label="Session" value={log.laneData.sessionType ?? log.plannedDayType} />
        <Detail label="Intent" value={log.laneData.intent} />
        <Detail label="High Intent Exposure" value={isHighIntentHittingExposure(log) ? "Yes" : "No"} />
        <Detail label="Volume" value={log.laneData.swingVolume} />
        {positiveValue(log.laneData.exactSwings) ? <Detail label="Swings" value={log.laneData.exactSwings} /> : null}
        <Detail label="Best contact" value={log.laneData.bestDirection ?? log.laneData.outputBestContact} />
        <Detail label="Worst miss" value={log.laneData.worstMiss ?? log.laneData.outputWorstMiss} />
        <Detail label="Forearm/hand" value={log.laneData.forearmFatigue} />
        <Detail label="Trunk/back" value={log.laneData.trunkFatigue} />
        {positiveValue(log.laneData.maxEv) ? <Detail label="Max EV" value={log.laneData.maxEv} /> : null}
        {positiveValue(log.laneData.top5Ev) ? <Detail label="Top-5 EV" value={log.laneData.top5Ev} /> : null}
        {positiveValue(log.laneData.balls95) ? <Detail label="95+ balls" value={log.laneData.balls95} /> : null}
      </dl>
    );
  }

  if (log.lane === "physical") {
    return (
      <dl className="compact-details lane-log-details">
        <Detail label="Status" value={log.laneData.status} />
        <Detail label="Session" value={log.laneData.sessionType ?? log.plannedDayType} />
        <Detail label="Version" value={log.laneData.version} />
        <Detail label="Location" value={log.laneData.location} />
        <Detail label="RPE" value={log.laneData.sessionRpe} />
        <Detail label="Arm after" value={log.laneData.armAfter} />
        <Detail label="Knee after" value={log.laneData.kneeAfter} />
        <Detail label="Energy" value={log.laneData.energyAfter ?? log.laneData.energy} />
        <Detail label="Main work" value={log.laneData.mainWork} />
        <Detail label="Pain during" value={log.laneData.painDuring} />
      </dl>
    );
  }

  return (
    <dl className="compact-details lane-log-details">
      {Object.entries(log.laneData).slice(0, 6).map(([key, value]) => (
        <Detail key={key} label={formatKey(key)} value={value} />
      ))}
    </dl>
  );
}

function Detail({ label, value }: { label: string; value: string | number | boolean | undefined }) {
  if (value === undefined || value === "") return null;
  return (
    <div>
      <dt>{label}</dt>
      <dd>{String(value)}</dd>
    </div>
  );
}

function positiveValue(value: string | number | boolean | undefined): boolean {
  return typeof value === "number" ? value > 0 : typeof value === "string" ? Number(value) > 0 : false;
}

function formatKey(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}
