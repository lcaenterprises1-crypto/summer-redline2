import type { TrainingLog } from "../types";
import { formatDisplayDate, weekFromDate } from "../logic/schedule";
import { Card } from "../components/Card";

interface ProgressProps {
  logs: TrainingLog[];
  startDate: string;
}

interface WeekSummary {
  week: number;
  totalThrows: number;
  moundPitches: number;
  highIntentThrows: number;
  green: number;
  yellow: number;
  red: number;
  forearmAvg: number;
  bicepsAvg: number;
  count: number;
  decisions: string[];
}

export function Progress({ logs, startDate }: ProgressProps) {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const summaries = buildWeeklySummaries(logs, startDate);
  const cleanStreak = countCleanStreak(sorted);
  const worst = worstSymptomDay(logs);
  const trend = sorted
    .map((log) => log.decision)
    .filter(Boolean)
    .slice(0, 5)
    .join(" -> ");

  const totals = logs.reduce(
    (acc, log) => ({
      throws: acc.throws + log.totalThrows,
      mound: acc.mound + log.moundPitches,
      high: acc.high + log.highIntentThrows,
    }),
    { throws: 0, mound: 0, high: 0 },
  );

  return (
    <div className="screen stack">
      <div className="section-heading">
        <div>
          <span className="eyebrow">From saved logs</span>
          <h2>Progress</h2>
        </div>
      </div>

      <div className="metric-grid">
        <Metric label="Total throws" value={totals.throws} />
        <Metric label="Mound pitches" value={totals.mound} />
        <Metric label="High-intent throws" value={totals.high} />
        <Metric label="Clean streak" value={cleanStreak} suffix="sessions" />
      </div>

      <Card>
        <h3>Response Read</h3>
        <div className="detail-grid">
          <div>
            <dt>Worst symptom day</dt>
            <dd>{worst ? `${formatDisplayDate(worst.date)} - ${worst.score}/10` : "No logs yet"}</dd>
          </div>
          <div>
            <dt>Trend</dt>
            <dd>{trend || "No decisions logged yet"}</dd>
          </div>
        </div>
      </Card>

      <div className="section-heading">
        <div>
          <span className="eyebrow">{summaries.length} weeks logged</span>
          <h2>Weekly Summaries</h2>
        </div>
      </div>

      <div className="card-list">
        {summaries.length === 0 ? (
          <Card>
            <p className="muted-line">Save a log to start seeing weekly summaries.</p>
          </Card>
        ) : (
          summaries.map((summary) => (
            <Card key={summary.week}>
              <div className="card-topline">
                <span>Week {summary.week}</span>
                <span>{summary.count} logs</span>
              </div>
              <dl className="detail-grid">
                <div>
                  <dt>Total throws</dt>
                  <dd>{summary.totalThrows}</dd>
                </div>
                <div>
                  <dt>Mound pitches</dt>
                  <dd>{summary.moundPitches}</dd>
                </div>
                <div>
                  <dt>High intent</dt>
                  <dd>{summary.highIntentThrows}</dd>
                </div>
                <div>
                  <dt>G / Y / R</dt>
                  <dd>
                    {summary.green} / {summary.yellow} / {summary.red}
                  </dd>
                </div>
                <div>
                  <dt>Avg forearm</dt>
                  <dd>{summary.forearmAvg.toFixed(1)}</dd>
                </div>
                <div>
                  <dt>Avg biceps/elbow</dt>
                  <dd>{summary.bicepsAvg.toFixed(1)}</dd>
                </div>
                <div className="wide">
                  <dt>Progress / hold / regress</dt>
                  <dd>{summary.decisions.filter(Boolean).join(" -> ") || "Not logged"}</dd>
                </div>
              </dl>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <Card className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {suffix ? <small>{suffix}</small> : null}
    </Card>
  );
}

function buildWeeklySummaries(logs: TrainingLog[], startDate: string): WeekSummary[] {
  const map = new Map<number, TrainingLog[]>();

  logs.forEach((log) => {
    const week = Math.max(1, weekFromDate(log.date, startDate));
    const bucket = map.get(week) ?? [];
    bucket.push(log);
    map.set(week, bucket);
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([week, items]) => {
      const totalForearm = items.reduce((sum, log) => sum + log.forearmTightnessAfter, 0);
      const totalBiceps = items.reduce((sum, log) => sum + log.bicepsTightnessAfter, 0);

      return {
        week,
        totalThrows: items.reduce((sum, log) => sum + log.totalThrows, 0),
        moundPitches: items.reduce((sum, log) => sum + log.moundPitches, 0),
        highIntentThrows: items.reduce((sum, log) => sum + log.highIntentThrows, 0),
        green: items.filter((log) => log.armStatus === "green").length,
        yellow: items.filter((log) => log.armStatus === "yellow").length,
        red: items.filter((log) => log.armStatus === "red").length,
        forearmAvg: totalForearm / items.length,
        bicepsAvg: totalBiceps / items.length,
        count: items.length,
        decisions: items
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((log) => log.decision)
          .filter(Boolean),
      };
    });
}

function countCleanStreak(sortedNewestFirst: TrainingLog[]): number {
  let count = 0;
  for (const log of sortedNewestFirst) {
    const clean =
      log.forearmTightnessAfter <= 1 &&
      log.bicepsTightnessAfter <= 1 &&
      log.painDuring === 0 &&
      log.painOneHourAfter === 0 &&
      !log.hotRedHandForearm &&
      !log.nextMorningSymptoms;
    if (!clean) break;
    count += 1;
  }
  return count;
}

function worstSymptomDay(logs: TrainingLog[]): { date: string; score: number } | null {
  if (logs.length === 0) return null;

  return logs.reduce(
    (worst, log) => {
      const score = Math.max(
        log.forearmTightnessAfter,
        log.bicepsTightnessAfter,
        log.painDuring,
        log.painOneHourAfter,
      );
      return score > worst.score ? { date: log.date, score } : worst;
    },
    { date: logs[0].date, score: 0 },
  );
}
