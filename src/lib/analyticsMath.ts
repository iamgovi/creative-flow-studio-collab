import {
  memberAnalytics,
  recentTasksByMember,
  stageSamplesByMember,
  STAGES,
  WEEKLY_CAPACITY,
  SHIFT_START_MIN,
  type DailyRollup,
  type MemberAnalytics,
  type Stage,
} from "@/data/mockAnalytics";
import { team, type Teammate } from "@/data/mockSetup";

export const HEALTHY_PRODUCTIVITY: [number, number] = [55, 80];
export const HEALTHY_UTILIZATION: [number, number] = [70, 95];
export const MIN_SAMPLE = 3;

export type Zone = "low" | "healthy" | "high";

/** Classify a value against a healthy band. Both under and over are flagged. */
export function healthyBand(value: number, [lo, hi]: [number, number]): Zone {
  if (value < lo) return "low";
  if (value > hi) return "high";
  return "healthy";
}

export function zoneColorVar(zone: Zone): string {
  // healthy = green, low/high = amber (caution)
  return zone === "healthy" ? "var(--color-status-done)" : "var(--color-status-progress)";
}

export function mean(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function stdDev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

/** Filter a member's rollups to the most recent N days (the date-range window). */
export function windowRollups(m: MemberAnalytics, days: number): DailyRollup[] {
  return m.rollups.slice(Math.max(0, m.rollups.length - days));
}

/** Previous equivalent window (for "vs previous period"). */
export function prevWindowRollups(m: MemberAnalytics, days: number): DailyRollup[] {
  const end = Math.max(0, m.rollups.length - days);
  return m.rollups.slice(Math.max(0, end - days), end);
}

// ---- per-member metrics ----------------------------------------------------

export function productivityRatio(rollups: DailyRollup[]): number {
  const active = rollups.filter((r) => r.attendanceSec > 0);
  const att = sum(active.map((r) => r.attendanceSec));
  if (!att) return 0;
  return (sum(active.map((r) => r.productiveSec)) / att) * 100;
}

export function firstPassRate(rollups: DailyRollup[]): number {
  const done = sum(rollups.map((r) => r.tasksCompleted));
  if (!done) return 0;
  return (sum(rollups.map((r) => r.firstPass)) / done) * 100;
}

export function revisionRate(rollups: DailyRollup[]): number {
  const done = sum(rollups.map((r) => r.tasksCompleted));
  if (!done) return 0;
  return (sum(rollups.map((r) => r.revisions)) / done) * 100;
}

export function avgRevisionLoops(rollups: DailyRollup[]): number {
  const done = sum(rollups.map((r) => r.tasksCompleted));
  if (!done) return 0;
  return sum(rollups.map((r) => r.revisions)) / done;
}

export function reworkRatio(rollups: DailyRollup[]): number {
  const att = sum(rollups.map((r) => r.attendanceSec));
  if (!att) return 0;
  return (sum(rollups.map((r) => r.reworkSec)) / att) * 100;
}

export function reworkHours(rollups: DailyRollup[]): number {
  return sum(rollups.map((r) => r.reworkSec)) / 3600;
}

export function tasksCompleted(rollups: DailyRollup[]): number {
  return sum(rollups.map((r) => r.tasksCompleted));
}

export function attendanceRate(rollups: DailyRollup[]): number {
  const workingDays = rollups.filter((r) => r.isWorkingDay);
  if (!workingDays.length) return 0;
  const present = workingDays.filter((r) => r.present).length;
  return (present / workingDays.length) * 100;
}

export function punctualityRate(rollups: DailyRollup[]): number {
  const present = rollups.filter((r) => r.present && r.startMin != null);
  if (!present.length) return 0;
  const onTime = present.filter((r) => (r.startMin as number) <= SHIFT_START_MIN + 5).length;
  return (onTime / present.length) * 100;
}

export function avgStartMin(rollups: DailyRollup[]): number | null {
  const present = rollups.filter((r) => r.present && r.startMin != null);
  if (!present.length) return null;
  return mean(present.map((r) => r.startMin as number));
}

export function avgHoursPerDay(rollups: DailyRollup[]): number {
  const present = rollups.filter((r) => r.present);
  if (!present.length) return 0;
  return mean(present.map((r) => r.attendanceSec / 3600));
}

export function absences(rollups: DailyRollup[]): number {
  return rollups.filter((r) => r.isWorkingDay && !r.present).length;
}

export function utilization(member: Teammate): number {
  return (member.allocated / member.capacity) * 100;
}

// ---- team aggregates -------------------------------------------------------

export interface TeamMetrics {
  productivity: number;
  firstPass: number;
  onTime: number;
  reviewTurnaround: number; // hours
  utilization: number;
  attendance: number;
  revisionRate: number;
  avgLoops: number;
  reworkRatio: number;
}

function selectedMembers(memberIds: string[]): MemberAnalytics[] {
  if (!memberIds.length) return memberAnalytics;
  return memberAnalytics.filter((m) => memberIds.includes(m.member.id));
}

export function teamMetrics(memberIds: string[], days: number, prev = false): TeamMetrics {
  const members = selectedMembers(memberIds);
  const get = (m: MemberAnalytics) => (prev ? prevWindowRollups(m, days) : windowRollups(m, days));
  const all = members.flatMap(get);

  // on-time delivery: derive from first-pass-ish completion (mock proxy)
  const onTimeBase = 78 + (prev ? -6 : 0);

  return {
    productivity: productivityRatio(all),
    firstPass: firstPassRate(all),
    onTime: Math.min(100, onTimeBase + (firstPassRate(all) - 70) * 0.1),
    reviewTurnaround: prev ? 9.4 : 7.8, // manager's own review speed (honest)
    utilization: mean(members.map((m) => utilization(m.member))),
    attendance: mean(members.map((m) => attendanceRate(get(m)))),
    revisionRate: revisionRate(all),
    avgLoops: avgRevisionLoops(all),
    reworkRatio: reworkRatio(all),
  };
}

/** Daily team productivity series (for the trend line). */
export function teamProductivitySeries(memberIds: string[], days: number) {
  const members = selectedMembers(memberIds);
  const len = days;
  const ref = members[0] ? windowRollups(members[0], days) : [];
  return ref.map((_, i) => {
    const dayRollups = members
      .map((m) => windowRollups(m, days)[i])
      .filter(Boolean) as DailyRollup[];
    const att = sum(dayRollups.map((r) => r.attendanceSec));
    const prod = att ? (sum(dayRollups.map((r) => r.productiveSec)) / att) * 100 : 0;
    return { date: dayRollups[0]?.date.slice(5) ?? "", productivity: Math.round(prod) };
  }).slice(-len);
}

/** Output vs rework by week (stacked bar). */
export function outputVsReworkByWeek(memberIds: string[], days: number) {
  const members = selectedMembers(memberIds);
  const all = members.map((m) => windowRollups(m, days));
  const weeks: { week: string; output: number; rework: number }[] = [];
  const numWeeks = Math.ceil(days / 7);
  for (let w = 0; w < numWeeks; w++) {
    let output = 0;
    let rework = 0;
    for (const rollups of all) {
      const slice = rollups.slice(w * 7, w * 7 + 7);
      output += sum(slice.map((r) => r.productiveSec - r.reworkSec)) / 3600;
      rework += sum(slice.map((r) => r.reworkSec)) / 3600;
    }
    weeks.push({ week: `W${w + 1}`, output: Math.round(Math.max(0, output)), rework: Math.round(rework) });
  }
  return weeks;
}

// ---- stage heat-table ------------------------------------------------------

export interface StageCell {
  stage: Stage;
  avgSec: number;
  medianSec: number;
  n: number;
  enough: boolean;
  teamAvgSec: number;
  pctVsTeam: number; // +25 means 25% slower than team
}

/** Team average per stage across members that have enough samples. */
export function teamStageAverages(): Record<Stage, number> {
  const out = {} as Record<Stage, number>;
  for (const stage of STAGES) {
    const vals = team
      .map((m) => stageSamplesByMember[m.id][stage])
      .filter((s) => s.n >= MIN_SAMPLE)
      .map((s) => s.avgSec);
    out[stage] = vals.length ? mean(vals) : 0;
  }
  return out;
}

export function memberStageCells(memberId: string): StageCell[] {
  const teamAvg = teamStageAverages();
  return STAGES.map((stage) => {
    const s = stageSamplesByMember[memberId][stage];
    const enough = s.n >= MIN_SAMPLE;
    const pct = teamAvg[stage] ? ((s.avgSec - teamAvg[stage]) / teamAvg[stage]) * 100 : 0;
    return {
      stage,
      avgSec: s.avgSec,
      medianSec: s.medianSec,
      n: s.n,
      enough,
      teamAvgSec: teamAvg[stage],
      pctVsTeam: pct,
    };
  });
}

// ---- cycle time distribution ----------------------------------------------

export function cycleTimeBuckets(memberIds: string[]) {
  // build a histogram of recent task cycle times (hours)
  const members = selectedMembers(memberIds).map((m) => m.member.id);
  const cycles = members.flatMap((id) => (recentTasksByMember[id] ?? []).map((t) => t.cycleSec / 3600));
  const buckets = [
    { label: "0–4h", min: 0, max: 4 },
    { label: "4–8h", min: 4, max: 8 },
    { label: "8–16h", min: 8, max: 16 },
    { label: "16–24h", min: 16, max: 24 },
    { label: "24h+", min: 24, max: Infinity },
  ];
  return buckets.map((b) => ({
    label: b.label,
    count: cycles.filter((c) => c >= b.min && c < b.max).length,
  }));
}

// ---- z-score outliers ------------------------------------------------------

export interface Outlier {
  memberId: string;
  value: number;
  z: number;
}

export function zScoreOutliers(values: { memberId: string; value: number }[], threshold = 1.5): Outlier[] {
  const xs = values.map((v) => v.value);
  const m = mean(xs);
  const sd = stdDev(xs);
  if (!sd) return [];
  return values
    .map((v) => ({ memberId: v.memberId, value: v.value, z: (v.value - m) / sd }))
    .filter((v) => Math.abs(v.z) >= threshold);
}

// ---- workload balance ------------------------------------------------------

export function balanceIndex(memberIds: string[]): { index: number; overloaded: string[]; medianLoad: number } {
  const members = selectedMembers(memberIds).map((m) => m.member);
  const loads = members.map((m) => m.allocated);
  const med = median(loads);
  const sd = stdDev(loads);
  const m = mean(loads);
  // coefficient of variation -> 0 = perfectly even, scale to 0..100 "evenness"
  const cv = m ? sd / m : 0;
  const index = Math.max(0, Math.round((1 - cv) * 100));
  const overloaded = members.filter((mm) => mm.allocated > med * 1.2).map((mm) => mm.id);
  return { index, overloaded, medianLoad: med };
}

// ---- delta helper ----------------------------------------------------------

export function delta(current: number, previous: number): { abs: number; pct: number; dir: "up" | "down" | "flat" } {
  const abs = current - previous;
  const pct = previous ? (abs / previous) * 100 : 0;
  const dir = Math.abs(abs) < 0.01 ? "flat" : abs > 0 ? "up" : "down";
  return { abs, pct, dir };
}

// ---- formatting ------------------------------------------------------------

export function fmtPct(v: number, digits = 0): string {
  return `${v.toFixed(digits)}%`;
}

export function fmtHM(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function fmtMinClock(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export { WEEKLY_CAPACITY };
export const minSampleLabel = "Not enough data";