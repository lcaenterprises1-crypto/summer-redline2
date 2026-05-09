import { CalendarPlus, Edit3, RotateCcw, Save, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Drill, SessionPlan, Settings } from "../types";
import { generateDefaultPlan } from "../logic/schedule";
import { Button } from "../components/Button";
import { Card } from "../components/Card";

interface PlanProps {
  settings: Settings;
  plan: SessionPlan[];
  drills: Drill[];
  onUpdateSettings: (settings: Settings) => void;
  onUpdatePlan: (plan: SessionPlan[]) => void;
  onLogSession: (session: SessionPlan) => void;
}

export function Plan({ settings, plan, drills, onUpdateSettings, onUpdatePlan, onLogSession }: PlanProps) {
  const [startDate, setStartDate] = useState(settings.startDate);
  const [weekFilter, setWeekFilter] = useState("all");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [dayTypeFilter, setDayTypeFilter] = useState("all");
  const [editing, setEditing] = useState<SessionPlan | null>(null);

  const phases = useMemo(() => Array.from(new Set(plan.map((session) => session.phase))), [plan]);
  const dayTypes = useMemo(() => Array.from(new Set(plan.map((session) => session.dayType))), [plan]);

  const filteredPlan = plan.filter((session) => {
    const weekOk = weekFilter === "all" || session.week === Number(weekFilter);
    const phaseOk = phaseFilter === "all" || session.phase === phaseFilter;
    const dayTypeOk = dayTypeFilter === "all" || session.dayType === dayTypeFilter;
    return weekOk && phaseOk && dayTypeOk;
  });

  const regenerate = () => {
    if (!window.confirm("Generate a fresh 13-week plan from this start date? This replaces current plan edits.")) {
      return;
    }
    onUpdateSettings({ ...settings, startDate });
    onUpdatePlan(generateDefaultPlan(startDate));
    setEditing(null);
  };

  const resetPlan = () => {
    if (!window.confirm("Reset the plan to the default schedule for the current start date?")) return;
    onUpdatePlan(generateDefaultPlan(settings.startDate));
    setEditing(null);
  };

  const saveSession = (session: SessionPlan) => {
    onUpdatePlan(plan.map((item) => (item.id === session.id ? session : item)));
    setEditing(null);
  };

  return (
    <div className="screen stack">
      <div className="section-heading">
        <div>
          <span className="eyebrow">13 weeks</span>
          <h2>Plan</h2>
        </div>
      </div>

      <Card>
        <div className="stack">
          <label className="field">
            <span>Start date</span>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <div className="button-row">
            <Button variant="primary" icon={<CalendarPlus size={18} />} onClick={regenerate}>
              Generate Plan
            </Button>
            <Button variant="ghost" icon={<RotateCcw size={18} />} onClick={resetPlan}>
              Reset Default
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="section-heading">
          <div>
            <span className="eyebrow">Filters</span>
            <h2>Find a Day</h2>
          </div>
          <Search size={18} />
        </div>
        <div className="filter-grid">
          <label className="field">
            <span>Week</span>
            <select value={weekFilter} onChange={(event) => setWeekFilter(event.target.value)}>
              <option value="all">All weeks</option>
              {Array.from({ length: 13 }, (_, index) => index + 1).map((week) => (
                <option key={week} value={week}>
                  Week {week}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Phase</span>
            <select value={phaseFilter} onChange={(event) => setPhaseFilter(event.target.value)}>
              <option value="all">All phases</option>
              {phases.map((phase) => (
                <option key={phase}>{phase}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Day type</span>
            <select value={dayTypeFilter} onChange={(event) => setDayTypeFilter(event.target.value)}>
              <option value="all">All day types</option>
              {dayTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {editing ? (
        <SessionEditor
          session={editing}
          drills={drills}
          onCancel={() => setEditing(null)}
          onSave={saveSession}
        />
      ) : null}

      <div className="card-list">
        {filteredPlan.map((session) => (
          <PlanDayCard
            key={session.id}
            session={session}
            drills={drills}
            onEdit={() => setEditing(session)}
            onLog={() => onLogSession(session)}
          />
        ))}
      </div>
    </div>
  );
}

function PlanDayCard({
  session,
  drills,
  onEdit,
  onLog,
}: {
  session: SessionPlan;
  drills: Drill[];
  onEdit: () => void;
  onLog: () => void;
}) {
  const drillNames = session.drillIds
    .map((id) => drills.find((drill) => drill.id === id)?.name)
    .filter(Boolean);

  return (
    <Card className="plan-day-card">
      <div className="card-topline">
        <span>
          Week {session.week} - {session.date}
        </span>
        <span>{session.mound ? "Mound" : "Flat"}</span>
      </div>
      <h3>{session.dayType}</h3>
      <p className="focus-line">{session.focus}</p>
      <dl className="compact-details">
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
      </dl>
      <p className="note">{session.mainCue}</p>
      {drillNames.length > 0 ? <p className="muted-line">{drillNames.join(", ")}</p> : null}
      <div className="button-row">
        <Button variant="secondary" icon={<Edit3 size={17} />} onClick={onEdit}>
          Edit
        </Button>
        <Button variant="ghost" onClick={onLog}>
          Log
        </Button>
      </div>
    </Card>
  );
}

function SessionEditor({
  session,
  drills,
  onCancel,
  onSave,
}: {
  session: SessionPlan;
  drills: Drill[];
  onCancel: () => void;
  onSave: (session: SessionPlan) => void;
}) {
  const [draft, setDraft] = useState(session);

  const update = <K extends keyof SessionPlan>(key: K, value: SessionPlan[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const toggleDrill = (drillId: string) => {
    setDraft((current) => ({
      ...current,
      drillIds: current.drillIds.includes(drillId)
        ? current.drillIds.filter((id) => id !== drillId)
        : [...current.drillIds, drillId],
    }));
  };

  return (
    <Card accent className="form-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Editing {draft.date}</span>
          <h2>Edit Session</h2>
        </div>
        <Button variant="ghost" className="icon-button" icon={<X size={18} />} onClick={onCancel}>
          <span className="sr-only">Close</span>
        </Button>
      </div>

      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(draft);
        }}
      >
        <div className="two-col">
          <label className="field">
            <span>Date</span>
            <input type="date" value={draft.date} onChange={(event) => update("date", event.target.value)} />
          </label>
          <label className="field">
            <span>Week</span>
            <input type="number" min={1} max={13} value={draft.week} onChange={(event) => update("week", Number(event.target.value))} />
          </label>
        </div>

        <label className="field">
          <span>Phase</span>
          <input value={draft.phase} onChange={(event) => update("phase", event.target.value)} />
        </label>
        <div className="two-col">
          <label className="field">
            <span>Day type</span>
            <input value={draft.dayType} onChange={(event) => update("dayType", event.target.value)} />
          </label>
          <label className="field">
            <span>Focus</span>
            <input value={draft.focus} onChange={(event) => update("focus", event.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>Goal</span>
          <textarea rows={3} value={draft.goal} onChange={(event) => update("goal", event.target.value)} />
        </label>
        <div className="three-col">
          <label className="field">
            <span>Throws</span>
            <input value={draft.throws} onChange={(event) => update("throws", event.target.value)} />
          </label>
          <label className="field">
            <span>Distance ft</span>
            <input value={draft.distanceFt} onChange={(event) => update("distanceFt", event.target.value)} />
          </label>
          <label className="field">
            <span>Intent</span>
            <input value={draft.intent} onChange={(event) => update("intent", event.target.value)} />
          </label>
        </div>
        <label className="switch-field">
          <span>Mound day?</span>
          <input type="checkbox" checked={draft.mound} onChange={(event) => update("mound", event.target.checked)} />
        </label>
        <label className="field">
          <span>Plyo guidance</span>
          <textarea rows={3} value={draft.plyoGuidance} onChange={(event) => update("plyoGuidance", event.target.value)} />
        </label>
        <label className="field">
          <span>Main cue</span>
          <input value={draft.mainCue} onChange={(event) => update("mainCue", event.target.value)} />
        </label>
        <label className="field">
          <span>Notes</span>
          <textarea rows={3} value={draft.notes ?? ""} onChange={(event) => update("notes", event.target.value)} />
        </label>
        <div className="field">
          <span>Drills</span>
          <div className="chip-grid">
            {drills.map((drill) => (
              <button
                key={drill.id}
                type="button"
                className={`chip ${draft.drillIds.includes(drill.id) ? "active" : ""}`}
                onClick={() => toggleDrill(drill.id)}
              >
                {drill.name}
              </button>
            ))}
          </div>
        </div>

        <div className="button-row">
          <Button type="submit" variant="primary" icon={<Save size={18} />}>
            Save Session
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
