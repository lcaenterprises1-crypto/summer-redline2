import type { CheckInRecord, TrainingLog } from "../types";
import {
  classifyLog,
  isHighIntentHittingExposure,
  isHittingTrainingLog,
  isPhysicalTrainingLog,
  isRecoveryTrainingLog,
  isThrowingTrainingLog,
  laneText,
} from "../logic/logClassification";
import { formatDisplayDate, todayIso, weekFromDate } from "../logic/schedule";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";

interface ProgressProps {
  logs: TrainingLog[];
  checkIns?: CheckInRecord[];
  startDate: string;
}

type EarnedStatus = "Not Enough Throwing Data" | "Hold" | "Build" | "Green-Light" | "Back off";
type Tone = "neutral" | "good" | "watch" | "danger";
type TrendLabel = "Stable" | "Improving" | "Watch" | "Back off" | "Not enough data yet";
type EarnedEvidence = "not-enough-throwing" | "past-warning" | "current-warning" | "controlled-build" | "clean-build" | "green-light";

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
  hittingDays: number;
  physicalDays: number;
  recoveryDays: number;
  unknownDays: number;
  moundDays: number;
  green: number;
  yellow: number;
  red: number;
  notChecked: number;
  unloggedDays: number | null;
  summary: string;
}

interface CleanStreak {
  overallCurrent: number;
  overallLongest: number;
  throwingCurrent: number;
  throwingLongest: number;
  lastYellow?: string;
  lastRed?: string;
  progressText: string;
}

interface EarnedProgression {
  status: EarnedStatus;
  tone: Tone;
  detail: string;
  evidence: EarnedEvidence;
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

interface HittingSummary {
  hasData: boolean;
  touches: number;
  highIntentExposures: number;
  contactQualityDays: number;
  recoveryFeelDays: number;
  gameTransferBlocks: number;
  batSpeedDays: number;
  evDamageDays: number;
  microdoseDays: number;
  gamePrepDays: number;
  minimumDays: number;
  volumeTrend: string;
  feltTrend: string;
  forearmTrend: string;
  trunkTrend: string;
  maxEv: number | null;
  top5Ev: number | null;
  balls95: number;
  rolloverTrend: string;
  sessionBreakdown: string;
}

interface PhysicalSummary {
  hasData: boolean;
  sessions: number;
  full: number;
  short: number;
  minimum: number;
  recovery: number;
  skipModified: number;
  mainStrength: number;
  upperTrunk: number;
  speedPower: number;
  recoveryTissue: number;
  kneeCapacity: number;
  armCare: number;
  mobility: number;
  averageRpe: number | null;
  kneeTrend: string;
  armTrend: string;
  energyTrend: string;
  sorenessTrend: string;
  painTrend: string;
}

interface RecoverySummary {
  hasData: boolean;
  sessions: number;
  armCare: number;
  kneeCapacity: number;
  mobility: number;
  better: number;
  same: number;
  worse: number;
  notes: number;
}

interface SystemTrends {
  arm: string;
  knee: string;
  energy: string;
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
  const hittingSummary = buildHittingSummary(logs, startDate);
  const physicalSummary = buildPhysicalSummary(logs, startDate);
  const recoverySummary = buildRecoverySummary(logs, startDate);
  const systemTrends = buildSystemTrends(logs, checkIns);
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

      <WeeklyRecapCard recap={weeklyRecap} />
      <WorkloadCard workload={workload} />
      <HittingSummaryCard summary={hittingSummary} />
      <PhysicalSummaryCard summary={physicalSummary} />
      <RecoverySummaryCard summary={recoverySummary} />
      <SystemTrendsCard trends={systemTrends} />
      <CleanStreakCard streak={cleanStreak} />
      <EarnedProgressionCard earned={earnedProgression} />
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
          <span className="eyebrow">Overall Weekly Recap</span>
          <h3>This Week</h3>
        </div>
      </div>
      <div className="progress-mini-grid">
        <MiniMetric label="Total Sessions" value={recap.totalSessions} />
        <MiniMetric label="Throwing" value={recap.throwingDays} />
        <MiniMetric label="Hitting" value={recap.hittingDays} />
        <MiniMetric label="Physical" value={recap.physicalDays} />
        <MiniMetric label="Recovery" value={recap.recoveryDays} />
        <MiniMetric label="Green" value={recap.green} tone="good" />
        <MiniMetric label="Yellow" value={recap.yellow} tone="watch" />
        <MiniMetric label="Red" value={recap.red} tone="danger" />
        <MiniMetric label="Not checked" value={recap.notChecked + recap.unknownDays} />
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
          <h3>Overall + throwing-specific</h3>
        </div>
      </div>
      <div className="progress-mini-grid two-up">
        <MiniMetric label="Overall clean" value={streak.overallCurrent} />
        <MiniMetric label="Overall longest" value={streak.overallLongest} />
        <MiniMetric label="Throwing clean" value={streak.throwingCurrent} />
        <MiniMetric label="Throwing longest" value={streak.throwingLongest} />
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
          <span className="eyebrow">Throwing Workload</span>
          <h3>{workload.hasData ? "This week" : "No throwing logs this week"}</h3>
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
        <p className="progress-copy">Throwing progression needs throwing-specific data. Clean hitting and physical logs support readiness, but do not replace throwing response.</p>
      )}
    </Card>
  );
}

