import type { CheckInRecord, TrainingLog } from "../types";
import { formatDisplayDate, todayIso, weekFromDate } from "../logic/schedule";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";

interface ProgressProps {
  logs: TrainingLog[];
  checkIns?: CheckInRecord[];
  startDate: string;
}

type EarnedStatus = "Not enough data yet" | "Building base" | "On track" | "Earned soon" | "Earned" | "Hold" | "Back off";
type Tone = "neutral" | "good" | "watch" | "danger";
type TrendLabel = "Stable" | "Improving" | "Watch" | "Back off" | "Not enough data yet";

interface StatusCounts {
  green: number;
  yellow: number;
  red: number;
  notChecked: number;
}

interface WeeklyRecap {
  week: number;
  logs: TrainingLog[];
  totalSessions: number;
  throwingDays: number;
  recoveryDays: number;
  moundDays: number;
  green: number;
  yellow: number;
  red: number;
  unloggedDays: number | null;
  summary: string;
}

interface CleanStreak {
  current: number;
  longest: number;
  lastYellow?: string;
  lastRed?: string;
  progressText: string;
}

interface EarnedProgression {
  status: EarnedStatus;
  tone: Tone;
  detail: string;
}

interface SymptomSummary {
  label: string;
  avg: number | null;
  high: number | null;
  direction: "clean" | "mild" | "rising" | "warning" | "not enough data yet";
  text: string;
}

interface WorkloadSummary {
  hasData: boolean;
  throwingSessions: number;
  estimatedThrows: number;
  highestThrowCount: number;
  longestDistance: number;
  highestIntent: string;
  moundSessions: number;
  plyoDays: number;
  recoveryDays: number;
}

