// Mock data for the Admin Deliverables (delivery business-intelligence) view.
// Everything here is portfolio / aggregate oriented — no task-level records.

export type DeliverableType = "Video" | "Static" | "Web" | "Motion";
export type DeliverableStatus =
  | "on-track"
  | "at-risk"
  | "delayed"
  | "completed"
  | "not-started";
export type ClientHealth = "healthy" | "watch" | "at-risk";

export const STAGES = ["Concept", "Production", "Editing", "Review", "Delivery"] as const;
export type Stage = (typeof STAGES)[number];

/** Reference "today" so days-remaining / days-late are deterministic in the demo. */
export const NOW = new Date("2026-06-25T00:00:00Z");

/** Baseline estimate (days) per workflow stage. */
export const STAGE_ESTIMATE: Record<Stage, number> = {
  Concept: 2,
  Production: 4,
  Editing: 5,
  Review: 3,
  Delivery: 1,
};

export interface StageEntry {
  stage: Stage;
  status: "done" | "in-progress" | "pending";
  start?: string;
  end?: string;
  estimateDays: number;
  actualDays?: number;
  /** days over estimate contributed by this stage (>= 0) */
  delayDays: number;
}

export interface Deliverable {
  id: string;
  name: string;
  clientId: string;
  type: DeliverableType;
  managerId: string;
  startDate: string;
  dueDate: string;
  completedDate?: string;
  progress: number;
  status: DeliverableStatus;
  currentStage: Stage;
  reviewLoops: number;
  timeline: StageEntry[];
}

export interface Client {
  id: string;
  name: string;
  onboardedDate: string;
  managerId: string;
  contractValue: number;
}

export interface Manager {
  id: string;
  name: string;
}

export const managers: Manager[] = [
  { id: "m1", name: "Priya Sharma" },
  { id: "m2", name: "Diego Alvarez" },
  { id: "m3", name: "Sara Klein" },
  { id: "m4", name: "Tom Becker" },
];

export const clients: Client[] = [
  { id: "c1", name: "Acme Corp", onboardedDate: "2024-02-12", managerId: "m1", contractValue: 180000 },
  { id: "c2", name: "Nova Foods", onboardedDate: "2024-06-03", managerId: "m2", contractValue: 142000 },
  { id: "c3", name: "Brightline", onboardedDate: "2024-09-21", managerId: "m3", contractValue: 96000 },
  { id: "c4", name: "Vertex Labs", onboardedDate: "2025-01-08", managerId: "m4", contractValue: 88000 },
  { id: "c5", name: "Meridian", onboardedDate: "2025-03-19", managerId: "m3", contractValue: 120000 },
  { id: "c6", name: "Lumen Studio", onboardedDate: "2026-04-30", managerId: "m1", contractValue: 64000 },
];

// ---- status presentation ---------------------------------------------------

export const STATUS_META: Record<
  DeliverableStatus,
  { label: string; colorVar: string; text: string; bg: string; dot: string }
> = {
  "on-track": {
    label: "On Track",
    colorVar: "var(--color-status-done)",
    text: "text-status-done",
    bg: "bg-status-done/10 text-status-done",
    dot: "bg-status-done",
  },
  "at-risk": {
    label: "At Risk",
    colorVar: "var(--color-status-progress)",
    text: "text-status-progress",
    bg: "bg-status-progress/10 text-status-progress",
    dot: "bg-status-progress",
  },
  delayed: {
    label: "Delayed",
    colorVar: "var(--color-status-overdue)",
    text: "text-status-overdue",
    bg: "bg-status-overdue/10 text-status-overdue",
    dot: "bg-status-overdue",
  },
  completed: {
    label: "Completed",
    colorVar: "var(--color-status-idle)",
    text: "text-status-idle",
    bg: "bg-status-idle/15 text-status-idle",
    dot: "bg-status-idle",
  },
  "not-started": {
    label: "Not Started",
    colorVar: "var(--color-muted-foreground)",
    text: "text-muted-foreground",
    bg: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

export const HEALTH_META: Record<
  ClientHealth,
  { label: string; colorVar: string; bg: string; dot: string }
> = {
  healthy: { label: "Healthy", colorVar: "var(--color-status-done)", bg: "bg-status-done/10 text-status-done", dot: "bg-status-done" },
  watch: { label: "Watch", colorVar: "var(--color-status-progress)", bg: "bg-status-progress/10 text-status-progress", dot: "bg-status-progress" },
  "at-risk": { label: "At Risk", colorVar: "var(--color-status-overdue)", bg: "bg-status-overdue/10 text-status-overdue", dot: "bg-status-overdue" },
};

// ---- timeline construction -------------------------------------------------

const DAY = 86400000;
function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY);
}
function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
/** date offset (in days) from NOW */
function off(n: number): string {
  return iso(addDays(NOW, n));
}