function HittingSummaryCard({ summary }: { summary: HittingSummary }) {
  return (
    <Card className="progress-card">
      <div className="progress-card-header">
        <div>
          <span className="eyebrow">Hitting Summary</span>
          <h3>This week</h3>
        </div>
      </div>
      {summary.hasData ? (
        <>
          <div className="progress-mini-grid">
            <MiniMetric label="Swing touches" value={summary.touches} />
            <MiniMetric label="High intent" value={summary.highIntentExposures} tone={summary.highIntentExposures > 1 ? "watch" : "neutral"} />
            <MiniMetric label="Contact Quality" value={summary.contactQualityDays} />
            <MiniMetric label="Recovery / Feel" value={summary.recoveryFeelDays} />
            <MiniMetric label="Game Transfer" value={summary.gameTransferBlocks} />
            <MiniMetric label="Bat Speed" value={summary.batSpeedDays} />
            <MiniMetric label="EV / Damage" value={summary.evDamageDays} />
            <MiniMetric label="Microdose" value={summary.microdoseDays} />
            <MiniMetric label="Game Prep" value={summary.gamePrepDays} />
            <MiniMetric label="Minimum" value={summary.minimumDays} />
            <MiniMetric label="Volume" value={summary.volumeTrend} />
            <MiniMetric label="Felt trend" value={summary.feltTrend} />
            <MiniMetric label="Forearm/hand" value={summary.forearmTrend} />
            <MiniMetric label="Trunk/back" value={summary.trunkTrend} />
            <MiniMetric label="Max EV" value={summary.maxEv === null ? "-" : summary.maxEv} />
            <MiniMetric label="Top-5 EV" value={summary.top5Ev === null ? "-" : summary.top5Ev} />
            <MiniMetric label="95+ balls" value={summary.balls95} />
            <MiniMetric label="Rollover trend" value={summary.rolloverTrend} />
          </div>
          <p className="progress-copy">Session mix: {summary.sessionBreakdown}</p>
          <p className="progress-copy">Swing often. Redline strategically. Let output work stay planned, contained, and logged.</p>
        </>
      ) : (
        <p className="progress-copy">Log hitting sessions to unlock hitting trends: swing touches, high-intent exposures, feel, fatigue, and optional EV/bat-speed output.</p>
      )}
    </Card>
  );
}

function WeeklyHittingReviewCard({ summary }: { summary: HittingSummary }) {
  const status = hittingWeeklyStatus(summary);
  return (
    <Card className="progress-card">
      <div className="progress-card-header">
        <div>
          <span className="eyebrow">Weekly Hitting Review</span>
          <h3>{summary.hasData ? status : "Log hitting to unlock review"}</h3>
        </div>
      </div>
      {summary.hasData ? (
        <>
          <div className="symptom-list">
            <ReviewRow label="Swing touches" value={`${summary.touches} this week`} />
            <ReviewRow label="High-intent exposures" value={`${summary.highIntentExposures}`} />
            <ReviewRow label="Overall feel" value={summary.touches < 2 ? `${summary.feltTrend} - one log, no trend yet` : summary.feltTrend} />
            <ReviewRow label="Hard contact" value={summary.maxEv === null ? "Use output logs when relevant" : `Max EV ${summary.maxEv}`} />
            <ReviewRow label="Rollovers" value={summary.rolloverTrend} />
            <ReviewRow label="Next week focus" value={nextHittingFocus(summary)} />
          </div>
          <p className="progress-copy">Green-Light means add one thing only, not everything.</p>
        </>
      ) : (
        <p className="progress-copy">This review will answer: touches, high-intent exposures, feel, hard contact, rollovers, fatigue, and one focus for next week.</p>
      )}
    </Card>
  );
}

function PhysicalSummaryCard({ summary }: { summary: PhysicalSummary }) {
  return (
    <Card className="progress-card">
      <div className="progress-card-header">
        <div>
          <span className="eyebrow">Physical Performance Summary</span>
          <h3>This week</h3>
        </div>
      </div>
      {summary.hasData ? (
        <>
          <div className="progress-mini-grid">
            <MiniMetric label="Sessions" value={summary.sessions} />
            <MiniMetric label="Full" value={summary.full} />
            <MiniMetric label="Short" value={summary.short} />
            <MiniMetric label="Minimum" value={summary.minimum} />
            <MiniMetric label="Recovery" value={summary.recovery} />
            <MiniMetric label="Skip/Modified" value={summary.skipModified} />
            <MiniMetric label="Main Strength" value={summary.mainStrength} />
            <MiniMetric label="Upper + Trunk" value={summary.upperTrunk} />
            <MiniMetric label="Speed + Power" value={summary.speedPower} />
            <MiniMetric label="Recovery/Tissue" value={summary.recoveryTissue} />
            <MiniMetric label="Knee Capacity" value={summary.kneeCapacity} />
            <MiniMetric label="Arm Care" value={summary.armCare} />
            <MiniMetric label="Mobility" value={summary.mobility} />
            <MiniMetric label="Avg RPE" value={summary.averageRpe === null ? "-" : summary.averageRpe.toFixed(1)} />
            <MiniMetric label="Knee" value={summary.kneeTrend} />
            <MiniMetric label="Arm after" value={summary.armTrend} />
            <MiniMetric label="Energy" value={summary.energyTrend} />
            <MiniMetric label="Soreness" value={summary.sorenessTrend} />
            <MiniMetric label="Pain during" value={summary.painTrend} />
          </div>
          <p className="progress-copy">{summary.sessions === 1 ? "One physical log saved. Useful snapshot, not a trend yet." : "Physical work is being tracked across strength, speed, knee, arm support, and recovery."}</p>
        </>
      ) : (
        <p className="progress-copy">Log Physical Performance sessions to unlock strength, speed, knee, arm support, and recovery trends.</p>
      )}
    </Card>
  );
}

