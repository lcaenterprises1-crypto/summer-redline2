import { CalendarPlus, ChevronDown, Edit3, RotateCcw, Save, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Drill, SessionPlan, Settings } from "../types";
import { formatDisplayDate, generateDefaultPlan, todayIso, weekFromDate } from "../logic/schedule";
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

interface PhaseMeta {
  id: string;
  title: string;
  weeks: [number, number];
  shortGoal: string;
  detailGoal: string;
}

const phaseRoadmap: PhaseMeta[] = [
  {
    id: "phase-1",
    title: "Restore + Patterning",
    weeks: [1, 2],
    shortGoal: "Arm tolerance + clean lower-half feel",
    detailGoal: "Arm feels clean, low-intent throwing returns, lower-half feel begins.",
  },
  {
    id: "phase-2",
    title: "Capacity + Mechanics",
    weeks: [3, 5],
    shortGoal: "Build throwing volume and lower-half pattern",
    detailGoal: "Build throwing volume, keep arm clean, improve lower-half pattern.",
  },
  {
    id: "phase-3",
    title: "Flat-Ground + Mound Reintroduction",
    weeks: [6, 8],
    shortGoal: "Transfer mechanics into controlled mound work",
    detailGoal: "Transfer mechanics into controlled pitching without chasing velo.",
  },
  {
    id: "phase-4",
    title: "Mound Transfer + Controlled Velo",
    weeks: [9, 11],
    shortGoal: "Raise intent while staying clean",
    detailGoal: "Begin converting athleticism and arm speed to mound velo while protecting the arm.",
  },
  {
    id: "phase-5",
    title: "Higher Intent + Maintain Health",
    weeks: [12, 13],
    shortGoal: "Sharpen mound output and maintain health",
    detailGoal: "Sharpen mound output while keeping the arm healthy.",
  },
];

export function Plan({ settings, plan, drills, onUpdateSettings, onUpdatePlan, onLogSession }: PlanProps) {
  const [startDate, setStartDate] = useState(settings.startDate);
  const [editing, setEditing] = useState<SessionPlan | null>(null);

  const currentWeek = Math.min(13, Math.max(1, weekFromDate(todayIso(), settings.startDate)));
  const currentPhase = phaseRoadmap.find((phase) => currentWeek >= phase.weeks[0] && currentWeek <= phase.weeks[1]) ?? phaseRoadmap[0];
  const nextMilestone = milestoneForWeek(currentWeek);
  const progress = Math.min(100, Math.max(0, (currentWeek / 13) * 100));
  const planByWeek = useMemo(() => groupByWeek(plan), [plan]);

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
    <div className="screen stack roadmap-screen">
      <RoadmapHero
        currentWeek={currentWeek}
        currentPhase={currentPhase}
        nextMilestone={nextMilestone}
        progress={progress}
      />

      <Card className="roadmap-settings">
        <label className="field">
          <span>Start date</span>
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <div className="button-row subdued-actions">
          <Button variant="secondary" icon={<CalendarPlus size={17} />} onClick={regenerate}>
            Generate
          </Button>
          <Button variant="ghost" icon={<RotateCcw size={17} />} onClick={resetPlan}>
            Reset
          </Button>
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

      <div className="roadmap-phases">
        {phaseRoadmap.map((phase) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            status={phaseStatus(phase, currentWeek)}
            weeks={weeksForPhase(phase).map((week) => ({
              week,
              sessions: planByWeek.get(week) ?? [],
            }))}
            currentWeek={currentWeek}
            onEdit={setEditing}
            onLog={onLogSession}
          />
        ))}
      </div>
    </div>
  );
}

function RoadmapHero({
  currentWeek,
  currentPhase,
  nextMilestone,
  progress,
}: {
  currentWeek: number;
  currentPhase: PhaseMeta;
  nextMilestone: string;
  progress: number;
}) {
  return (
    <Card accent className="roadmap-hero">
      <div className="card-topline">
        <span>Summer Roadmap</span>
        <span>Week {currentWeek} of 13</span>
      </div>
      <h2>{currentPhase.title}</h2>
      <p>{currentPhase.detailGoal}</p>
      <div className="roadmap-progress" aria-label={`Week ${currentWeek} of 13`}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="roadmap-milestone">
        <span>Next Milestone</span>
        <strong>{nextMilestone}</strong>
      </div>
    </Card>
  );
}