interface Spec {
  id: string;
  name: string;
  clientId: string;
  type: DeliverableType;
  managerId: string;
  startOff: number;
  dueOff: number;
  completedOff?: number;
  progress: number;
  status: DeliverableStatus;
  currentStage: Stage;
  reviewLoops: number;
  stageDelays?: Partial<Record<Stage, number>>;
}

function buildTimeline(spec: Spec): StageEntry[] {
  const start = addDays(NOW, spec.startOff);
  const curIdx = STAGES.indexOf(spec.currentStage);
  let cursor = new Date(start);
  return STAGES.map((stage, i) => {
    let status: StageEntry["status"];
    if (spec.status === "completed") status = "done";
    else if (spec.status === "not-started") status = "pending";
    else if (i < curIdx) status = "done";
    else if (i === curIdx) status = "in-progress";
    else status = "pending";

    const estimate = STAGE_ESTIMATE[stage];
    const delay = spec.stageDelays?.[stage] ?? 0;

    if (status === "done") {
      const actual = estimate + delay;
      const s = new Date(cursor);
      cursor = addDays(cursor, actual);
      return { stage, status, start: iso(s), end: iso(cursor), estimateDays: estimate, actualDays: actual, delayDays: delay };
    }
    if (status === "in-progress") {
      const actual = Math.max(1, Math.round((estimate + delay) * 0.6));
      const s = new Date(cursor);
      return { stage, status, start: iso(s), estimateDays: estimate, actualDays: actual, delayDays: delay };
    }
    return { stage, status, estimateDays: estimate, delayDays: 0 };
  });
}