function RecoverySummaryCard({ summary }: { summary: RecoverySummary }) {
  return (
    <Card className="progress-card">
      <div className="progress-card-header">
        <div>
          <span className="eyebrow">Recovery Summary</span>
          <h3>This week</h3>
        </div>
      </div>
      {summary.hasData ? (
        <div className="progress-mini-grid">
          <MiniMetric label="Recovery Sessions" value={summary.sessions} />
          <MiniMetric label="Arm care" value={summary.armCare} />
          <MiniMetric label="Knee capacity" value={summary.kneeCapacity} />
          <MiniMetric label="Mobility" value={summary.mobility} />
          <MiniMetric label="Felt better" value={summary.better} tone="good" />
          <MiniMetric label="Same" value={summary.same} />
          <MiniMetric label="Worse" value={summary.worse} tone={summary.worse ? "watch" : "neutral"} />
          <MiniMetric label="Notes" value={summary.notes} />
        </div>
      ) : (
        <p className="progress-copy">Log recovery work to track arm care, knee capacity, mobility, and next-day response.</p>
      )}
    </Card>
  );
}

function SystemTrendsCard({ trends }: { trends: SystemTrends }) {
  return (
    <Card className="progress-card">
      <div className="progress-card-header">
        <div>
          <span className="eyebrow">Arm / Knee / Energy Trends</span>
          <h3>Lane-aware read</h3>
        </div>
      </div>
      <div className="symptom-list">
        <ReviewRow label="Arm Trend" value={trends.arm} />
        <ReviewRow label="Knee Trend" value={trends.knee} />
        <ReviewRow label="Energy Trend" value={trends.energy} />
      </div>
    </Card>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="symptom-row">
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
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
          <h3>{recommendationTitle(earned)}</h3>
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
  const throwingDays = weekLogs.filter(isThrowingTrainingLog).length;
  const hittingDays = weekLogs.filter(isHittingTrainingLog).length;
  const physicalDays = weekLogs.filter(isPhysicalTrainingLog).length;
  const recoveryDays = weekLogs.filter(isRecoveryTrainingLog).length;
  const unknownDays = weekLogs.filter((log) => classifyLog(log) === "unknown").length;
  const moundDays = weekLogs.filter((log) => safeNumber(log.moundPitches) > 0 || textIncludes(log.actualDayType, "mound")).length;
  const unloggedDays = weekLogs.length ? estimateUnloggedDays(weekLogs, startDate, week) : null;

  return {
    week,
    logs: weekLogs,
    totalSessions: weekLogs.length,
    throwingDays,
    hittingDays,
    physicalDays,
    recoveryDays,
    unknownDays,
    moundDays,
    green: statusCounts.green,
    yellow: statusCounts.yellow,
    red: statusCounts.red,
    notChecked: statusCounts.notChecked,
    unloggedDays,
    summary: weeklySummaryText(weekLogs, statusCounts, throwingDays),
  };
}

function buildCleanStreak(logs: TrainingLog[]): CleanStreak {
  const newest = sortLogsNewestFirst(logs);
  const oldest = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const newestThrowing = newest.filter(isThrowingTrainingLog);
  const oldestThrowing = oldest.filter(isThrowingTrainingLog);

  const overallCurrent = currentCleanRun(newest);
  const overallLongest = longestCleanRun(oldest);
  const throwingCurrent = currentCleanRun(newestThrowing);
  const throwingLongest = longestCleanRun(oldestThrowing);

  const lastYellow = newest.find((log) => log.armStatus === "yellow")?.date;
  const lastRed = newest.find((log) => log.armStatus === "red")?.date;
  const need = Math.max(0, 3 - throwingCurrent);
  const progressText =
    logs.length === 0
      ? "Log a few sessions to start tracking clean streaks and earned exposure."
      : throwingCurrent === 0
        ? "Overall clean streak counts all lanes. Throwing clean streak needs throwing logs before it can support throwing progression."
        : need > 0
          ? `Need ${need} more clean throwing ${need === 1 ? "session" : "sessions"} before considering an earned throwing progression touch.`
          : "Throwing clean streak is building. Overall clean support helps a little, but any added throwing exposure should still be planned, contained, and logged.";

  return { overallCurrent, overallLongest, throwingCurrent, throwingLongest, lastYellow, lastRed, progressText };
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
  const throwingLogs = logs.filter(isThrowingTrainingLog);
  if (throwingLogs.length === 0) {
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

  const maxIntent = Math.max(...throwingLogs.map((log) => maxNumberFromText(log.intentRange)), 0);

  return {
    hasData: true,
    throwingSessions: throwingLogs.length,
    estimatedThrows: throwingLogs.reduce((sum, log) => sum + safeNumber(log.totalThrows), 0),
    highestThrowCount: Math.max(...throwingLogs.map((log) => safeNumber(log.totalThrows)), 0),
    longestDistance: Math.max(...throwingLogs.map((log) => safeNumber(log.maxDistanceFt)), 0),
    highestIntent: maxIntent ? `${maxIntent}%` : throwingLogs.some((log) => safeNumber(log.highIntentThrows) > 0) ? "High intent logged" : "Not logged",
    moundSessions: throwingLogs.filter((log) => safeNumber(log.moundPitches) > 0 || textIncludes(log.actualDayType, "mound")).length,
    plyoDays: throwingLogs.filter((log) => Array.isArray(log.drillIds) && log.drillIds.some(isPlyoDrillId)).length,
    recoveryDays: throwingLogs.filter((log) => textIncludes(log.actualDayType, "recovery") || textIncludes(log.actualDayType, "catch")).length,
  };
}

function buildHittingSummary(logs: TrainingLog[], startDate: string): HittingSummary {
  const week = Math.max(1, weekFromDate(todayIso(), startDate));
  const hittingLogs = logs.filter(isHittingTrainingLog);
  const weekLogs = hittingLogs.filter((log) => Math.max(1, weekFromDate(log.date, startDate)) === week);

  if (weekLogs.length === 0) {
    return {
      hasData: false,
      touches: 0,
      highIntentExposures: 0,
      contactQualityDays: 0,
      recoveryFeelDays: 0,
      gameTransferBlocks: 0,
      batSpeedDays: 0,
      evDamageDays: 0,
      microdoseDays: 0,
      gamePrepDays: 0,
      minimumDays: 0,
      volumeTrend: "No data",
      feltTrend: "No data",
      forearmTrend: "No data",
      trunkTrend: "No data",
      maxEv: null,
      top5Ev: null,
      balls95: 0,
      rolloverTrend: "No data",
      sessionBreakdown: "No data",
    };
  }

  const maxEvValues = weekLogs.map((log) => safeNumber(log.laneData?.maxEv, NaN)).filter(Number.isFinite);
  const top5Values = weekLogs.map((log) => safeNumber(log.laneData?.top5Ev, NaN)).filter(Number.isFinite);
  const balls95 = weekLogs.reduce((sum, log) => sum + safeNumber(log.laneData?.balls95), 0);

  return {
    hasData: true,
    touches: weekLogs.length,
    highIntentExposures: weekLogs.filter(isHighIntentHittingExposure).length,
    contactQualityDays: weekLogs.filter((log) => laneText(log, "sessionType").includes("Contact Quality") || textIncludes(log.actualDayType, "contact quality")).length,
    recoveryFeelDays: weekLogs.filter((log) => laneText(log, "sessionType").includes("Recovery / Feel") || textIncludes(log.actualDayType, "recovery / feel")).length,
    gameTransferBlocks: weekLogs.filter((log) => laneText(log, "sessionType").includes("Game Transfer") || textIncludes(log.actualDayType, "game transfer")).length,
    batSpeedDays: weekLogs.filter((log) => laneText(log, "sessionType") === "Bat Speed" || textIncludes(log.actualDayType, "bat speed")).length,
    evDamageDays: weekLogs.filter((log) => laneText(log, "sessionType").includes("EV / Damage") || textIncludes(log.actualDayType, "ev / damage")).length,
    microdoseDays: weekLogs.filter((log) => laneText(log, "sessionType").includes("Microdose") || textIncludes(log.actualDayType, "microdose")).length,
    gamePrepDays: weekLogs.filter((log) => laneText(log, "sessionType").includes("Game Prep") || textIncludes(log.actualDayType, "game prep")).length,
    minimumDays: weekLogs.filter((log) => laneText(log, "sessionType").includes("Minimum") || textIncludes(log.actualDayType, "minimum")).length,
    volumeTrend: summarizeRecentLaneText(weekLogs, "swingVolume"),
    feltTrend: summarizeRecentLaneText(weekLogs, "hittingFelt"),
    forearmTrend: summarizeFatigue(weekLogs, "forearmFatigue"),
    trunkTrend: summarizeFatigue(weekLogs, "trunkFatigue"),
    maxEv: maxEvValues.length ? Math.max(...maxEvValues) : null,
    top5Ev: top5Values.length ? Math.max(...top5Values) : null,
    balls95,
    rolloverTrend: summarizeRecentLaneText(weekLogs, "rolloverTendency"),
    sessionBreakdown: sessionTypeBreakdown(weekLogs),
  };
}

function buildPhysicalSummary(logs: TrainingLog[], startDate: string): PhysicalSummary {
  const week = Math.max(1, weekFromDate(todayIso(), startDate));
  const weekLogs = logs.filter((log) => isPhysicalTrainingLog(log) && Math.max(1, weekFromDate(log.date, startDate)) === week);

  if (weekLogs.length === 0) {
    return {
      hasData: false,
      sessions: 0,
      full: 0,
      short: 0,
      minimum: 0,
      recovery: 0,
      skipModified: 0,
      mainStrength: 0,
      upperTrunk: 0,
      speedPower: 0,
      recoveryTissue: 0,
      kneeCapacity: 0,
      armCare: 0,
      mobility: 0,
      averageRpe: null,
      kneeTrend: "No data",
      armTrend: "No data",
      energyTrend: "No data",
      sorenessTrend: "No data",
      painTrend: "No data",
    };
  }

  const rpeValues = weekLogs.map((log) => safeNumber(log.laneData?.sessionRpe, NaN)).filter(Number.isFinite);

  return {
    hasData: true,
    sessions: weekLogs.length,
    full: countLaneText(weekLogs, "version", "Full"),
    short: countLaneText(weekLogs, "version", "Short"),
    minimum: countLaneText(weekLogs, "version", "Minimum"),
    recovery: countLaneText(weekLogs, "version", "Recovery"),
    skipModified: countLaneText(weekLogs, "version", "Skip") + countLaneText(weekLogs, "status", "Modified") + countLaneText(weekLogs, "status", "Skipped"),
    mainStrength: countSessionType(weekLogs, "Main Strength"),
    upperTrunk: countSessionType(weekLogs, "Upper + Trunk"),
    speedPower: countSessionType(weekLogs, "Speed + Power"),
    recoveryTissue: countSessionType(weekLogs, "Recovery / Tissue"),
    kneeCapacity: countSessionType(weekLogs, "Knee Capacity"),
    armCare: countSessionType(weekLogs, "Arm Care"),
    mobility: countSessionType(weekLogs, "Mobility"),
    averageRpe: rpeValues.length ? average(rpeValues) : null,
    kneeTrend: summarizeRecentLaneText(weekLogs, "kneeAfter"),
    armTrend: summarizeRecentLaneText(weekLogs, "armAfter"),
    energyTrend: summarizeRecentPhysicalEnergy(weekLogs),
    sorenessTrend: summarizeRecentLaneText(weekLogs, "soreness"),
    painTrend: summarizeRecentLaneText(weekLogs, "painDuring"),
  };
}

function buildRecoverySummary(logs: TrainingLog[], startDate: string): RecoverySummary {
  const week = Math.max(1, weekFromDate(todayIso(), startDate));
  const weekLogs = logs.filter((log) => isRecoveryTrainingLog(log) && Math.max(1, weekFromDate(log.date, startDate)) === week);
  if (weekLogs.length === 0) {
    return { hasData: false, sessions: 0, armCare: 0, kneeCapacity: 0, mobility: 0, better: 0, same: 0, worse: 0, notes: 0 };
  }

  return {
    hasData: true,
    sessions: weekLogs.length,
    armCare: countYes(weekLogs, "armCare"),
    kneeCapacity: countYes(weekLogs, "kneeCapacity"),
    mobility: countYes(weekLogs, "mobility"),
    better: countLaneText(weekLogs, "feltBetter", "Better"),
    same: countLaneText(weekLogs, "feltBetter", "Same"),
    worse: countLaneText(weekLogs, "feltBetter", "Worse"),
    notes: weekLogs.filter((log) => Boolean(log.notes)).length,
  };
}

function buildSystemTrends(logs: TrainingLog[], checkIns: CheckInRecord[]): SystemTrends {
  const recent = logsInLastDays(logs, 14);
  const throwing = recent.filter(isThrowingTrainingLog);
  const hitting = recent.filter(isHittingTrainingLog);
  const physical = recent.filter(isPhysicalTrainingLog);
  const recovery = recent.filter(isRecoveryTrainingLog);

  const arm =
    throwing.length > 0
      ? `Primary: throwing logs. ${statusSentence(countStatuses(throwing))} Support: ${supportArmSentence(hitting, physical)}`
      : `Primary: throwing logs. No recent throwing data. ${nonThrowingArmSupportText(hitting, physical)} throwing-specific arm response still needs data.`;

  const knee =
    physical.length > 0
      ? `Primary: physical logs. Knee: ${summarizeRecentLaneText(physical, "kneeAfter")}. ${kneeAdvice(physical)}`
      : "Primary: physical logs. No recent physical knee data. Keep logging knee response after physical sessions.";

  const checkInEnergy = checkIns.filter((checkIn) => daysAgo(checkIn.date) < 14).map((checkIn) => checkIn.input?.bodyFatigue).filter((value): value is number => typeof value === "number");
  const energy =
    physical.length || recovery.length || checkInEnergy.length
      ? `Based on physical/recovery logs and check-ins. Physical energy: ${summarizeRecentPhysicalEnergy(physical)}. ${energyAdvice(physical, checkInEnergy)}`
      : "No recent energy data. If energy is yellow, keep the main priority and cut optional work.";

  return { arm, knee, energy };
}

function buildWarningPatterns(logs: TrainingLog[], checkIns: CheckInRecord[], symptoms: SymptomSummary[]): WarningPattern[] {
  const recent = logsInLastDays(logs, 14);
  const recentCheckIns = checkIns.filter((checkIn) => daysAgo(checkIn.date) < 14);
  const recentEvidenceCount = recent.length + recentCheckIns.length;
  const recentThrowing = recent.filter(isThrowingTrainingLog);
  const recentSupport = recent.filter((log) => isHittingTrainingLog(log) || isPhysicalTrainingLog(log) || isRecoveryTrainingLog(log));
  const pastThrowingWarning = logs.some((log) => isThrowingTrainingLog(log) && daysAgo(log.date) >= 14 && isArmWarningLog(log));
  const patterns: WarningPattern[] = [];

  const recentRedLog = recent.find((log) => log.armStatus === "red");
  if (recentRedLog) {
    const lane = classifyLog(recentRedLog);
    patterns.push({ tone: "danger", text: `${titleCase(lane)} red status showed up recently. Back off until response is clean again.` });
  }

  if (recent.some((log) => (highIntentSignal(log) || isHighIntentHittingExposure(log)) && (log.armStatus === "yellow" || log.armStatus === "red"))) {
    patterns.push({ tone: "watch", text: "High-output warning detected. Yellow/red signs showed up after higher intent. Keep the next session controlled." });
  }

  if (recent.some((log) => isThrowingTrainingLog(log) && (safeNumber(log.forearmTightnessAfter) >= 2 || safeNumber(log.bicepsTightnessAfter) >= 2))) {
    patterns.push({ tone: "watch", text: "Throwing warning detected: forearm/biceps symptoms appeared after throwing. Do not ignore tightness just because pain is low." });
  }

  if (recent.some((log) => isHittingTrainingLog(log) && ["Moderate", "High"].includes(laneText(log, "forearmFatigue")))) {
    patterns.push({ tone: "watch", text: "Hitting forearm/hand warning detected. Keep high-intent hitting contained until response is clean." });
  }

  if (recent.some((log) => isPhysicalTrainingLog(log) && (laneText(log, "kneeAfter") === "Yellow" || laneText(log, "kneeAfter") === "Red" || laneText(log, "painDuring") === "Knee"))) {
    patterns.push({ tone: "watch", text: "Physical knee warning detected. Modify impact, sprinting, jumping, and painful knee-dominant work." });
  }

  const risingSymptoms = symptoms.some((symptom) => symptom.direction === "rising");
  const warningSymptoms = symptoms.some((symptom) => symptom.direction === "warning");
  if (recentEvidenceCount < 3 && (risingSymptoms || warningSymptoms)) {
    patterns.push({ tone: "watch", text: "Need more recent logs before calling this a trend." });
  } else if (risingSymptoms) {
    patterns.push({ tone: "watch", text: "Symptoms are trending up. Hold the current level until the response settles." });
  } else if (warningSymptoms) {
    patterns.push({ tone: "watch", text: "Warning-level symptom logged recently. Keep the next session controlled and keep logging honestly." });
  }

  if (pastThrowingWarning && recentThrowing.length === 0 && recentSupport.length > 0 && recentSupport.every(isCleanLog)) {
    patterns.push({ tone: "watch", text: "Past throwing/arm warning detected. Recent support logs may be clean, but throwing response still needs fresh data." });
  } else if (pastThrowingWarning && recentEvidenceCount < 3) {
    patterns.push({ tone: "watch", text: "Past warning detected. Keep logging recent response before changing the plan." });
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
  const throwing = recent.filter(isThrowingTrainingLog);
  const cleanThrowing = throwing.filter(isCleanLog).length;
  const cleanSupport = recent.filter((log) => (isHittingTrainingLog(log) || isPhysicalTrainingLog(log) || isRecoveryTrainingLog(log)) && isCleanLog(log)).length;
  const symptomWarning = symptoms.some((symptom) => symptom.direction === "rising" || symptom.direction === "warning");
  const currentThrowingWarning = throwing.some(isArmWarningLog);
  const pastThrowingWarning = logs.some((log) => isThrowingTrainingLog(log) && daysAgo(log.date) >= 14 && isArmWarningLog(log));
  const redRecent = recent.some((log) => log.armStatus === "red");
  const yellowRecent = recent7.filter((log) => log.armStatus === "yellow").length;
  const nextMorning = throwing.some((log) => Boolean(log.nextMorningSymptoms));

  if (throwing.length === 0) {
    if (pastThrowingWarning) {
      return {
        status: "Not Enough Throwing Data",
        tone: "watch",
        evidence: "past-warning",
        detail: cleanSupport > 0
          ? "Past arm warning detected. Recent support logs are clean, but throwing progression needs fresh throwing-specific data before adding exposure."
          : "Past arm warning detected. Throwing progression needs fresh throwing-specific logs before adding exposure.",
      };
    }
    return {
      status: "Not Enough Throwing Data",
      tone: "neutral",
      evidence: "not-enough-throwing",
      detail: cleanSupport > 0
        ? "Overall response may be clean, and clean support work helps readiness slightly, but it does not replace throwing response."
        : "Overall response may be clean, but throwing progression still needs throwing-specific logs.",
    };
  }

  if (redRecent || patterns.some((pattern) => pattern.tone === "danger")) {
    return {
      status: "Back off",
      tone: "danger",
      evidence: "current-warning",
      detail: "A red flag appeared recently. No long toss, radar, or higher-intent add-ons until the response is clean again.",
    };
  }

  if (yellowRecent >= 2 || nextMorning || currentThrowingWarning || symptomWarning) {
    return {
      status: "Hold",
      tone: "watch",
      evidence: "current-warning",
      detail: currentThrowingWarning || nextMorning
        ? "Recent throwing response has a warning sign. Keep the next session conservative and protect the next-morning response."
        : "Current yellow signs or supported symptom trends are present. Keep the next session conservative and protect the next-morning response.",
    };
  }

  if (cleanThrowing >= 3 && streak.throwingCurrent >= 3 && cleanSupport >= 1 && recap.throwingDays >= 2) {
    return {
      status: "Green-Light",
      tone: "good",
      evidence: "green-light",
      detail: "Throwing response is clean and support work is not creating issues. You may add one earned progression touch. Add one thing only, not everything.",
    };
  }

  if (cleanThrowing >= 1) {
    return {
      status: "Build",
      tone: "neutral",
      evidence: cleanSupport > 0 ? "controlled-build" : "clean-build",
      detail: cleanSupport > 0 ? "Clean support work helps, but keep the next throwing progression conservative until more throwing response is logged." : "Throwing response is clean so far. Follow the planned progression and keep stacking clean throwing sessions.",
    };
  }

  return {
    status: "Hold",
    tone: "neutral",
    evidence: "not-enough-throwing",
    detail: "Throwing response is not clearly clean yet. Keep the next session conservative and log it honestly.",
  };
}

function buildRecommendation(earned: EarnedProgression, warnings: WarningPattern[], logCount: number): string {
  if (earned.evidence === "past-warning") return "Recommendation: Past arm warning detected. Keep the next throwing session controlled and use the log to confirm response.";
  if (earned.status === "Not Enough Throwing Data") return "Recommendation: Overall support work may be clean, but do not earn extra throwing exposure yet. Log the next throwing session honestly.";
  if (logCount < 3) return "Recommendation: Need more logs before judging. Log the next few sessions honestly and keep the plan conservative.";
  if (earned.status === "Back off") return "Recommendation: Recovery emphasis. No throwing add-ons until red flags and next-morning response are clean.";
  if (earned.status === "Hold") return "Recommendation: Hold current level. Use the conservative path and protect the next-morning response.";
  if (earned.status === "Green-Light") return "Recommendation: Follow normal progression and add one earned progression touch only if it is planned, contained, and logged.";
  if (earned.status === "Build") return "Recommendation: Follow planned progression. Throwing response is clean and support work is not creating issues.";
  if (warnings.length) return "Recommendation: Keep next session conservative and watch the pattern before adding stress.";
  return "Recommendation: Progress normally within the plan. No random aggression. Earn it, contain it, log it, recover from it.";
}

function weeklySummaryText(logs: TrainingLog[], counts: StatusCounts, throwingDays: number): string {
  const total = logs.length;
  const throwingCounts = countStatuses(logs.filter(isThrowingTrainingLog));
  if (total === 0) return "Not enough logged data yet. Log a few sessions to unlock weekly trends.";
  if (counts.red > 0) return `This week: ${total} sessions logged. ${counts.green} green, ${counts.yellow} yellow, ${counts.red} red. Overall response is mixed. Keep the next session conservative until the trend clears.`;
  if (counts.yellow > 0) return `This week: ${total} sessions logged. ${counts.green} green, ${counts.yellow} yellow, 0 red. Overall response is mostly clean, but keep the next session controlled.`;
  if (throwingDays === 0) return "Overall response is clean this week. Throwing-specific response still needs throwing logs before judging arm progression.";
  if (throwingCounts.green > 0 && throwingCounts.yellow === 0 && throwingCounts.red === 0) return "Throwing response is clean so far. Keep stacking.";
  return "Overall support work is clean. Throwing response still needs throwing-specific data.";
}

function snapshotText(status: TrainingLog["armStatus"], symptomScore: number | null, nextMorning?: boolean): string {
  if (status === "red") return "Latest response is red. Recovery comes first. No extra exposure is earned today.";
  if (status === "yellow") return "Latest response is yellow. Keep the next session conservative and watch tightness.";
  if (nextMorning) return "Next-morning symptoms were logged. Treat that as a warning even if the session felt fine.";
  if (symptomScore !== null && symptomScore <= 1 && status === "green") return "Latest response is clean. Keep earning it one session at a time.";
  if (symptomScore !== null && symptomScore >= 3) return "Symptoms were elevated. Hold the line before adding workload.";
  return "Latest data is usable, but keep logging to sharpen the read.";
}

function recommendationTitle(earned: EarnedProgression): string {
  if (earned.evidence === "past-warning") return "Controlled next throw";
  if (earned.status === "Back off") return "Recovery emphasis";
  if (earned.status === "Hold") return "Hold current level";
  if (earned.status === "Not Enough Throwing Data") return "Log throwing response";
  if (earned.status === "Green-Light") return "One progression touch";
  if (earned.status === "Build") return "Follow planned progression";
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

function isArmWarningLog(log: TrainingLog): boolean {
  return (
    log.armStatus === "yellow" ||
    log.armStatus === "red" ||
    safeNumber(log.forearmTightnessAfter) >= 2 ||
    safeNumber(log.bicepsTightnessAfter) >= 2 ||
    safeNumber(log.painDuring) > 0 ||
    safeNumber(log.painOneHourAfter) > 0 ||
    Boolean(log.hotRedHandForearm) ||
    Boolean(log.nextMorningSymptoms) ||
    log.decision === "regress"
  );
}

function highIntentSignal(log: TrainingLog): boolean {
  return safeNumber(log.highIntentThrows) > 0 || maxNumberFromText(log.intentRange) >= 75 || textIncludes(log.actualDayType, "high-intent") || textIncludes(log.actualDayType, "velo");
}

function summarizeRecentLaneText(logs: TrainingLog[], key: string): string {
  const values = sortLogsNewestFirst(logs)
    .map((log) => laneText(log, key))
    .filter(Boolean)
    .slice(0, 3);
  if (values.length === 0) return "No data";
  return values.join(" / ");
}

function summarizeRecentPhysicalEnergy(logs: TrainingLog[]): string {
  const values = sortLogsNewestFirst(logs)
    .map((log) => laneText(log, "energyAfter") || laneText(log, "energy"))
    .filter(Boolean)
    .slice(0, 3);
  return values.length ? values.join(" / ") : "No data";
}

function summarizeFatigue(logs: TrainingLog[], key: string): string {
  const values = logs.map((log) => laneText(log, key)).filter(Boolean);
  if (values.length === 0) return "No data";
  if (values.includes("High")) return "High";
  if (values.includes("Moderate")) return "Moderate";
  if (values.includes("Mild")) return "Mild";
  return "Clean";
}

function sessionTypeBreakdown(logs: TrainingLog[]): string {
  const counts = logs.reduce<Record<string, number>>((acc, log) => {
    const type = laneText(log, "sessionType") || log.plannedDayType || "Hitting";
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([type, count]) => `${type} ${count}`)
    .join(" / ");
}

function countLaneText(logs: TrainingLog[], key: string, value: string): number {
  return logs.filter((log) => laneText(log, key) === value).length;
}

function countSessionType(logs: TrainingLog[], search: string): number {
  return logs.filter((log) => laneText(log, "sessionType").includes(search) || textIncludes(log.actualDayType, search)).length;
}

function countYes(logs: TrainingLog[], key: string): number {
  return logs.filter((log) => laneText(log, key) === "Yes").length;
}

function currentCleanRun(logsNewestFirst: TrainingLog[]): number {
  let current = 0;
  for (const log of logsNewestFirst) {
    if (!isCleanLog(log)) break;
    current += 1;
  }
  return current;
}

function longestCleanRun(logsOldestFirst: TrainingLog[]): number {
  let longest = 0;
  let running = 0;
  for (const log of logsOldestFirst) {
    if (isCleanLog(log)) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }
  return longest;
}

function statusSentence(counts: StatusCounts): string {
  if (counts.red > 0) return `${counts.red} red recent throwing response.`;
  if (counts.yellow > 0) return `${counts.yellow} yellow recent throwing response.`;
  if (counts.green > 0) return `${counts.green} green recent throwing response.`;
  return "No checked status yet.";
}

function supportArmSentence(hitting: TrainingLog[], physical: TrainingLog[]): string {
  const support = [...hitting, ...physical];
  if (support.length === 0) return "No support-lane arm data yet.";
  const warning = support.some((log) => {
    const armAfter = laneText(log, "armAfter").toLowerCase();
    return log.armStatus === "yellow" || log.armStatus === "red" || armAfter === "yellow" || armAfter === "red" || ["Moderate", "High"].includes(laneText(log, "forearmFatigue"));
  });
  return warning ? "Support lanes show arm/forearm caution." : "Support lanes are arm-clean.";
}

function nonThrowingArmSupportText(hitting: TrainingLog[], physical: TrainingLog[]): string {
  const support = [...hitting, ...physical];
  if (support.length === 0) return "No non-throwing support data yet.";
  return supportArmSentence(hitting, physical) === "Support lanes are arm-clean."
    ? "Non-throwing logs are clean, but"
    : "Non-throwing support logs show caution, and";
}

function kneeAdvice(physical: TrainingLog[]): string {
  const kneeValues = physical.map((log) => laneText(log, "kneeAfter"));
  if (kneeValues.includes("Red")) return "Knee is red. Use recovery or skip impact work.";
  if (kneeValues.includes("Yellow")) return "Knee is yellow. Modify impact, sprinting, jumping, and painful knee-dominant work.";
  if (kneeValues.includes("Green")) return "Knee is supporting normal training.";
  return "Keep logging knee response after physical sessions.";
}

function energyAdvice(physical: TrainingLog[], checkInEnergy: number[]): string {
  if (physical.some((log) => laneText(log, "energyAfter") === "Red") || checkInEnergy.some((value) => value >= 5)) return "Recovery version recommended.";
  if (physical.some((log) => laneText(log, "energyAfter") === "Yellow") || checkInEnergy.some((value) => value >= 4)) return "Keep the main priority but cut optional work.";
  return "Energy is supporting normal training.";
}

function hittingWeeklyStatus(summary: HittingSummary): "Conservative" | "Normal" | "Green-Light" {
  if (!summary.hasData || summary.touches <= 1 || summary.forearmTrend === "High" || summary.trunkTrend === "High") return "Conservative";
  if (summary.highIntentExposures > 1 || summary.forearmTrend === "Moderate" || summary.trunkTrend === "Moderate") return "Normal";
  return "Green-Light";
}

function nextHittingFocus(summary: HittingSummary): string {
  if (summary.forearmTrend === "High" || summary.trunkTrend === "High") return "Recovery / Feel until fatigue settles";
  if (summary.rolloverTrend === "High" || summary.rolloverTrend === "Medium") return "Contact Quality: clean direction before output";
  if (summary.highIntentExposures === 0 && summary.touches >= 2) return "Consider one planned output touch if readiness is green";
  return "Keep useful swing exposure and avoid random redlining";
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
    if (consecutive && isThrowingTrainingLog(previous) && isThrowingTrainingLog(current) && warning) return true;
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

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
