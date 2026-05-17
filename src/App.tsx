import { useEffect, useMemo, useState } from "react";
import type { CheckInRecord, Drill, Screen, SessionPlan, Settings, TrainingLog } from "./types";
import { defaultDrills } from "./data/drills";
import { exportBackupJson, exportLogsCsv } from "./logic/export";
import { defaultStartDate, findSessionForToday, formatDisplayDate, generateDefaultPlan, officialStartDate, todayIso } from "./logic/schedule";
import { loadJson, removeSummerRedlineData, saveJson, storageKeys, type AppBackup } from "./logic/storage";
import { BottomNav } from "./components/BottomNav";
import { Header } from "./components/Header";
import { Today } from "./screens/Today";
import { Plan } from "./screens/Plan";
import { Drills } from "./screens/Drills";
import { Log } from "./screens/Log";
import { Progress } from "./screens/Progress";
import { ReferenceSettings } from "./screens/ReferenceSettings";

function loadInitialSettings(): Settings {
  const stored = loadJson<Settings>(storageKeys.settings, { startDate: defaultStartDate() });
  return { ...stored, startDate: officialStartDate };
}

function loadInitialPlan(settings: Settings): SessionPlan[] {
  const plan = loadJson<SessionPlan[]>(storageKeys.plan, generateDefaultPlan(settings.startDate));
  if (settings.startDate === officialStartDate && plan[0]?.date === officialStartDate) return plan;
  return generateDefaultPlan(settings.startDate);
}

function loadOfficialLogs(): TrainingLog[] {
  return loadJson<TrainingLog[]>(storageKeys.logs, []).filter((log) => log.date >= officialStartDate);
}

function loadOfficialCheckIns(): CheckInRecord[] {
  return loadJson<CheckInRecord[]>(storageKeys.checkIns, []).filter((checkIn) => checkIn.date >= officialStartDate);
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => loadInitialSettings());
  const [plan, setPlan] = useState<SessionPlan[]>(() => loadInitialPlan(loadInitialSettings()));
  const [logs, setLogs] = useState<TrainingLog[]>(() => loadOfficialLogs());
  const [drills, setDrills] = useState<Drill[]>(() => loadJson<Drill[]>(storageKeys.drills, defaultDrills));
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>(() =>
    loadOfficialCheckIns(),
  );
  const [screen, setScreen] = useState<Screen>("today");
  const [logDraftSession, setLogDraftSession] = useState<SessionPlan | undefined>();

  useEffect(() => saveJson(storageKeys.settings, settings), [settings]);
  useEffect(() => saveJson(storageKeys.plan, plan), [plan]);
  useEffect(() => saveJson(storageKeys.logs, logs), [logs]);
  useEffect(() => saveJson(storageKeys.drills, drills), [drills]);
  useEffect(() => saveJson(storageKeys.checkIns, checkIns), [checkIns]);

  const todaySession = useMemo(() => findSessionForToday(plan) ?? generateDefaultPlan(settings.startDate)[0], [
    plan,
    settings.startDate,
  ]);

  const handleLogSession = (session: SessionPlan) => {
    setLogDraftSession(session);
    setScreen("log");
  };

  const handleNav = (next: Screen) => {
    if (next === "log") setLogDraftSession(undefined);
    setScreen(next);
  };

  const saveLog = (log: TrainingLog) => {
    setLogs((current) => [log, ...current.filter((item) => item.id !== log.id)].filter((item) => item.date >= officialStartDate));
    setLogDraftSession(undefined);
  };

  const deleteLog = (id: string) => {
    if (!window.confirm("Delete this log?")) return;
    setLogs((current) => current.filter((log) => log.id !== id));
  };

  const resetPlan = () => {
    if (!window.confirm("Reset the full plan to the default 13-week schedule?")) return;
    setPlan(generateDefaultPlan(settings.startDate));
  };

  const resetApp = () => {
    if (!window.confirm("Reset all Summer Redline data on this device? This cannot be undone.")) return;
    const nextSettings = { startDate: defaultStartDate() };
    removeSummerRedlineData();
    setSettings(nextSettings);
    setPlan(generateDefaultPlan(nextSettings.startDate));
    setLogs([]);
    setDrills(defaultDrills);
    setCheckIns([]);
    setLogDraftSession(undefined);
    setScreen("today");
  };

  const exportJson = () => {
    exportBackupJson({
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      plan,
      logs,
      drills,
      checkIns,
    });
  };

  const importJson = (backup: AppBackup) => {
    if (!backup || !Array.isArray(backup.plan) || !Array.isArray(backup.logs)) {
      window.alert("That backup does not look like a Summer Redline export.");
      return;
    }
    if (!window.confirm("Import this backup and replace current local data?")) return;

    setSettings({ ...(backup.settings ?? { startDate: officialStartDate }), startDate: officialStartDate });
    setPlan(backup.plan[0]?.date === officialStartDate ? backup.plan : generateDefaultPlan(officialStartDate));
    setLogs(backup.logs.filter((log) => log.date >= officialStartDate));
    setDrills(Array.isArray(backup.drills) && backup.drills.length > 0 ? backup.drills : defaultDrills);
    setCheckIns(Array.isArray(backup.checkIns) ? backup.checkIns.filter((checkIn) => checkIn.date >= officialStartDate) : []);
    setScreen("today");
  };

  return (
    <div className="app-shell">
      <Header dateLabel={formatDisplayDate(todayIso(), { weekday: "long", year: "numeric" })} onOpenSettings={() => setScreen("reference")} />
      <main>
        {screen === "today" ? (
          <Today
            session={todaySession}
            drills={drills}
            logs={logs}
            onSaveLog={saveLog}
            onOpenPlan={() => setScreen("plan")}
            onSaveCheckIn={(record) => setCheckIns((current) => [record, ...current].filter((item) => item.date >= officialStartDate))}
          />
        ) : null}
        {screen === "plan" ? (
          <Plan
            settings={settings}
            plan={plan}
            drills={drills}
            onUpdateSettings={(next) => setSettings({ ...next, startDate: officialStartDate })}
            onUpdatePlan={setPlan}
            onLogSession={handleLogSession}
          />
        ) : null}
        {screen === "drills" ? <Drills drills={drills} /> : null}
        {screen === "log" ? (
          <Log logs={logs} drills={drills} draftSession={logDraftSession ?? todaySession} onSave={saveLog} onDelete={deleteLog} />
        ) : null}
        {screen === "progress" ? <Progress logs={logs} checkIns={checkIns} startDate={settings.startDate} /> : null}
        {screen === "reference" ? (
          <ReferenceSettings
            settings={settings}
            logCount={logs.length}
            checkInCount={checkIns.length}
            onUpdateSettings={(next) => setSettings({ ...next, startDate: officialStartDate })}
            onResetPlan={resetPlan}
            onResetApp={resetApp}
            onExportLogs={() => exportLogsCsv(logs, drills)}
            onExportJson={exportJson}
            onImportJson={importJson}
          />
        ) : null}
      </main>
      <BottomNav active={screen} onChange={handleNav} />
    </div>
  );
}
