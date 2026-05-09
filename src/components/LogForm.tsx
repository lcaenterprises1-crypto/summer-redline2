import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Drill, SessionPlan, TrainingLog } from "../types";
import { todayIso } from "../logic/schedule";
import { Button } from "./Button";
import { Card } from "./Card";

interface LogFormProps {
  drills: Drill[];
  session?: SessionPlan;
  onSave: (log: TrainingLog) => void;
  embedded?: boolean;
}

const dayTypes = [
  "Full Off",
  "Recovery / Arm-Care",
  "Recovery Catch",
  "Mechanics Catch",
  "Medium Build Day",
  "Mound Transfer Day",
  "High-Intent / Velo Day",
  "Dry Mechanics",
  "Modified",
];

export function LogForm({ drills, session, onSave, embedded = false }: LogFormProps) {
  const initial = useMemo(() => createInitialLog(session), [session]);
  const [form, setForm] = useState<TrainingLog>(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const update = <K extends keyof TrainingLog>(key: K, value: TrainingLog[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleDrill = (drillId: string) => {
    setForm((current) => ({
      ...current,
      drillIds: current.drillIds.includes(drillId)
        ? current.drillIds.filter((id) => id !== drillId)
        : [...current.drillIds, drillId],
    }));
  };

  const content = (
    <>
      <div className="section-heading">
        <div>
          <span className="eyebrow">Optional</span>
          <h2>Log Session</h2>
        </div>
      </div>

      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ ...form, id: form.id || `log-${Date.now()}` });
          setForm(createInitialLog(session));
        }}
      >
        <div className="two-col">
          <label className="field">
            <span>Date</span>
            <input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} />
          </label>
          <label className="field">
            <span>Arm status</span>
            <select
              value={form.armStatus}
              onChange={(event) => update("armStatus", event.target.value as TrainingLog["armStatus"])}
            >
              <option>not checked</option>
              <option>green</option>
              <option>yellow</option>
              <option>red</option>
            </select>
          </label>
        </div>

        <label className="field">
          <span>Phase</span>
          <input value={form.phase} onChange={(event) => update("phase", event.target.value)} />
        </label>

        <div className="two-col">
          <label className="field">
            <span>Planned day type</span>
            <select
              value={form.plannedDayType}
              onChange={(event) => update("plannedDayType", event.target.value)}
            >
              {dayTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Actual day type</span>
            <select value={form.actualDayType} onChange={(event) => update("actualDayType", event.target.value)}>
              {dayTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="three-col">
          <NumberField label="Total throws" value={form.totalThrows} onChange={(v) => update("totalThrows", v)} />
          <NumberField
            label="High-intent"
            value={form.highIntentThrows}
            onChange={(v) => update("highIntentThrows", v)}
          />
          <NumberField label="Mound pitches" value={form.moundPitches} onChange={(v) => update("moundPitches", v)} />
        </div>

        <div className="two-col">
          <NumberField label="Max distance ft" value={form.maxDistanceFt} onChange={(v) => update("maxDistanceFt", v)} />
          <label className="field">
            <span>Intent range</span>
            <input value={form.intentRange} onChange={(event) => update("intentRange", event.target.value)} />
          </label>
        </div>

        <label className="field">
          <span>Main cue</span>
          <input value={form.mainCue} onChange={(event) => update("mainCue", event.target.value)} />
        </label>

        <div className="field">
          <span>Drills used</span>
          <div className="chip-grid">
            {drills.map((drill) => (
              <button
                key={drill.id}
                type="button"
                className={`chip ${form.drillIds.includes(drill.id) ? "active" : ""}`}
                onClick={() => toggleDrill(drill.id)}
              >
                {drill.name}
              </button>
            ))}
          </div>
        </div>

        <div className="two-col">
          <NumberField
            label="Forearm after"
            max={10}
            value={form.forearmTightnessAfter}
            onChange={(v) => update("forearmTightnessAfter", v)}
          />
          <NumberField
            label="Biceps/elbow after"
            max={10}
            value={form.bicepsTightnessAfter}
            onChange={(v) => update("bicepsTightnessAfter", v)}
          />
          <NumberField label="Pain during" max={10} value={form.painDuring} onChange={(v) => update("painDuring", v)} />
          <NumberField
            label="Pain 1 hour after"
            max={10}
            value={form.painOneHourAfter}
            onChange={(v) => update("painOneHourAfter", v)}
          />
        </div>

        <div className="switch-grid">
          <label className="switch-field">
            <span>Hot/red hand or forearm?</span>
            <input
              type="checkbox"
              checked={form.hotRedHandForearm}
              onChange={(event) => update("hotRedHandForearm", event.target.checked)}
            />
          </label>
          <label className="switch-field">
            <span>Next-morning symptoms?</span>
            <input
              type="checkbox"
              checked={form.nextMorningSymptoms}
              onChange={(event) => update("nextMorningSymptoms", event.target.checked)}
            />
          </label>
        </div>

        <label className="field">
          <span>Decision</span>
          <select value={form.decision} onChange={(event) => update("decision", event.target.value as TrainingLog["decision"])}>
            <option value="">Not set</option>
            <option value="progress">Progress</option>
            <option value="hold">Hold</option>
            <option value="regress">Regress</option>
          </select>
        </label>

        <label className="field">
          <span>Notes</span>
          <textarea rows={4} value={form.notes} onChange={(event) => update("notes", event.target.value)} />
        </label>

        <Button type="submit" variant="primary" icon={<Save size={18} />} fullWidth>
          Save Log
        </Button>
      </form>
    </>
  );

  if (embedded) {
    return <div className="form-card embedded-form">{content}</div>;
  }

  return (
    <Card className="form-card">
      {content}
    </Card>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

function NumberField({ label, value, onChange, max }: NumberFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function createInitialLog(session?: SessionPlan): TrainingLog {
  return {
    id: `log-${Date.now()}`,
    date: session?.date ?? todayIso(),
    phase: session?.phase ?? "",
    plannedDayType: session?.dayType ?? "Mechanics Catch",
    actualDayType: session?.dayType ?? "Mechanics Catch",
    armStatus: "not checked",
    totalThrows: 0,
    highIntentThrows: 0,
    moundPitches: 0,
    maxDistanceFt: 0,
    intentRange: session?.intent ?? "",
    drillIds: session?.drillIds ?? [],
    mainCue: session?.mainCue ?? "",
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