const SPECS: Spec[] = [
  // ---- delayed (4) — concentrated in Acme & Nova, stuck in Editing/Review ----
  { id: "d01", name: "Spring Launch Video", clientId: "c1", type: "Video", managerId: "m1", startOff: -28, dueOff: -5, progress: 72, status: "delayed", currentStage: "Review", reviewLoops: 3, stageDelays: { Editing: 4, Review: 3 } },
  { id: "d02", name: "Product Demo Reel", clientId: "c1", type: "Video", managerId: "m1", startOff: -24, dueOff: -3, progress: 65, status: "delayed", currentStage: "Editing", reviewLoops: 2, stageDelays: { Production: 1, Editing: 5 } },
  { id: "d03", name: "Recipe Series — Ep.1", clientId: "c2", type: "Video", managerId: "m2", startOff: -30, dueOff: -8, progress: 80, status: "delayed", currentStage: "Review", reviewLoops: 4, stageDelays: { Editing: 3, Review: 5 } },
  { id: "d04", name: "Holiday Promo Set", clientId: "c2", type: "Static", managerId: "m2", startOff: -20, dueOff: -2, progress: 60, status: "delayed", currentStage: "Editing", reviewLoops: 1, stageDelays: { Editing: 4 } },

  // ---- at-risk (5) — due soon, behind, Editing/Review heavy ----
  { id: "d05", name: "Brand Refresh Set", clientId: "c1", type: "Static", managerId: "m1", startOff: -15, dueOff: 3, progress: 45, status: "at-risk", currentStage: "Editing", reviewLoops: 1, stageDelays: { Editing: 2 } },
  { id: "d06", name: "Social Campaign Cutdowns", clientId: "c2", type: "Video", managerId: "m2", startOff: -12, dueOff: 4, progress: 50, status: "at-risk", currentStage: "Editing", reviewLoops: 2, stageDelays: { Editing: 3 } },
  { id: "d07", name: "Explainer Video", clientId: "c3", type: "Video", managerId: "m3", startOff: -14, dueOff: 5, progress: 55, status: "at-risk", currentStage: "Review", reviewLoops: 2, stageDelays: { Review: 2 } },
  { id: "d08", name: "Web Banner Suite", clientId: "c4", type: "Static", managerId: "m4", startOff: -10, dueOff: 2, progress: 48, status: "at-risk", currentStage: "Production", reviewLoops: 0, stageDelays: { Production: 2 } },
  { id: "d09", name: "Testimonial Edit", clientId: "c1", type: "Video", managerId: "m1", startOff: -9, dueOff: 6, progress: 40, status: "at-risk", currentStage: "Editing", reviewLoops: 1, stageDelays: { Editing: 2 } },

  // ---- on-track (12) ----
  { id: "d10", name: "Q3 Sizzle Reel", clientId: "c3", type: "Video", managerId: "m3", startOff: -8, dueOff: 14, progress: 35, status: "on-track", currentStage: "Production", reviewLoops: 0 },
  { id: "d11", name: "Feature Launch Film", clientId: "c4", type: "Video", managerId: "m4", startOff: -6, dueOff: 18, progress: 30, status: "on-track", currentStage: "Concept", reviewLoops: 0 },
  { id: "d12", name: "Brand Video", clientId: "c5", type: "Video", managerId: "m3", startOff: -10, dueOff: 12, progress: 60, status: "on-track", currentStage: "Editing", reviewLoops: 1 },
  { id: "d13", name: "Static Ad Set", clientId: "c5", type: "Static", managerId: "m3", startOff: -7, dueOff: 10, progress: 55, status: "on-track", currentStage: "Review", reviewLoops: 1 },
  { id: "d14", name: "Launch Teaser", clientId: "c6", type: "Video", managerId: "m1", startOff: -5, dueOff: 20, progress: 25, status: "on-track", currentStage: "Concept", reviewLoops: 0 },
  { id: "d15", name: "Instagram Set", clientId: "c6", type: "Static", managerId: "m1", startOff: -6, dueOff: 15, progress: 45, status: "on-track", currentStage: "Production", reviewLoops: 0 },
  { id: "d16", name: "Newsletter Graphics", clientId: "c3", type: "Static", managerId: "m3", startOff: -9, dueOff: 8, progress: 70, status: "on-track", currentStage: "Review", reviewLoops: 1 },
  { id: "d17", name: "Demo Walkthrough", clientId: "c4", type: "Video", managerId: "m4", startOff: -7, dueOff: 16, progress: 40, status: "on-track", currentStage: "Production", reviewLoops: 0 },
  { id: "d18", name: "Event Recap", clientId: "c5", type: "Video", managerId: "m2", startOff: -4, dueOff: 22, progress: 20, status: "on-track", currentStage: "Concept", reviewLoops: 0 },
  { id: "d19", name: "Ad Refresh", clientId: "c6", type: "Static", managerId: "m1", startOff: -8, dueOff: 11, progress: 65, status: "on-track", currentStage: "Editing", reviewLoops: 1 },
  { id: "d20", name: "Promo Stills", clientId: "c3", type: "Static", managerId: "m3", startOff: -6, dueOff: 9, progress: 58, status: "on-track", currentStage: "Production", reviewLoops: 0 },
  { id: "d21", name: "Tutorial Series", clientId: "c5", type: "Video", managerId: "m3", startOff: -5, dueOff: 25, progress: 30, status: "on-track", currentStage: "Concept", reviewLoops: 0 },

  // ---- completed (3) — 2 on-time, 1 late ----
  { id: "d22", name: "Welcome Video", clientId: "c6", type: "Video", managerId: "m1", startOff: -40, dueOff: -20, completedOff: -22, progress: 100, status: "completed", currentStage: "Delivery", reviewLoops: 1 },
  { id: "d23", name: "Brand Guidelines Pack", clientId: "c5", type: "Static", managerId: "m3", startOff: -35, dueOff: -15, completedOff: -16, progress: 100, status: "completed", currentStage: "Delivery", reviewLoops: 1 },
  { id: "d24", name: "Launch Video", clientId: "c4", type: "Video", managerId: "m4", startOff: -38, dueOff: -12, completedOff: -10, progress: 100, status: "completed", currentStage: "Delivery", reviewLoops: 2, stageDelays: { Review: 2 } },
];

