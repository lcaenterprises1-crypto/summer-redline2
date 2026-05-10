import { Activity } from "lucide-react";
import { useState } from "react";
import type { CheckIn } from "../types";
import { emptyCheckIn, intentPreferences, mechanicalIssues } from "../logic/armStatus";
import { Button } from "./Button";
import { Card } from "./Card";
import { NumericInput } from "./NumericInput";

interface CheckInFormProps {
  onSubmit: (checkIn: CheckIn) => void;
  compact?: boolean;
}

export function CheckInForm({ onSubmit, compact = false }: CheckInFormProps) {
  const [form, setForm] = useState<CheckIn>(() => emptyCheckIn());

  const update = <K extends keyof CheckIn>(key: K, value: CheckIn[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <Card className={`form-card ${compact ? "compact-checkin" : ""}`}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">Optional guided mode</span>
          <h2>Run Check-In</h2>
        </div>
      </div>

      <form
        className={`compact-checkin-form ${compact ? "compact-form" : ""}`}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <div className="checkin-group">
          <h3>Arm Symptoms</h3>
          <div className="compact-number-grid">
            <NumberCheckInField
              label="Forearm"
              value={form.forearmTightness}
              max={10}
              onChange={(value) => update("forearmTightness", value)}
            />
            <NumberCheckInField
              label="Biceps"
              value={form.bicepsTightness}
              max={10}
              onChange={(value) => update("bicepsTightness", value)}
            />
            <NumberCheckInField
              label="Elbow"
              value={form.elbowPain}
              max={10}
              onChange={(value) => update("elbowPain", value)}
            />
            <NumberCheckInField
              label="Shoulder"
              value={form.shoulderPain}
              max={10}
              onChange={(value) => update("shoulderPain", value)}
            />
          </div>
        </div>

        <div className="checkin-group">
          <h3>Readiness</h3>
          <div className="compact-number-grid readiness-grid">
            <NumberCheckInField
              label="Freshness"
              value={form.armFreshness}
              min={1}
              max={5}
              fallback={4}
              onChange={(value) => update("armFreshness", value)}
            />
            <NumberCheckInField
              label="Sleep"
              value={form.sleepHours}
              max={14}
              step={0.25}
              inputMode="decimal"
              fallback={8}
              onChange={(value) => update("sleepHours", value)}
            />
            <NumberCheckInField
              label="Fatigue"
              value={form.bodyFatigue}
              min={1}
              max={5}
              fallback={2}
              onChange={(value) => update("bodyFatigue", value)}
            />
          </div>
        </div>

        <div className="checkin-group">
          <h3>Red Flags</h3>
          <div className="switch-grid compact-switches">
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
        </div>

        <div className="checkin-group">
          <h3>Mechanical Feel</h3>
          <label className="field">
            <span>Main issue today</span>
            <select
              value={form.mechanicalIssue}
              onChange={(event) => update("mechanicalIssue", event.target.value)}
            >
              {mechanicalIssues.map((issue) => (
                <option key={issue}>{issue}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="checkin-group">
          <h3>Intent</h3>
          <label className="field">
            <span>Preference</span>
            <select
              value={form.intentPreference}
              onChange={(event) => update("intentPreference", event.target.value)}
            >
              {intentPreferences.map((preference) => (
                <option key={preference}>{preference}</option>
              ))}
            </select>
          </label>
        </div>

        <Button type="submit" variant="primary" icon={<Activity size={18} />} fullWidth>
          Build Adjusted Plan
        </Button>
      </form>
    </Card>
  );
}

interface NumberCheckInFieldProps {
  label: string;
  min?: number;
  max: number;
  value: number;
  fallback?: number;
  step?: number;
  inputMode?: "numeric" | "decimal";
  onChange: (value: number) => void;
}

function NumberCheckInField({
  label,
  min = 0,
  max,
  value,
  fallback = 0,
  step,
  inputMode = "numeric",
  onChange,
}: NumberCheckInFieldProps) {
  return (
    <label className="compact-number-field">
      <span>{label}</span>
      <NumericInput
        ariaLabel={label}
        fallback={fallback}
        inputMode={inputMode}
        max={max}
        min={min}
        step={step}
        value={value}
        onChange={onChange}
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