function PhaseCard({
  phase,
  status,
  weeks,
  currentWeek,
  onEdit,
  onLog,
}: {
  phase: PhaseMeta;
  status: "Current" | "Completed" | "Upcoming";
  weeks: { week: number; sessions: SessionPlan[] }[];
  currentWeek: number;
  onEdit: (session: SessionPlan) => void;
  onLog: (session: SessionPlan) => void;
}) {
  const [open, setOpen] = useState(status === "Current");

  return (
    <Card className={`phase-card phase-${status.toLowerCase()}`}>
      <button type="button" className="phase-trigger" onClick={() => setOpen((current) => !current)}>
        <span>
          <small>{status}</small>
          <strong>{phase.title}</strong>
          <em>Weeks {phase.weeks[0]}-{phase.weeks[1]}</em>
        </span>
        <ChevronDown size={19} />
      </button>
      <p>{phase.shortGoal}</p>
      {open ? (
        <div className="week-list">
          {weeks.map(({ week, sessions }) => (
            <WeekAccordion key={week} week={week} sessions={sessions} currentWeek={currentWeek} onEdit={onEdit} onLog={onLog} />
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function WeekAccordion({
  week,
  sessions,
  currentWeek,
  onEdit,
  onLog,
}: {
  week: number;
  sessions: SessionPlan[];
  currentWeek: number;
  onEdit: (session: SessionPlan) => void;
  onLog: (session: SessionPlan) => void;
}) {
  const [open, setOpen] = useState(week === currentWeek);
  const summary = weekSummary(sessions);

  return (
    <div className="week-accordion">
      <button type="button" className="week-trigger" onClick={() => setOpen((current) => !current)}>
        <span>
          <strong>Week {week} - {weekTitle(week)}</strong>
          <small>{summary}</small>
        </span>
        <ChevronDown size={18} />
      </button>
      {open ? (
        <div className="roadmap-days">
          {sessions.map((session) => (
            <RoadmapDayCard key={session.id} session={session} onEdit={() => onEdit(session)} onLog={() => onLog(session)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RoadmapDayCard({ session, onEdit, onLog }: { session: SessionPlan; onEdit: () => void; onLog: () => void }) {
  return (
    <div className="roadmap-day-card">
      <div>
        <span className="roadmap-date">{formatDisplayDate(session.date, { weekday: undefined })}</span>
        <DayTypeBadge dayType={session.dayType} />
      </div>
      <strong>{session.focus}</strong>
      <p>
        {session.throws} throws / {session.distanceFt} / {session.intent}
      </p>
      <div className="day-card-actions">
        <button type="button" onClick={onEdit}>
          Edit
        </button>
        <button type="button" onClick={onLog}>
          Log
        </button>
      </div>
    </div>
  );
}

function DayTypeBadge({ dayType }: { dayType: string }) {
  return <span className={`day-type-badge ${dayTypeClass(dayType)}`}>{dayType}</span>;
}

function groupByWeek(plan: SessionPlan[]): Map<number, SessionPlan[]> {
  const map = new Map<number, SessionPlan[]>();
  plan.forEach((session) => {
    const group = map.get(session.week) ?? [];
    group.push(session);
    map.set(session.week, group);
  });
  map.forEach((sessions) => sessions.sort((a, b) => a.date.localeCompare(b.date)));
  return map;
}

function weeksForPhase(phase: PhaseMeta): number[] {
  const weeks: number[] = [];
  for (let week = phase.weeks[0]; week <= phase.weeks[1]; week += 1) weeks.push(week);
  return weeks;
}

function phaseStatus(phase: PhaseMeta, currentWeek: number): "Current" | "Completed" | "Upcoming" {
  if (currentWeek > phase.weeks[1]) return "Completed";
  if (currentWeek < phase.weeks[0]) return "Upcoming";
  return "Current";
}

function milestoneForWeek(week: number): string {
  if (week < 7) return "First mound reintroduction in Week 7";
  if (week < 9) return "Controlled velo build starts in Week 9";
  if (week < 12) return "Higher-intent phase begins in Week 12";
  return "Finish clean and maintain health";
}

function weekTitle(week: number): string {
  if (week <= 2) return "Restore";
  if (week <= 5) return "Capacity Build";
  if (week <= 8) return "Mound Reintro";
  if (week <= 11) return "Mound Transfer";
  return "Sharpen + Maintain";
}

function weekSummary(sessions: SessionPlan[]): string {
  const throwDays = sessions.filter((session) => session.throws !== "0").length;
  const mechanics = sessions.filter((session) => session.dayType.includes("Mechanics")).length;
  const recovery = sessions.filter((session) => session.dayType.includes("Recovery")).length;
  const mound = sessions.filter((session) => session.mound).length;
  const medium = sessions.filter((session) => session.dayType.includes("Medium")).length;

  return `${throwDays} throwing exposures / ${mechanics} mechanics / ${recovery} recovery / ${medium || mound} build`;
}

function dayTypeClass(dayType: string): string {
  if (dayType === "Full Off") return "type-off";
  if (dayType === "Recovery / Arm-Care") return "type-arm-care";
  if (dayType === "Recovery Catch") return "type-recovery-catch";
  if (dayType === "Mechanics Catch") return "type-mechanics";
  if (dayType === "Medium Build Day") return "type-medium";
  if (dayType === "Mound Transfer Day") return "type-mound";
  if (dayType === "High-Intent / Velo Day") return "type-high";
  return "type-default";
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
