// Derived metrics for the Admin Deliverables view. Every number the UI shows
// is computed here from the shared mock data so all tabs stay consistent.
import {
  clients,
  deliverables,
  history,
  NOW,
  STAGES,
  type Client,
  type ClientHealth,
  type Deliverable,
  type DeliverableStatus,
  type DeliverableType,
  type Stage,
  type WeekPoint,
} from "@/data/mockDeliverables";

export const MIN_SAMPLE = 3;
const DAY = 86400000;

export function daysBetween(a: string | Date, b: string | Date): number {
  const ad = typeof a === "string" ? new Date(a) : a;
  const bd = typeof b === "string" ? new Date(b) : b;
  return Math.round((bd.getTime() - ad.getTime()) / DAY);
}

/** positive = days remaining until due, negative = days late */
export function daysLeft(due: string): number {
  return daysBetween(NOW, due);
}

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

// ---- filtering -------------------------------------------------------------

export interface DeliverableFilter {
  clientIds: string[]; // empty = all
  type: "all" | DeliverableType;
  status: "all" | DeliverableStatus;
}

export function filterDeliverables(
  dels: Deliverable[],
  f: DeliverableFilter,
): Deliverable[] {
  return dels.filter((d) => {
    if (f.clientIds.length && !f.clientIds.includes(d.clientId)) return false;
    if (f.type !== "all" && d.type !== f.type) return false;
    if (f.status !== "all" && d.status !== f.status) return false;
    return true;
  });
}

// ---- portfolio KPIs --------------------------------------------------------

export function statusCounts(dels: Deliverable[]): Record<DeliverableStatus, number> {
  const out: Record<DeliverableStatus, number> = {
    "on-track": 0,
    "at-risk": 0,
    delayed: 0,
    completed: 0,
    "not-started": 0,
  };
  for (const d of dels) out[d.status]++;
  return out;
}

/** Stage delay (days over estimate) for a single deliverable, across worked stages. */
export function deliverableDelay(d: Deliverable): number {
  return d.timeline
    .filter((s) => s.status !== "pending")
    .reduce((sum, s) => sum + s.delayDays, 0);
}

export function avgDelay(dels: Deliverable[]): number {
  const delayed = dels.filter((d) => d.status === "delayed");
  return mean(delayed.map(deliverableDelay));
}

export function avgCycleTime(dels: Deliverable[]): number {
  const done = dels.filter((d) => d.status === "completed" && d.completedDate);
  return mean(done.map((d) => daysBetween(d.startDate, d.completedDate!)));
}

export function activeCount(dels: Deliverable[]): number {
  return dels.filter((d) => d.status !== "completed" && d.status !== "not-started").length;
}

export function atRiskCount(dels: Deliverable[]): number {
  return dels.filter((d) => d.status === "at-risk" || d.status === "delayed").length;
}

export function clientsAtRisk(dels: Deliverable[]): number {
  const ids = new Set<string>();
  for (const d of dels) if (d.status === "at-risk" || d.status === "delayed") ids.add(d.clientId);
  return ids.size;
}

/** Portfolio on-time rate driven by the historical series (latest window value). */
export function onTimeRate(weeks: WeekPoint[] = history): number {
  return weeks.length ? weeks[weeks.length - 1].onTimeRate : 0;
}

export function onTimeRatePrev(weeks: WeekPoint[] = history): number {
  return weeks.length > 1 ? weeks[weeks.length - 2].onTimeRate : onTimeRate(weeks);
}

// ---- client health ---------------------------------------------------------

export interface ClientStats {
  client: Client;
  total: number;
  onTrack: number;
  atRisk: number;
  delayed: number;
  completed: number;
  onTimeRate: number;
  avgDelay: number;
  health: ClientHealth;
  enoughData: boolean;
}

export function clientHealthScore(onTime: number, delayed: number): ClientHealth {
  if (onTime >= 85 && delayed === 0) return "healthy";
  if (onTime >= 70 && delayed <= 1) return "watch";
  return "at-risk";
}

export function clientStats(clientId: string, dels: Deliverable[] = deliverables): ClientStats {
  const client = clients.find((c) => c.id === clientId)!;
  const own = dels.filter((d) => d.clientId === clientId);
  const sc = statusCounts(own);
  const finished = sc.completed + sc.delayed;
  // share of finished + on-track work that is not late
  const notLate = sc.completed + sc["on-track"];
  const considered = notLate + sc.delayed + sc["at-risk"];
  const rate = considered ? Math.round((notLate / considered) * 100) : 100;
  const delayedDelays = own.filter((d) => d.status === "delayed").map(deliverableDelay);
  return {
    client,
    total: own.length,
    onTrack: sc["on-track"],
    atRisk: sc["at-risk"],
    delayed: sc.delayed,
    completed: sc.completed,
    onTimeRate: rate,
    avgDelay: mean(delayedDelays),
    health: clientHealthScore(rate, sc.delayed),
    enoughData: own.length >= MIN_SAMPLE,
  };
}

export function allClientStats(dels: Deliverable[] = deliverables): ClientStats[] {
  return clients
    .map((c) => clientStats(c.id, dels))
    .filter((s) => s.total > 0);
}

