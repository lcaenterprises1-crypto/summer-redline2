import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ArmStatus, SessionPlan, TrainingLog } from "../types";
import { Button } from "./Button";
import { Card } from "./Card";
import { NumericInput } from "./NumericInput";

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
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    setForm(initial);
    setSaved(false);
    setShowNotes(Boolean(initial.notes));
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
        <div className="quick-log-metrics">
          <QuickNumberField label="Throws" value={form.totalThrows} onChange={(value) => update("totalThrows", value)} />
          <QuickNumberField label="Distance" value={form.maxDistanceFt} onChange={(value) => update("maxDistanceFt", value)} />
          <QuickNumberField label="Mound" value={form.moundPitches} onChange={(value) => update("moundPitches", value)} />
        </div>

        <div className="quick-log-block">
          <span>Arm</span>
          <SegmentedStatus
            value={form.armStatus}
            onChange={(value) => update("armStatus", value)}
          />
        </div>

        <ScoreChipGroup
          label="Forearm after"
          value={form.forearmTightnessAfter}
          onChange={(value) => update("forearmTightnessAfter", value)}
        />
        <ScoreChipGroup
          label="Pain during"
          value={form.painDuring}
          onChange={(value) => update("painDuring", value)}
        />

        <div className="quick-log-notes-control">
          <button
            type="button"
            onClick={() => {
              if (form.notes.trim()) return;
              setShowNotes((current) => !current);
            }}
          >
            {form.notes.trim() ? "Notes added" : showNotes ? "Hide notes" : "+ Add notes"}
          </button>
        </div>

        {showNotes || form.notes.trim() ? (
          <label className="field quick-log-notes">
            <span>Notes <small>optional</small></span>
            <textarea rows={2} value={form.notes} onChange={(event) => update("notes", event.target.value)} />
          </label>
        ) : null}
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

function QuickNumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="compact-number-field quick-number-field">
      <span>{label}</span>
      <NumericInput ariaLabel={label} min={0} value={value} onChange={onChange} />
    </label>
  );
}

function SegmentedStatus({
  value,
  onChange,
}: {
  value: TrainingLog["armStatus"];
  onChange: (value: TrainingLog["armStatus"]) => void;
}) {
  const options: TrainingLog["armStatus"][] = ["not checked", "green", "yellow", "red"];

  return (
    <div className="status-segmented" role="group" aria-label="Arm status">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={value === option ? "active" : ""}
          onClick={() => onChange(option)}
        >
          {option === "not checked" ? "Not checked" : option}
        </button>
      ))}
    </div>
  );
}

function ScoreChipGroup({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="score-chip-group">
      <span>{label}</span>
      <div role="group" aria-label={label}>
        {[0, 1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            className={value === score ? "active" : ""}
            onClick={() => onChange(score)}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
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
    totalThrows: midpointFromText(session.throws),
    highIntentThrows: 0,
    moundPitches: session.mound ? midpointFromText(session.throws) : 0,
    maxDistanceFt: maxNumberFromText(session.distanceFt),
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

function midpointFromText(text: string): number {
  const numbers = text.match(/\d+/g)?.map(Number) ?? [];
  if (numbers.length === 0) return 0;
  if (numbers.length === 1) return numbers[0];
  return Math.round((numbers[0] + numbers[1]) / 2);
}

function maxNumberFromText(text: string): number {
  const numbers = text.match(/\d+/g)?.map(Number) ?? [];
  return numbers.length ? Math.max(...numbers) : 0;
}