interface WarningPattern {
  text: string;
  tone: Tone;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function Progress({ logs, checkIns = [], startDate }: ProgressProps) {
  const sortedLogs = sortLogsNewestFirst(logs);
  const sortedCheckIns = sortCheckInsNewestFirst(checkIns);
  const latestStatus = sortedLogs[0]?.armStatus ?? sortedCheckIns[0]?.status ?? "not checked";
  const weeklyRecap = buildWeeklyRecap(logs, startDate);
  const cleanStreak = buildCleanStreak(logs);
  const statusTrend = buildStatusTrend(logs);
  const symptomTrend = buildSymptomTrend(logs, checkIns);
  const workload = buildWorkloadSummary(weeklyRecap.logs);
  const warningPatterns = buildWarningPatterns(logs, checkIns, symptomTrend);
  const earnedProgression = buildEarnedProgression(logs, weeklyRecap, cleanStreak, symptomTrend, warningPatterns);
  const recommendation = buildRecommendation(earnedProgression, warningPatterns, logs.length);

  return (
    <div className="screen stack progress-screen">
      <Card accent className="progress-hero">
        <span className="eyebrow">Progress Intelligence</span>
        <h2>Are you earning the right to progress?</h2>
        <p>Earn it. Contain it. Log it. Recover from it.</p>
      </Card>

      <ReadinessSnapshot logs={sortedLogs} checkIns={sortedCheckIns} latestStatus={latestStatus} />
      <WeeklyRecapCard recap={weeklyRecap} />
      <CleanStreakCard streak={cleanStreak} />
      <EarnedProgressionCard earned={earnedProgression} />
      <StatusTrendCard trend={statusTrend} />
      <SymptomTrendCard symptoms={symptomTrend} />
      <WorkloadCard workload={workload} />
      <WarningPatternsCard patterns={warningPatterns} />
      <RecommendationCard recommendation={recommendation} earned={earnedProgression} />
    </div>
  );
}

function ReadinessSnapshot({
  logs,
  checkIns,
  latestStatus,
}: {
  logs: TrainingLog[];
  checkIns: CheckInRecord[];
  latestStatus: TrainingLog["armStatus"];
}) {
  const latestLog = logs[0];
  const latestCheckIn = checkIns[0];
  const latestDate = latestLog?.date ?? latestCheckIn?.date;
  const symptomScore = latestLog
    ? maxLogSymptom(latestLog)
    : latestCheckIn
      ? Math.max(
          safeNumber(latestCheckIn.input?.forearmTightness),
          safeNumber(latestCheckIn.input?.bicepsTightness),
          safeNumber(latestCheckIn.input?.elbowPain),
          safeNumber(latestCheckIn.input?.shoulderPain),
        )
      : null;

  return (
    <Card className="progress-card">
      <div className="progress-card-header">
        <div>
          <span className="eyebrow">Today&apos;s Readiness Snapshot</span>
          <h3>{latestDate ? formatDisplayDate(latestDate) : "Not enough logged data yet"}</h3>
        </div>
        <StatusBadge status={latestStatus} />
      </div>
      <p className="progress-copy">
        {latestDate
          ? snapshotText(latestStatus, symptomScore, latestLog?.nextMorningSymptoms ?? latestCheckIn?.input?.nextMorningSymptoms)
          : "Log a few sessions to unlock readiness trends, clean streaks, workload recaps, and earned progression status."}
      </p>
    </Card>
  );
}

function WeeklyRecapCard({ recap }: { recap: WeeklyRecap }) {
  return (
    <Card className="progress-card">
      <div className="progress-card-header">
        <div>
          <span className="eyebrow">Weekly Recap</span>
          <h3>Week {recap.week}</h3>
        </div>
      </div>
      <div className="progress-mini-grid">
        <MiniMetric label="Sessions" value={recap.totalSessions} />
        <MiniMetric label="Throwing" value={recap.throwingDays} />
        <MiniMetric label="Recovery" value={recap.recoveryDays} />
        <MiniMetric label="Mound" value={recap.moundDays} />
        <MiniMetric label="Green" value={recap.green} tone="good" />
        <MiniMetric label="Yellow" value={recap.yellow} tone="watch" />
        <MiniMetric label="Red" value={recap.red} tone="danger" />
        <MiniMetric label="Unlogged" value={recap.unloggedDays ?? "-"} />
      </div>
      <p className="progress-copy">{recap.summary}</p>
    </Card>
  );
}

function CleanStreakCard({ streak }: { streak: CleanStreak }) {
  return (
    <Card className="progress-card">
      <div className="progress-card-header">
        <div>
          <span className="eyebrow">Clean Session Streak</span>
          <h3>{streak.current} current clean sessions</h3>
        </div>
      </div>
      <div className="progress-mini-grid two-up">
        <MiniMetric label="Longest" value={streak.longest} />
        <MiniMetric label="Last yellow" value={streak.lastYellow ? formatDisplayDate(streak.lastYellow) : "None"} />
        <MiniMetric label="Last red" value={streak.lastRed ? formatDisplayDate(streak.lastRed) : "None"} />
      </div>
      <p className="progress-copy">{streak.progressText}</p>
    </Card>
  );
}

function EarnedProgressionCard({ earned }: { earned: EarnedProgression }) {
  return (
    <Card accent className="progress-card">
      <div className="progress-card-header">
        <div>
          <span className="eyebrow">Earned Progression Status</span>
          <h3>{earned.status}</h3>
        </div>
        <StatusPill tone={earned.tone}>{earned.status}</StatusPill>
      </div>
      <p className="progress-copy">{earned.detail}</p>
    </Card>
  );
}

function StatusTrendCard({ trend }: { trend: ReturnType<typeof buildStatusTrend> }) {
  return (
    <Card className="progress-card">
      <div className="progress-card-header">
        <div>
          <span className="eyebrow">Green / Yellow / Red Trend</span>
          <h3>{trend.label}</h3>
        </div>
        <StatusPill tone={trendTone(trend.label)}>{trend.label}</StatusPill>
      </div>
      <div className="trend-groups">
        <StatusBreakdown label="Last 7 days" counts={trend.last7} total={trend.last7Total} />
        <StatusBreakdown label="Last 14 days" counts={trend.last14} total={trend.last14Total} />
      </div>
      <p className="progress-copy">{trend.detail}</p>
    </Card>
  );
}

function SymptomTrendCard({ symptoms }: { symptoms: SymptomSummary[] }) {
  return (
    <Card className="progress-card">
      <div className="progress-card-header">
        <div>
          <span className="eyebrow">Arm Symptom Trend</span>
          <h3>Tightness matters</h3>
        </div>
      </div>
      <div className="symptom-list">
        {symptoms.map((symptom) => (
          <div key={symptom.label} className={`symptom-row symptom-${symptom.direction.replace(/\s+/g, "-")}`}>
            <strong>{symptom.label}</strong>
            <span>{symptom.text}</span>
            <small>
              {symptom.avg === null ? "No data yet" : `Avg ${symptom.avg.toFixed(1)} / high ${symptom.high?.toFixed(0)}`}
            </small>
          </div>
        ))}
      </div>
    </Card>
  );
}

function WorkloadCard({ workload }: { workload: WorkloadSummary }) {
  return (
    <Card className="progress-card">
      <div className="progress-card-header">
        <div>
          <span className="eyebrow">Workload Summary</span>
          <h3>This week</h3>
        </div>
      </div>
      {workload.hasData ? (
        <div className="progress-mini-grid">
          <MiniMetric label="Throwing sessions" value={workload.throwingSessions} />
          <MiniMetric label="Estimated throws" value={workload.estimatedThrows} />
          <MiniMetric label="Highest throws" value={workload.highestThrowCount} />
          <MiniMetric label="Longest distance" value={`${workload.longestDistance} ft`} />
          <MiniMetric label="Highest intent" value={workload.highestIntent} />
          <MiniMetric label="Mound sessions" value={workload.moundSessions} />
          <MiniMetric label="Plyo days" value={workload.plyoDays} />
          <MiniMetric label="Recovery days" value={workload.recoveryDays} />
        </div>
      ) : (
        <p className="progress-copy">Not enough logged data yet. Save a few sessions to see workload, mound exposure, distance, and intent recaps.</p>
      )}
    </Card>
  );
}

function WarningPatternsCard({ patterns }: { patterns: WarningPattern[] }) {
  return (
    <Card className="progress-card">
      <div className="progress-card-header">
        <div>
          <span className="eyebrow">Recent Warning Patterns</span>
          <h3>{patterns.length ? "Pattern check" : "No major pattern detected"}</h3>
        </div>
      </div>
      {patterns.length ? (
        <div className="warning-list">
          {patterns.map((pattern) => (
            <p key={pattern.text} className={`warning-item tone-${pattern.tone}`}>
              {pattern.text}
            </p>
          ))}
        </div>
      ) : (
        <p className="progress-copy">No major warning pattern detected yet. Keep logging status, symptoms, workload, and next-morning response.</p>
      )}
    </Card>
  );
}

function RecommendationCard({
  recommendation,
  earned,
}: {
  recommendation: string;
  earned: EarnedProgression;
}) {
  return (
    <Card accent className="progress-card recommendation-card">
      <div className="progress-card-header">
        <div>
          <span className="eyebrow">Recommendation</span>
          <h3>{recommendationTitle(earned.status)}</h3>
        </div>
      </div>
      <p className="progress-copy">{recommendation}</p>
    </Card>
  );
}

function MiniMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: Tone;
}) {
  return (
    <div className={`progress-mini metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusPill({ children, tone }: { children: string; tone: Tone }) {
  return <span className={`progress-pill tone-${tone}`}>{children}</span>;
}

function StatusBreakdown({ label, counts, total }: { label: string; counts: StatusCounts; total: number }) {
  return (
    <div className="trend-card">
      <div className="card-topline">
        <span>{label}</span>
        <span>{total} logs</span>
      </div>
      <div className="trend-bars" aria-label={`${label} status trend`}>
        <TrendBar label="Green" value={counts.green} total={total} tone="good" />
        <TrendBar label="Yellow" value={counts.yellow} total={total} tone="watch" />
        <TrendBar label="Red" value={counts.red} total={total} tone="danger" />
      </div>
    </div>
  );
}

function TrendBar({ label, value, total, tone }: { label: string; value: number; total: number; tone: Tone }) {
  const width = total ? Math.max(7, (value / total) * 100) : 0;
  return (
    <div className="trend-bar">
      <span>{label}</span>
      <div>
        <i className={`tone-${tone}`} style={{ width: `${width}%` }} />
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function buildWeeklyRecap(logs: TrainingLog[], startDate: string): WeeklyRecap {
  const week = Math.max(1, weekFromDate(todayIso(), startDate));
  const weekLogs = logs.filter((log) => Math.max(1, weekFromDate(log.date, startDate)) === week);
  const statusCounts = countStatuses(weekLogs);
  const throwingDays = weekLogs.filter(isThrowingLog).length;
  const recoveryDays = weekLogs.filter(isRecoveryLog).length;
  const moundDays = weekLogs.filter((log) => safeNumber(log.moundPitches) > 0 || textIncludes(log.actualDayType, "mound")).length;
  const unloggedDays = weekLogs.length ? estimateUnloggedDays(weekLogs, startDate, week) : null;

  return {
    week,
    logs: weekLogs,
    totalSessions: weekLogs.length,
    throwingDays,
    recoveryDays,
    moundDays,
    green: statusCounts.green,
    yellow: statusCounts.yellow,
    red: statusCounts.red,
    unloggedDays,
    summary: weeklySummaryText(weekLogs.length, statusCounts),
  };
}

function buildCleanStreak(logs: TrainingLog[]): CleanStreak {
  const newest = sortLogsNewestFirst(logs);
  const oldest = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  let current = 0;
  let longest = 0;
  let running = 0;

  for (const log of newest) {
    if (!isCleanLog(log)) break;
    current += 1;
  }

  for (const log of oldest) {
    if (isCleanLog(log)) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }

  const lastYellow = newest.find((log) => log.armStatus === "yellow")?.date;
  const lastRed = newest.find((log) => log.armStatus === "red")?.date;
  const need = Math.max(0, 7 - current);
  const progressText =
    logs.length === 0
      ? "Log a few sessions to start tracking clean streaks and earned exposure."
      : need > 0
        ? `Need ${need} more clean ${need === 1 ? "session" : "sessions"} before considering an earned extension day.`
        : "Clean streak is strong. Any added exposure should still be planned, contained, and logged.";

  return { current, longest, lastYellow, lastRed, progressText };
}

function buildStatusTrend(logs: TrainingLog[]) {
  const last7Logs = logsInLastDays(logs, 7);
  const last14Logs = logsInLastDays(logs, 14);
  const prior7Logs = logs.filter((log) => {
    const age = daysAgo(log.date);
    return age >= 7 && age < 14;
  });
  const last7 = countStatuses(last7Logs);
  const last14 = countStatuses(last14Logs);
  const prior7 = countStatuses(prior7Logs);
  const last7Total = statusTotal(last7);
  const last14Total = statusTotal(last14);
  const label = trendLabel(last7, prior7, last7Total);

  return {
    label,
    last7,
    last14,
    last7Total,
    last14Total,
    detail: trendDetail(label, last7Total),
  };
}

function buildSymptomTrend(logs: TrainingLog[], checkIns: CheckInRecord[]): SymptomSummary[] {
  const recentLogs = logsInLastDays(logs, 14);
  const recentCheckIns = checkIns.filter((checkIn) => daysAgo(checkIn.date) < 14);

  return [
    summarizeSymptom("Forearm", [
      ...recentLogs.map((log) => point(log.date, safeNumber(log.forearmTightnessAfter))),
      ...recentCheckIns.map((checkIn) => point(checkIn.date, safeNumber(checkIn.input?.forearmTightness))),
    ]),
    summarizeSymptom("Biceps / anterior elbow", [
      ...recentLogs.map((log) => point(log.date, safeNumber(log.bicepsTightnessAfter))),
      ...recentCheckIns.map((checkIn) => point(checkIn.date, safeNumber(checkIn.input?.bicepsTightness))),
    ]),
    summarizeSymptom("Elbow / throwing pain", [
      ...recentLogs.map((log) => point(log.date, Math.max(safeNumber(log.painDuring), safeNumber(log.painOneHourAfter)))),
      ...recentCheckIns.map((checkIn) => point(checkIn.date, safeNumber(checkIn.input?.elbowPain))),
    ]),
    summarizeSymptom("Shoulder", recentCheckIns.map((checkIn) => point(checkIn.date, safeNumber(checkIn.input?.shoulderPain)))),
    summarizeNextMorning(recentLogs, recentCheckIns),
  ];
}

function buildWorkloadSummary(logs: TrainingLog[]): WorkloadSummary {
  if (logs.length === 0) {
    return {
      hasData: false,
      throwingSessions: 0,
      estimatedThrows: 0,
      highestThrowCount: 0,
      longestDistance: 0,
      highestIntent: "Not logged",
      moundSessions: 0,
      plyoDays: 0,
      recoveryDays: 0,
    };
  }

  const maxIntent = Math.max(...logs.map((log) => maxNumberFromText(log.intentRange)), 0);

  return {
    hasData: true,
    throwingSessions: logs.filter(isThrowingLog).length,
    estimatedThrows: logs.reduce((sum, log) => sum + safeNumber(log.totalThrows), 0),
    highestThrowCount: Math.max(...logs.map((log) => safeNumber(log.totalThrows)), 0),
    longestDistance: Math.max(...logs.map((log) => safeNumber(log.maxDistanceFt)), 0),
    highestIntent: maxIntent ? `${maxIntent}%` : logs.some((log) => safeNumber(log.highIntentThrows) > 0) ? "High intent logged" : "Not logged",
    moundSessions: logs.filter((log) => safeNumber(log.moundPitches) > 0 || textIncludes(log.actualDayType, "mound")).length,
    plyoDays: logs.filter((log) => Array.isArray(log.drillIds) && log.drillIds.some(isPlyoDrillId)).length,
    recoveryDays: logs.filter(isRecoveryLog).length,
  };
}

function buildWarningPatterns(logs: TrainingLog[], checkIns: CheckInRecord[], symptoms: SymptomSummary[]): WarningPattern[] {
  const recent = logsInLastDays(logs, 14);
  const recentCheckIns = checkIns.filter((checkIn) => daysAgo(checkIn.date) < 14);
  const patterns: WarningPattern[] = [];

  if (recent.some((log) => log.armStatus === "red")) {
    patterns.push({ tone: "danger", text: "Red status showed up recently. Back off until response is clean again." });
  }

  if (recent.some((log) => highIntentSignal(log) && (log.armStatus === "yellow" || log.armStatus === "red"))) {
    patterns.push({ tone: "watch", text: "Yellow/red signs showed up after higher intent. Keep the next session controlled." });
  }

  if (recent.some((log) => isThrowingLog(log) && (safeNumber(log.forearmTightnessAfter) >= 2 || safeNumber(log.bicepsTightnessAfter) >= 2))) {
    patterns.push({ tone: "watch", text: "Forearm/biceps symptoms appeared after throwing days. Do not ignore tightness just because pain is low." });
  }

  if (symptoms.some((symptom) => symptom.direction === "rising" || symptom.direction === "warning")) {
    patterns.push({ tone: "watch", text: "Symptoms are trending up. Hold the current level until the response settles." });
  }

  if (recentCheckIns.some((checkIn) => safeNumber(checkIn.input?.sleepHours, 8) < 6.5 && (checkIn.status === "yellow" || checkIn.status === "red"))) {
    patterns.push({ tone: "watch", text: "Poor sleep lined up with yellow/red readiness. Keep the next session conservative." });
  }

  if (recentCheckIns.some((checkIn) => safeNumber(checkIn.input?.bodyFatigue) >= 4 && (checkIn.status === "yellow" || checkIn.status === "red"))) {
    patterns.push({ tone: "watch", text: "High fatigue showed up with a downgraded status. Recovery emphasis is winning today." });
  }

  if (backToBackThrowingWarning(recent)) {
    patterns.push({ tone: "watch", text: "Back-to-back throwing was followed by warning symptoms. Be careful stacking stress." });
  }

  return patterns.slice(0, 4);
}

function buildEarnedProgression(
  logs: TrainingLog[],
  recap: WeeklyRecap,
  streak: CleanStreak,
  symptoms: SymptomSummary[],
  patterns: WarningPattern[],
): EarnedProgression {
  const recent = logsInLastDays(logs, 14);
  const recent7 = logsInLastDays(logs, 7);
  const cleanThrowing = recent.filter((log) => isCleanLog(log) && isThrowingLog(log)).length;
  const symptomWarning = symptoms.some((symptom) => symptom.direction === "rising" || symptom.direction === "warning");
  const redRecent = recent.some((log) => log.armStatus === "red");
  const yellowRecent = recent7.filter((log) => log.armStatus === "yellow").length;
  const nextMorning = recent.some((log) => Boolean(log.nextMorningSymptoms));

  if (logs.length < 3) {
    return {
      status: "Not enough data yet",
      tone: "neutral",
      detail: "Log at least three sessions before judging progression. The first goal is honest data, not more exposure.",
    };
  }

  if (redRecent || patterns.some((pattern) => pattern.tone === "danger")) {
    return {
      status: "Back off",
      tone: "danger",
      detail: "A red flag appeared recently. No long toss, radar, or higher-intent add-ons until the response is clean again.",
    };
  }

  if (yellowRecent >= 2 || nextMorning || symptomWarning) {
    return {
      status: "Hold",
      tone: "watch",
      detail: "Yellow signs or symptom trends are present. Keep the next session conservative and protect the next-morning response.",
    };
  }

  if (streak.current >= 10 && cleanThrowing >= 4 && recap.throwingDays >= 3) {
    return {
      status: "Earned",
      tone: "good",
      detail: "You have stacked clean sessions. A small planned exposure can be considered, but keep it contained and log the response.",
    };
  }

  if (streak.current >= 7 && cleanThrowing >= 3) {
    return {
      status: "Earned soon",
      tone: "good",
      detail: "You are close. Keep stacking clean throwing sessions before adding long toss, radar, or higher-intent work.",
    };
  }

  if (streak.current >= 4 && recap.green >= recap.yellow + recap.red) {
    return {
      status: "On track",
      tone: "good",
      detail: `${streak.current} clean sessions logged. Keep stacking. Do not add long toss or radar yet.`,
    };
  }

  return {
    status: "Building base",
    tone: "neutral",
    detail: "The base is still being built. Stay conservative, keep logging, and let clean next-morning responses pile up.",
  };
}

function buildRecommendation(earned: EarnedProgression, warnings: WarningPattern[], logCount: number): string {
  if (logCount < 3) return "Recommendation: Need more logs before judging. Log the next few sessions honestly and keep the plan conservative.";
  if (earned.status === "Back off") return "Recommendation: Recovery emphasis. No throwing add-ons until red flags and next-morning response are clean.";
  if (earned.status === "Hold") return "Recommendation: Hold current level. You are close to earning more, but the next session should stay controlled.";
  if (earned.status === "Earned") return "Recommendation: Progress normally only if the next session is planned, contained, logged, and followed by a clean morning.";
  if (earned.status === "Earned soon") return "Recommendation: Keep current level for a few more clean sessions. Earned exposure is close, not automatic.";
  if (warnings.length) return "Recommendation: Keep next session conservative and watch the pattern before adding stress.";
  return "Recommendation: Progress normally within the plan. No random aggression. Earn it, contain it, log it, recover from it.";
}

function weeklySummaryText(total: number, counts: StatusCounts): string {
  if (total === 0) return "Not enough logged data yet. Log a few sessions to unlock weekly trends.";
  if (counts.red > 0) return `This week: ${total} sessions logged. ${counts.green} green, ${counts.yellow} yellow, ${counts.red} red. Back off and protect recovery.`;
  if (counts.yellow > 0) return `This week: ${total} sessions logged. ${counts.green} green, ${counts.yellow} yellow, 0 red. Arm response is mostly clean, but keep the next session controlled.`;
  return `This week: ${total} sessions logged. ${counts.green} green, 0 yellow, 0 red. Arm response is clean. Keep stacking.`;
}

function snapshotText(status: TrainingLog["armStatus"], symptomScore: number | null, nextMorning?: boolean): string {
  if (status === "red") return "Latest response is red. Recovery comes first. No extra exposure is earned today.";
  if (status === "yellow") return "Latest response is yellow. Keep the next session conservative and watch tightness.";
  if (nextMorning) return "Next-morning symptoms were logged. Treat that as a warning even if the session felt fine.";
  if (symptomScore !== null && symptomScore <= 1 && status === "green") return "Latest response is clean. Keep earning it one session at a time.";
  if (symptomScore !== null && symptomScore >= 3) return "Symptoms were elevated. Hold the line before adding workload.";
  return "Latest data is usable, but keep logging to sharpen the read.";
}

function recommendationTitle(status: EarnedStatus): string {
  if (status === "Back off") return "Recovery emphasis";
  if (status === "Hold") return "Hold current level";
  if (status === "Not enough data yet") return "Need more logs";
  if (status === "Earned" || status === "Earned soon") return "Earned exposure is close";
  return "Progress within the plan";
}

function summarizeSymptom(label: string, input: { date: string; value: number }[]): SymptomSummary {
  const points = input
    .filter((item) => Number.isFinite(item.value))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (points.length === 0) {
    return { label, avg: null, high: null, direction: "not enough data yet", text: `${label}: no logged data yet` };
  }

  const values = points.map((item) => item.value);
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  const high = Math.max(...values);
  const recent = average(values.slice(-3));
  const prior = average(values.slice(-6, -3));
  const rising = values.length >= 5 && recent >= prior + 1;
  const direction =
    high >= 4 || avg >= 3 ? "warning" : rising ? "rising" : high <= 1 && avg <= 0.7 ? "clean" : "mild";

  return {
    label,
    avg,
    high,
    direction,
    text: `${label}: ${symptomWords(direction)}`,
  };
}

function summarizeNextMorning(logs: TrainingLog[], checkIns: CheckInRecord[]): SymptomSummary {
  const count =
    logs.filter((log) => Boolean(log.nextMorningSymptoms)).length +
    checkIns.filter((checkIn) => Boolean(checkIn.input?.nextMorningSymptoms)).length;
  const total = logs.length + checkIns.length;
  if (total === 0) {
    return { label: "Next morning", avg: null, high: null, direction: "not enough data yet", text: "Next morning: no logged data yet" };
  }
  return {
    label: "Next morning",
    avg: count / total,
    high: count > 0 ? 1 : 0,
    direction: count > 0 ? "warning" : "clean",
    text: count > 0 ? `${count} next-morning warning ${count === 1 ? "entry" : "entries"}` : "Next morning: clean in recent logs",
  };
}

function symptomWords(direction: SymptomSummary["direction"]): string {
  if (direction === "clean") return "clean";
  if (direction === "mild") return "mild but stable";
  if (direction === "rising") return "rising";
  if (direction === "warning") return "warning";
  return "not enough data yet";
}

function trendLabel(last7: StatusCounts, prior7: StatusCounts, last7Total: number): TrendLabel {
  if (last7Total === 0) return "Not enough data yet";
  if (last7.red > 0) return "Back off";
  if (last7.yellow >= 2) return "Watch";
  if (last7.green > prior7.green && last7.yellow + last7.red <= prior7.yellow + prior7.red) return "Improving";
  return "Stable";
}

function trendDetail(label: TrendLabel, total: number): string {
  if (total === 0) return "Log a few sessions to unlock status trend reads.";
  if (label === "Back off") return "A red day appeared recently. Do not add stress.";
  if (label === "Watch") return "Multiple yellow signs are showing. Keep the next session controlled.";
  if (label === "Improving") return "The recent window is trending cleaner. Keep stacking without rushing.";
  return "Recent status is stable. Stay inside the plan and keep logging.";
}

function trendTone(label: TrendLabel): Tone {
  if (label === "Back off") return "danger";
  if (label === "Watch") return "watch";
  if (label === "Improving" || label === "Stable") return "good";
  return "neutral";
}

function countStatuses(logs: TrainingLog[]): StatusCounts {
  return logs.reduce(
    (counts, log) => {
      if (log.armStatus === "green") counts.green += 1;
      else if (log.armStatus === "yellow") counts.yellow += 1;
      else if (log.armStatus === "red") counts.red += 1;
      else counts.notChecked += 1;
      return counts;
    },
    { green: 0, yellow: 0, red: 0, notChecked: 0 },
  );
}

function statusTotal(counts: StatusCounts): number {
  return counts.green + counts.yellow + counts.red + counts.notChecked;
}

function estimateUnloggedDays(logs: TrainingLog[], startDate: string, week: number): number | null {
  const start = parseIsoDate(startDate);
  const today = parseIsoDate(todayIso());
  if (Number.isNaN(start.getTime()) || Number.isNaN(today.getTime())) return null;
  const weekStart = new Date(start);
  weekStart.setDate(start.getDate() + (week - 1) * 7);
  const daysElapsed = Math.max(0, Math.min(7, Math.floor((today.getTime() - weekStart.getTime()) / MS_PER_DAY) + 1));
  const uniqueLoggedDays = new Set(logs.map((log) => log.date)).size;
  return Math.max(0, daysElapsed - uniqueLoggedDays);
}

function isCleanLog(log: TrainingLog): boolean {
  return (
    log.armStatus === "green" &&
    safeNumber(log.forearmTightnessAfter) <= 1 &&
    safeNumber(log.bicepsTightnessAfter) <= 1 &&
    safeNumber(log.painDuring) === 0 &&
    safeNumber(log.painOneHourAfter) === 0 &&
    !log.hotRedHandForearm &&
    !log.nextMorningSymptoms &&
    log.decision !== "regress"
  );
}

function isThrowingLog(log: TrainingLog): boolean {
  return safeNumber(log.totalThrows) > 0 || textIncludes(log.actualDayType, "catch") || textIncludes(log.actualDayType, "mound") || textIncludes(log.actualDayType, "build") || textIncludes(log.actualDayType, "velo");
}

function isRecoveryLog(log: TrainingLog): boolean {
  return safeNumber(log.totalThrows) === 0 || textIncludes(log.actualDayType, "recovery") || textIncludes(log.actualDayType, "arm-care") || textIncludes(log.actualDayType, "off");
}

function highIntentSignal(log: TrainingLog): boolean {
  return safeNumber(log.highIntentThrows) > 0 || maxNumberFromText(log.intentRange) >= 75 || textIncludes(log.actualDayType, "high-intent") || textIncludes(log.actualDayType, "velo");
}

function backToBackThrowingWarning(logs: TrainingLog[]): boolean {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    const consecutive = Math.abs(daysBetween(previous.date, current.date)) <= 1;
    const warning =
      current.armStatus === "yellow" ||
      current.armStatus === "red" ||
      safeNumber(current.forearmTightnessAfter) >= 2 ||
      safeNumber(current.bicepsTightnessAfter) >= 2 ||
      Boolean(current.nextMorningSymptoms);
    if (consecutive && isThrowingLog(previous) && isThrowingLog(current) && warning) return true;
  }
  return false;
}

function maxLogSymptom(log: TrainingLog): number {
  return Math.max(
    safeNumber(log.forearmTightnessAfter),
    safeNumber(log.bicepsTightnessAfter),
    safeNumber(log.painDuring),
    safeNumber(log.painOneHourAfter),
  );
}

function isPlyoDrillId(id: string): boolean {
  return id.includes("plyo") || ["reverse-throws", "pivot-picks", "plyo-roll-ins", "plyo-walking-windups"].includes(id);
}

function logsInLastDays(logs: TrainingLog[], days: number): TrainingLog[] {
  return logs.filter((log) => daysAgo(log.date) < days);
}

function daysAgo(date: string): number {
  return daysBetween(date, todayIso());
}

function daysBetween(start: string, end: string): number {
  const first = parseIsoDate(start);
  const second = parseIsoDate(end);
  if (Number.isNaN(first.getTime()) || Number.isNaN(second.getTime())) return 999;
  return Math.floor((second.getTime() - first.getTime()) / MS_PER_DAY);
}

function parseIsoDate(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

function sortLogsNewestFirst(logs: TrainingLog[]): TrainingLog[] {
  return [...logs].sort((a, b) => b.date.localeCompare(a.date));
}

function sortCheckInsNewestFirst(checkIns: CheckInRecord[]): CheckInRecord[] {
  return [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
}

function point(date: string, value: number) {
  return { date, value };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxNumberFromText(text?: string): number {
  const numbers = text?.match(/\d+/g)?.map(Number) ?? [];
  return numbers.length ? Math.max(...numbers) : 0;
}

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function textIncludes(value: unknown, search: string): boolean {
  return typeof value === "string" && value.toLowerCase().includes(search);
}