const HEALTH_RANK: Record<ClientHealth, number> = { "at-risk": 0, watch: 1, healthy: 2 };
export function sortClientsByHealth(stats: ClientStats[]): ClientStats[] {
  return [...stats].sort(
    (a, b) => HEALTH_RANK[a.health] - HEALTH_RANK[b.health] || a.onTimeRate - b.onTimeRate,
  );
}

// ---- delay diagnostics -----------------------------------------------------

export interface StageDelay {
  stage: Stage;
  avgDelay: number;
  total: number;
  n: number;
  enoughData: boolean;
}

/** Average delay contributed by each workflow stage across all worked deliverables. */
export function delayByStage(dels: Deliverable[]): StageDelay[] {
  return STAGES.map((stage) => {
    const entries = dels
      .map((d) => d.timeline.find((t) => t.stage === stage))
      .filter((t) => t && t.status !== "pending") as { delayDays: number }[];
    const delays = entries.map((t) => t.delayDays);
    return {
      stage,
      avgDelay: mean(delays),
      total: delays.reduce((a, b) => a + b, 0),
      n: delays.length,
      enoughData: delays.length >= MIN_SAMPLE,
    };
  });
}

export interface NamedDelay {
  key: string;
  label: string;
  avgDelay: number;
  n: number;
  enoughData: boolean;
}

export function delayByClient(dels: Deliverable[]): NamedDelay[] {
  return clients
    .map((c) => {
      const own = dels.filter((d) => d.clientId === c.id && d.status === "delayed");
      return {
        key: c.id,
        label: c.name,
        avgDelay: mean(own.map(deliverableDelay)),
        n: own.length,
        enoughData: own.length >= MIN_SAMPLE,
      };
    })
    .filter((x) => x.n > 0)
    .sort((a, b) => b.avgDelay - a.avgDelay);
}

export function delayByType(dels: Deliverable[]): NamedDelay[] {
  const types = Array.from(new Set(dels.map((d) => d.type)));
  return types
    .map((t) => {
      const own = dels.filter((d) => d.type === t && d.status === "delayed");
      return {
        key: t,
        label: t,
        avgDelay: mean(own.map(deliverableDelay)),
        n: own.length,
        enoughData: own.length >= MIN_SAMPLE,
      };
    })
    .filter((x) => x.n > 0)
    .sort((a, b) => b.avgDelay - a.avgDelay);
}

// ---- at-risk forecast ------------------------------------------------------

export interface RiskForecast {
  deliverable: Deliverable;
  remainingDays: number;
  daysToDeadline: number;
  projectedOverage: number;
  reason: string;
}

/** Remaining estimated work days (in-progress stage counted at ~50%). */
export function remainingWork(d: Deliverable): number {
  return d.timeline.reduce((sum, s) => {
    if (s.status === "pending") return sum + s.estimateDays;
    if (s.status === "in-progress") return sum + Math.ceil(s.estimateDays * 0.5);
    return sum;
  }, 0);
}

export function atRiskForecast(dels: Deliverable[]): RiskForecast[] {
  return dels
    .filter((d) => d.status === "at-risk" || d.status === "delayed")
    .map((d) => {
      const remainingDays = remainingWork(d);
      const daysToDeadline = daysLeft(d.dueDate);
      const projectedOverage = remainingDays - daysToDeadline;
      const reason =
        daysToDeadline < 0
          ? `Already ${Math.abs(daysToDeadline)}d past deadline with ${remainingDays}d of work remaining.`
          : `${remainingDays}d of work remain with only ${daysToDeadline}d to deadline.`;
      return { deliverable: d, remainingDays, daysToDeadline, projectedOverage, reason };
    })
    .sort((a, b) => b.projectedOverage - a.projectedOverage);
}

// ---- distributions ---------------------------------------------------------

export function stageDistribution(dels: Deliverable[]): { stage: Stage; count: number }[] {
  const active = dels.filter((d) => d.status !== "completed" && d.status !== "not-started");
  return STAGES.map((stage) => ({
    stage,
    count: active.filter((d) => d.currentStage === stage).length,
  }));
}

export interface TypeStatusRow {
  type: DeliverableType;
  "on-track": number;
  "at-risk": number;
  delayed: number;
  completed: number;
}

export function typeStatusBreakdown(dels: Deliverable[]): TypeStatusRow[] {
  const types = Array.from(new Set(dels.map((d) => d.type)));
  return types.map((t) => {
    const sc = statusCounts(dels.filter((d) => d.type === t));
    return { type: t, "on-track": sc["on-track"], "at-risk": sc["at-risk"], delayed: sc.delayed, completed: sc.completed };
  });
}

// ---- delta helper ----------------------------------------------------------

export function delta(current: number, previous: number): { pct: number; dir: "up" | "down" | "flat" } {
  const abs = current - previous;
  const pct = previous ? (abs / previous) * 100 : 0;
  const dir = Math.abs(abs) < 0.01 ? "flat" : abs > 0 ? "up" : "down";
  return { pct, dir };
}

export function fmtPct(v: number, digits = 0): string {
  return `${v.toFixed(digits)}%`;
}

export function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function fmtMoney(v: number): string {
  return `$${(v / 1000).toFixed(0)}k`;
}