export const deliverables: Deliverable[] = SPECS.map((s) => ({
  id: s.id,
  name: s.name,
  clientId: s.clientId,
  type: s.type,
  managerId: s.managerId,
  startDate: off(s.startOff),
  dueDate: off(s.dueOff),
  completedDate: s.completedOff != null ? off(s.completedOff) : undefined,
  progress: s.progress,
  status: s.status,
  currentStage: s.currentStage,
  reviewLoops: s.reviewLoops,
  timeline: buildTimeline(s),
}));

// ---- 12 weeks of history (tells a "slipping" story) ------------------------

export interface WeekPoint {
  week: string;
  onTimeRate: number;
  started: number;
  completed: number;
  avgDelay: number;
  delayedCount: number;
}

export const history: WeekPoint[] = [
  { week: "W1", onTimeRate: 92, started: 6, completed: 6, avgDelay: 0.8, delayedCount: 1 },
  { week: "W2", onTimeRate: 90, started: 5, completed: 6, avgDelay: 1.0, delayedCount: 1 },
  { week: "W3", onTimeRate: 91, started: 7, completed: 6, avgDelay: 0.9, delayedCount: 2 },
  { week: "W4", onTimeRate: 89, started: 6, completed: 6, avgDelay: 1.2, delayedCount: 2 },
  { week: "W5", onTimeRate: 88, started: 8, completed: 7, avgDelay: 1.4, delayedCount: 3 },
  { week: "W6", onTimeRate: 87, started: 7, completed: 6, avgDelay: 1.6, delayedCount: 3 },
  { week: "W7", onTimeRate: 85, started: 9, completed: 7, avgDelay: 1.8, delayedCount: 4 },
  { week: "W8", onTimeRate: 84, started: 8, completed: 6, avgDelay: 2.0, delayedCount: 4 },
  { week: "W9", onTimeRate: 82, started: 10, completed: 7, avgDelay: 2.1, delayedCount: 5 },
  { week: "W10", onTimeRate: 80, started: 9, completed: 6, avgDelay: 2.3, delayedCount: 5 },
  { week: "W11", onTimeRate: 79, started: 11, completed: 6, avgDelay: 2.4, delayedCount: 6 },
  { week: "W12", onTimeRate: 78, started: 10, completed: 5, avgDelay: 2.6, delayedCount: 6 },
];

// ---- strategic insight cards ----------------------------------------------

export type InsightSeverity = "critical" | "warning" | "info" | "positive";
export type InsightTab = "overview" | "clients" | "deliverables" | "delays" | "trends";

export interface Insight {
  id: string;
  severity: InsightSeverity;
  title: string;
  body: string;
  tab: InsightTab;
}

export const insights: Insight[] = [
  { id: "i1", severity: "critical", title: "Video deliverables are slipping", body: "38% delivered late this month vs 12% last month — the Editing stage is the main driver.", tab: "delays" },
  { id: "i2", severity: "critical", title: "Acme Corp is your most at-risk client", body: "4 of 6 deliverables are delayed or at risk, dragging its on-time rate to 41%.", tab: "clients" },
  { id: "i3", severity: "warning", title: "Editing is the systemic bottleneck", body: "Editing adds the most average delay of any stage across the portfolio.", tab: "delays" },
  { id: "i4", severity: "warning", title: "On-time rate is below target", body: "On-time delivery fell to 78%, under the 85% target for the 4th week running.", tab: "trends" },
  { id: "i5", severity: "warning", title: "Review cycles are climbing", body: "Delayed deliverables average 3+ revision loops vs ~1 for on-track work.", tab: "delays" },
  { id: "i6", severity: "info", title: "Backlog is growing", body: "Intake is outpacing delivery — more deliverables started than completed in recent weeks.", tab: "overview" },
  { id: "i7", severity: "info", title: "Nova Foods can be stabilized", body: "At-risk but no critical delays; focused Editing support could recover it.", tab: "clients" },
  { id: "i8", severity: "positive", title: "Meridian & Lumen are healthy", body: "Both above 90% on-time with no delayed deliverables this quarter.", tab: "clients" },
];

// ---- lookups ---------------------------------------------------------------

export const managerName = (id: string) => managers.find((m) => m.id === id)?.name ?? "—";
export const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "—";
export const getClient = (id: string) => clients.find((c) => c.id === id);
export const getDeliverable = (id: string) => deliverables.find((d) => d.id === id);