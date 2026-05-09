import { Activity } from "lucide-react";
import { useState } from "react";
import type { CheckIn } from "../types";
import { emptyCheckIn, intentPreferences, mechanicalIssues } from "../logic/armStatus";
import { Button } from "./Button";
import { Card } from "./Card";

interface CheckInFormProps {
  onSubmit: (checkIn: CheckIn) => void;
}

export function CheckInForm({ onSubmit }: CheckInFormProps) {
  const [form, setForm] = useState<CheckIn>(() => emptyCheckIn());

  const update = <K extends keyof CheckIn>(key: K, value: CheckIn[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <Card className="form-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Optional guided mode</span>
          <h2>Run Check-In</h2>
        </div>
      </div>

      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <RangeField
          label="Forearm / brachioradialis tightness"
          min={0}
          max={10}
          value={form.forearmTightness}
          onChange={(value) => update("forearmTightness", value)}
        />
        <RangeField
          label="Biceps / anterior elbow tightness"
          min={0}
          max={10}
          value={form.bicepsTightness}
          onChange={(value) => update("bicepsTightness", value)}
        />
        <RangeField
          label="Elbow pain"
          min={0}
          max={10}
          value={form.elbowPain}
          onChange={(value) => update("elbowPain", value)}
        />
        <RangeField
          label="Shoulder pain"
          min={0}
          max={10}
          value={form.shoulderPain}
          onChange={(value) => update("shoulderPain", value)}
        />
        <RangeField
          label="Arm freshness"
          min={1}
          max={5}
          value={form.armFreshness}
          onChange={(value) => update("armFreshness", value)}
        />
        <label className="field">
          <span>Sleep hours</span>
          <input
            type="number"
            min={0}
            max={14}
            step={0.25}
            value={form.sleepHours}
            onChange={(event) => update("sleepHours", Number(event.target.value))}
          />
        </label>
        <RangeField
          label="Body fatigue"
          min={1}
          max={5}
          value={form.bodyFatigue}
          onChange={(value) => update("bodyFatigue", value)}
        />

        <div className="switch-grid">
          <SwitchField
            label="Hot/red hand or forearm?"
            checked={form.hotRedHandForearm}
            onChange={(value) => update("hotRedHandForearm", value)}
          />
          <SwitchField
            label="Numbness / tingling / burning / zapping?"
            checked={form.nerveSymptoms}
            onChange={(value) => update("nerveSymptoms", value)}
          />
          <SwitchField
            label="Next-morning symptoms from previous session?"
            checked={form.nextMorningSymptoms}
            onChange={(value) => update("nextMorningSymptoms", value)}
          />
        </div>

        <label className="field">
          <span>Main mechanical issue today</span>
          <select
            value={form.mechanicalIssue}
            onChange={(event) => update("mechanicalIssue", event.target.value)}
          >
            {mechanicalIssues.map((issue) => (
              <option key={issue}>{issue}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Intent preference</span>
          <select
            value={form.intentPreference}
            onChange={(event) => update("intentPreference", event.target.value)}
          >
            {intentPreferences.map((preference) => (
              <option key={preference}>{preference}</option>
            ))}
          </select>
        </label>

        <Button type="submit" variant="primary" icon={<Activity size={18} />} fullWidth>
          Build Adjusted Session
        </Button>
      </form>
    </Card>
  );
}

interface RangeFieldProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

function RangeField({ label, min, max, value, onChange }: RangeFieldProps) {
  return (
    <label className="range-field">
      <span>
        {label}
        <strong>{value}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

interface SwitchFieldProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function SwitchField({ label, checked, onChange }: SwitchFieldProps) {
  return (
    <label className="switch-field">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
