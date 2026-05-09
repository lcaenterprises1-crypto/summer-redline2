import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ArmStatus, SessionPlan, TrainingLog } from "../types";
import { Button } from "./Button";
import { Card } from "./Card";

interface QuickLogCardProps {
  session: SessionPlan;
  armStatus?: ArmStatus | "not checked";
  actualDayType?: string;
  onSave: (log: TrainingLog) => void;
  embedded?: boolean;
}

export function QuickLogCard({
  session,
  armStatus = "not checked",
  actualDayType,
  onSave,
  embedded = false,
}: QuickLogCardProps) {
  const initial = useMemo(() => createQuickLog(session, armStatus, actualDayType), [actualDayType, armStatus, session]);
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(initial);
    setSaved(false);
  }, [initial]);

  const update = <K extends keyof TrainingLog>(key: K, value: TrainingLog[K]) => {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const content = (
    <>
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">Optional</span>
          <h2>Quick Log</h2>
        </div>
      </div>

      <form
        className="quick-log-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ ...form, id: `log-${Date.now()}` });
          setSaved(true);
        }}
      >
        <label className="field">
          <span>Total throws</span>
          <input type="number" min={0} value={form.totalThrows} onChange={(event) => update("totalThrows", Number(event.target.value))} />
        </label>
        <label className="field">
          <span>Max distance</span>
          <input type="number" min={0} value={form.maxDistanceFt} onChange={(event) => update("maxDistanceFt", Number(event.target.value))} />
        </label>
        <label className="field">
          <span>Mound pitches</span>
          <input type="number" min={0} value={form.moundPitches} onChange={(event) => update("moundPitches", Number(event.target.value))} />
        </label>
        <label className="field">
          <span>Arm status</span>
          <select value={form.armStatus} onChange={(event) => update("armStatus", event.target.value as TrainingLog["armStatus"])}>
            <option>not checked</option>
            <option>green</option>
            <option>yellow</option>
            <option>red</option>
          </select>
        </label>
        <label className="field">
          <span>Forearm after</span>
          <input
            type="number"
            min={0}
            max={10}
            value={form.forearmTightnessAfter}
            onChange={(event) => update("forearmTightnessAfter", Number(event.target.value))}
          />
        </label>
        <label className="field">
          <span>Pain during</span>
          <input type="number" min={0} max={10} value={form.painDuring} onChange={(event) => update("painDuring", Number(event.target.value))} />
        </label>
        <label className="field quick-log-notes">
          <span>Notes</span>
          <textarea rows={3} value={form.notes} onChange={(event) => update("notes", event.target.value)} />
        </label>
        <Button type="submit" variant="primary" icon={<Save size={18} />} fullWidth>
          Save Log
        </Button>
      </form>
      {saved ? <p className="inline-message">Quick log saved.</p> : null}
    </>
  );

  if (embedded) {
    return <div className="quick-log-panel">{content}</div>;
  }

  return (
    <Card className="quick-log-card">
      {content}
    </Card>
  );
}

function createQuickLog(
  session: SessionPlan,
  armStatus: ArmStatus | "not checked",
  actualDayType?: string,
): TrainingLog {
  return {
    id: `log-${Date.now()}`,
    date: session.date,
    phase: session.phase,
    plannedDayType: session.dayType,
    actualDayType: actualDayType ?? session.dayType,
    armStatus,
    totalThrows: 0,
    highIntentThrows: 0,
    moundPitches: 0,
    maxDistanceFt: 0,
    intentRange: session.intent,
    drillIds: session.drillIds,
    mainCue: session.mainCue,
    forearmTightnessAfter: 0,
    bicepsTightnessAfter: 0,
    painDuring: 0,
    painOneHourAfter: 0,
    hotRedHandForearm: false,
    nextMorningSymptoms: false,
    notes: "",
    decision: "",
  };
}
