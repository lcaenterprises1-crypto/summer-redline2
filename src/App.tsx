import { useEffect, useMemo, useState } from "react";
import type { CheckInRecord, Drill, Screen, SessionPlan, Settings, TrainingLog } from "./types";
import { defaultDrills } from "./data/drills";
import { exportBackupJson, exportLogsCsv } from "./logic/export";
import { defaultStartDate, findSessionForToday, formatDisplayDate, generateDefaultPlan, todayIso } from "./logic/schedule";
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
  return loadJson<Settings>(storageKeys.settings, { startDate: defaultStartDate() });
}

function loadInitialPlan(settings: Settings): SessionPlan[] {
  const plan = loadJson<SessionPlan[]>(storageKeys.plan, generateDefaultPlan(settings.startDate));
  return plan.length > 0 ? plan : generateDefaultPlan(settings.startDate);
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => loadInitialSettings());
  const [plan, setPlan] = useState<SessionPlan[]>(() => loadInitialPlan(loadInitialSettings()));
  const [logs, setLogs] = useState<TrainingLog[]>(() => loadJson<TrainingLog[]>(storageKeys.logs, []));
  const [drills, setDrills] = useState<Drill[]>(() => loadJson<Drill[]>(storageKeys.drills, defaultDrills));
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>(() =>
    loadJson<CheckInRecord[]>(storageKeys.checkIns, []),
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
    setLogs((current) => [log, ...current.filter((item) => item.id !== log.id)]);
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

    setSettings(backup.settings ?? { startDate: todayIso() });
    setPlan(backup.plan);
    setLogs(backup.logs);
    setDrills(Array.isArray(backup.drills) && backup.drills.length > 0 ? backup.drills : defaultDrills);
    setCheckIns(Array.isArray(backup.checkIns) ? backup.checkIns : []);
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
            onSaveLog={saveLog}
            onOpenPlan={() => setScreen("plan")}
            onSaveCheckIn={(record) => setCheckIns((current) => [record, ...current])}
          />
        ) : null}
        {screen === "plan" ? (
          <Plan
            settings={settings}
            plan={plan}
            drills={drills}
            onUpdateSettings={setSettings}
            onUpdatePlan={setPlan}
            onLogSession={handleLogSession}
          />
        ) : null}
        {screen === "drills" ? <Drills drills={drills} /> : null}
        {screen === "log" ? (
          <Log logs={logs} drills={drills} draftSession={logDraftSession ?? todaySession} onSave={saveLog} onDelete={deleteLog} />
        ) : null}
        {screen === "progress" ? <Progress logs={logs} startDate={settings.startDate} /> : null}
        {screen === "reference" ? (
          <ReferenceSettings
            settings={settings}
            logCount={logs.length}
            checkInCount={checkIns.length}
            onUpdateSettings={setSettings}
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
