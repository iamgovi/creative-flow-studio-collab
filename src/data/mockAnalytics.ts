import { team, type Teammate } from "./mockSetup";

export type { Teammate } from "./mockSetup";
export { team } from "./mockSetup";

// ---------------------------------------------------------------------------
// Deterministic mock analytics data.
// IMPORTANT: everything here is derived from a FIXED reference date and seeded
// pseudo-random numbers so SSR and client render identically (no hydration
// mismatch, no Date.now()/Math.random() at module scope).
// ---------------------------------------------------------------------------

/** Fixed "today" used across the analytics surface. */
export const REFERENCE_DATE = new Date("2026-06-24T09:00:00Z");
export const DAY_MS = 86_400_000;
export const ANALYTICS_DAYS = 30;
export const SHIFT_START_MIN = 9 * 60; // 09:00 expected start
export const WEEKLY_CAPACITY = 40;

/** Deterministic seeded RNG (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Per-member narrative archetype so the data tells a coherent story. */
export type Archetype =
  | "excellent" // Aria — consistently great, benchmark
  | "overloaded" // Maya — > 100% capacity, long hours
  | "overcapacity" // Kai — over allocated
  | "declining" // Noah — productivity trending down
  | "late" // Jin — frequently late starts
  | "revisions" // Olivia — high revision rate
  | "steady"; // everyone else

export const MEMBER_ARCHETYPE: Record<string, Archetype> = {
  tm1: "excellent", // Aria Patel
  tm2: "declining", // Noah Chen
  tm3: "overloaded", // Maya Romero
  tm4: "late", // Jin Okafor
  tm5: "revisions", // Olivia Lindqvist
  tm6: "overcapacity", // Kai Müller
  tm7: "steady", // Zara Hassan
  tm8: "steady", // Theo Park
};

export interface DailyRollup {
  date: string; // ISO date (YYYY-MM-DD)
  dayIndex: number; // 0..29 (29 = most recent)
  weekday: number; // 0 Sun .. 6 Sat
  isWorkingDay: boolean;
  present: boolean;
  partial: boolean; // present but < 4h
  productiveSec: number;
  attendanceSec: number; // total logged presence
  idleSec: number;
  breakSec: number;
  reworkSec: number;
  elapsedSec: number; // wall-clock span of work
  tasksCompleted: number;
  revisions: number;
  firstPass: number; // tasks approved first pass
  startMin: number | null; // minutes-from-midnight of first login
  endMin: number | null;
}

export interface MemberAnalytics {
  member: Teammate;
  archetype: Archetype;
  rollups: DailyRollup[];
}

function buildRollups(member: Teammate, archetype: Archetype): DailyRollup[] {
  const rand = rng(hashStr(member.id) ^ 0x9e3779b9);
  const rollups: DailyRollup[] = [];
  for (let i = 0; i < ANALYTICS_DAYS; i++) {
    const dayIndex = i;
    const date = new Date(REFERENCE_DATE.getTime() - (ANALYTICS_DAYS - 1 - i) * DAY_MS);
    const weekday = date.getUTCDay();
    const isWorkingDay = weekday !== 0 && weekday !== 6;
    const progress = i / (ANALYTICS_DAYS - 1); // 0..1 across window

    // --- attendance ---
    let present = isWorkingDay;
    let partial = false;
    // sprinkle absences/partials deterministically
    if (isWorkingDay) {
      const r = rand();
      if (archetype === "late" && r < 0.08) present = false;
      else if (r < 0.04) present = false;
      else if (r < 0.12) partial = true;
    }

    // --- start time / punctuality ---
    let startMin: number | null = null;
    let endMin: number | null = null;
    if (present) {
      let base = SHIFT_START_MIN - 4 + Math.floor(rand() * 16); // ~08:56–09:12
      if (archetype === "late") base = SHIFT_START_MIN + 8 + Math.floor(rand() * 35);
      if (archetype === "overloaded") base = SHIFT_START_MIN - 18 + Math.floor(rand() * 10);
      startMin = base;
    }

    // --- effort ---
    // baseline productive hours
    let prodHours = partial ? 2 + rand() * 1.5 : 6 + rand() * 1.8;
    let idleHours = 0.6 + rand() * 0.9;
    let breakHours = 0.5 + rand() * 0.5;
    let reworkHours = rand() * 0.8;

    switch (archetype) {
      case "excellent":
        prodHours = partial ? 3 : 6.6 + rand() * 1.0;
        idleHours = 0.3 + rand() * 0.4;
        reworkHours = rand() * 0.3;
        break;
      case "overloaded":
      case "overcapacity":
        prodHours = partial ? 3.5 : 8.2 + rand() * 1.6; // long hours
        idleHours = 0.4 + rand() * 0.4;
        reworkHours = rand() * 0.7;
        break;
      case "declining":
        // productivity erodes across the window
        prodHours = partial ? 2.5 : 7.2 - progress * 2.6 + rand() * 0.8;
        idleHours = 0.6 + progress * 1.2 + rand() * 0.6;
        break;
      case "revisions":
        reworkHours = 1.4 + rand() * 1.6; // lots of rework
        prodHours = partial ? 2.5 : 5.8 + rand() * 1.4;
        break;
      case "late":
        prodHours = partial ? 2.2 : 5.6 + rand() * 1.6;
        break;
    }

    if (!present) {
      prodHours = idleHours = breakHours = reworkHours = 0;
    } else {
      endMin = (startMin ?? SHIFT_START_MIN) + Math.round((prodHours + idleHours + breakHours) * 60);
    }

    const productiveSec = Math.round(prodHours * 3600);
    const idleSec = Math.round(idleHours * 3600);
    const breakSec = Math.round(breakHours * 3600);
    const reworkSec = Math.round(reworkHours * 3600);
    const attendanceSec = productiveSec + idleSec + breakSec + reworkSec;
    const elapsedSec = present ? Math.round(attendanceSec * (1.15 + rand() * 0.5)) : 0;

    // --- output ---
    let tasksCompleted = present && !partial ? 1 + Math.floor(rand() * 3) : present ? 1 : 0;
    if (archetype === "declining") tasksCompleted = present ? Math.max(0, Math.round((1 + rand() * 2) * (1 - progress * 0.6))) : 0;
    let revisions = 0;
    let firstPass = tasksCompleted;
    if (tasksCompleted > 0) {
      let revRate = 0.18;
      if (archetype === "revisions") revRate = 0.55;
      else if (archetype === "excellent") revRate = 0.06;
      else if (archetype === "declining") revRate = 0.2 + progress * 0.25;
      const revised = Math.round(tasksCompleted * revRate + (rand() < (revRate % 1) ? 1 : 0));
      revisions = Math.min(tasksCompleted, revised);
      firstPass = tasksCompleted - revisions;
    }

    rollups.push({
      date: date.toISOString().slice(0, 10),
      dayIndex,
      weekday,
      isWorkingDay,
      present,
      partial,
      productiveSec,
      attendanceSec,
      idleSec,
      breakSec,
      reworkSec,
      elapsedSec,
      tasksCompleted,
      revisions,
      firstPass,
      startMin,
      endMin,
    });
  }
  return rollups;
}

export const memberAnalytics: MemberAnalytics[] = team.map((m) => ({
  member: m,
  archetype: MEMBER_ARCHETYPE[m.id] ?? "steady",
  rollups: buildRollups(m, MEMBER_ARCHETYPE[m.id] ?? "steady"),
}));

export function getMemberAnalytics(id: string): MemberAnalytics | undefined {
  return memberAnalytics.find((m) => m.member.id === id);
}

// ---------------------------------------------------------------------------
// Per-stage time samples (drives the Time & Effort heat-table).
// avgSec = average hands-on work time for that member on that stage.
// n = number of tasks sampled (n < 3 => "not enough data").
// ---------------------------------------------------------------------------

export const STAGES = ["Planning", "Concept", "Editing", "Review", "Corrections", "Delivery"] as const;
export type Stage = (typeof STAGES)[number];

export interface StageSample {
  avgSec: number;
  medianSec: number;
  n: number;
}

/** Team baseline average minutes per stage (the comparison point). */
const STAGE_BASE_MIN: Record<Stage, number> = {
  Planning: 90,
  Concept: 150,
  Editing: 240,
  Review: 60,
  Corrections: 120,
  Delivery: 45,
};

function buildStageSamples(member: Teammate, archetype: Archetype): Record<Stage, StageSample> {
  const rand = rng(hashStr(member.id + "stage"));
  const out = {} as Record<Stage, StageSample>;
  for (const stage of STAGES) {
    const base = STAGE_BASE_MIN[stage];
    let factor = 0.82 + rand() * 0.4; // 0.82–1.22 of team base
    // story: Maya (overloaded/editor) slow on Editing; Aria fast everywhere
    if (archetype === "excellent") factor = 0.6 + rand() * 0.18;
    if (archetype === "overloaded" && stage === "Editing") factor = 2.1 + rand() * 0.4;
    if (archetype === "revisions" && (stage === "Concept" || stage === "Corrections")) factor = 1.5 + rand() * 0.4;
    if (archetype === "declining" && stage === "Editing") factor = 1.3 + rand() * 0.3;

    // sample size — some members don't touch some stages enough (n<3)
    let n = 3 + Math.floor(rand() * 8);
    if ((member.role === "Analyst" || member.role === "Copywriter") && (stage === "Editing" || stage === "Delivery"))
      n = Math.floor(rand() * 3); // likely < 3
    if (member.role === "Designer" && stage === "Corrections") n = Math.floor(rand() * 3);

    const avgSec = Math.round(base * factor * 60);
    const medianSec = Math.round(avgSec * (0.9 + rand() * 0.12));
    out[stage] = { avgSec, medianSec, n };
  }
  return out;
}

export const stageSamplesByMember: Record<string, Record<Stage, StageSample>> = Object.fromEntries(
  team.map((m) => [m.id, buildStageSamples(m, MEMBER_ARCHETYPE[m.id] ?? "steady")]),
);

// ---------------------------------------------------------------------------
// Recent tasks per member (work time vs elapsed time visualization).
// ---------------------------------------------------------------------------

export interface RecentTask {
  id: string;
  title: string;
  stage: Stage;
  workSec: number;
  elapsedSec: number;
  status: "done" | "in_progress" | "at_risk" | "overdue";
  project: string;
  cycleSec: number;
}

const TASK_TITLES = [
  "Hero cut v2",
  "Social cutdowns",
  "Title sequence",
  "Color pass",
  "Key visual",
  "Storyboard",
  "Caption pack",
  "Motion teaser",
  "Thumbnail set",
  "Brief review",
];
const PROJECTS = ["Aurora Brand Film", "Q1 Launch Reel", "Spring Campaign", "Annual Report", "Investor Pitch"];

function buildRecentTasks(member: Teammate, archetype: Archetype): RecentTask[] {
  const rand = rng(hashStr(member.id + "tasks"));
  const count = 6;
  return Array.from({ length: count }, (_, i) => {
    const stage = STAGES[Math.floor(rand() * STAGES.length)];
    let workH = 1.5 + rand() * 5;
    if (archetype === "overloaded" && stage === "Editing") workH *= 1.8;
    const workSec = Math.round(workH * 3600);
    // elapsed >> work for waiting-heavy tasks (esp. Review)
    const waitFactor = stage === "Review" ? 3 + rand() * 4 : 1.3 + rand() * 1.8;
    const elapsedSec = Math.round(workSec * waitFactor);
    const cycleSec = elapsedSec;
    let status: RecentTask["status"] = "done";
    if (i === 0 && (archetype === "overloaded" || archetype === "late")) status = "overdue";
    else if (i === 1 && (archetype === "overloaded" || archetype === "declining")) status = "at_risk";
    else if (i < 2) status = "in_progress";
    return {
      id: `${member.id}-rt${i}`,
      title: TASK_TITLES[(hashStr(member.id) + i) % TASK_TITLES.length],
      stage,
      workSec,
      elapsedSec,
      status,
      project: PROJECTS[(hashStr(member.id) + i) % PROJECTS.length],
      cycleSec,
    };
  });
}

export const recentTasksByMember: Record<string, RecentTask[]> = Object.fromEntries(
  team.map((m) => [m.id, buildRecentTasks(m, MEMBER_ARCHETYPE[m.id] ?? "steady")]),
);

// ---------------------------------------------------------------------------
// Live presence (timer-updated in the UI, seeded here for stable SSR).
// ---------------------------------------------------------------------------

export type PresenceState = "working" | "online" | "idle" | "offline";

export interface Presence {
  memberId: string;
  state: PresenceState;
  currentTask: string | null;
  onlineForMin: number; // for working/online/idle
  lastSeenMin: number; // for offline/idle
}

export const presence: Presence[] = team.map((m, i) => {
  const arch = MEMBER_ARCHETYPE[m.id] ?? "steady";
  let state: PresenceState = (["working", "working", "online", "idle", "offline"] as PresenceState[])[i % 5];
  if (arch === "overloaded" || arch === "excellent") state = "working";
  if (arch === "late" && i % 2 === 0) state = "offline";
  const taskList = recentTasksByMember[m.id];
  return {
    memberId: m.id,
    state,
    currentTask: state === "working" ? taskList[0]?.title ?? null : null,
    onlineForMin: 30 + ((hashStr(m.id) % 280)),
    lastSeenMin: 20 + ((hashStr(m.id) % 240)),
  };
});

// ---------------------------------------------------------------------------
// Current-week workload / utilization (for Workload tab + Overview).
// allocated comes from mockSetup; we add upcoming-week projections.
// ---------------------------------------------------------------------------

export interface WorkloadWeek {
  memberId: string;
  weeks: number[]; // utilization ratio per upcoming week (allocated/capacity)
}

export const workloadWeeks: WorkloadWeek[] = team.map((m) => {
  const rand = rng(hashStr(m.id + "wk"));
  const arch = MEMBER_ARCHETYPE[m.id] ?? "steady";
  const baseUtil = m.allocated / m.capacity;
  const weeks = Array.from({ length: 4 }, () => {
    let u = baseUtil + (rand() - 0.5) * 0.2;
    if (arch === "overloaded" || arch === "overcapacity") u = 1.05 + rand() * 0.18;
    if (arch === "steady" && m.id === "tm5") u = 0.5 + rand() * 0.1;
    return Math.max(0.3, Math.min(1.35, u));
  });
  return { memberId: m.id, weeks };
});

// underloaded member for rebalancing story (Olivia tm5 has lowest allocation)
export const UNDERLOADED_ID = "tm5";
export const OVERLOADED_ID = "tm3";

// ---------------------------------------------------------------------------
// Overdue & at-risk tasks (Workload tab).
// ---------------------------------------------------------------------------

export interface FlaggedTask {
  id: string;
  memberId: string;
  title: string;
  project: string;
  kind: "overdue" | "at_risk";
  detail: string;
}

export const flaggedTasks: FlaggedTask[] = [
  { id: "f1", memberId: "tm3", title: "Aurora hero fine cut", project: "Aurora Brand Film", kind: "overdue", detail: "2 days past deadline" },
  { id: "f2", memberId: "tm6", title: "Investor pitch animation", project: "Investor Pitch", kind: "overdue", detail: "1 day past deadline" },
  { id: "f3", memberId: "tm3", title: "Social cutdowns x6", project: "Aurora Brand Film", kind: "at_risk", detail: "12h work left, 8h before due" },
  { id: "f4", memberId: "tm2", title: "Color grade pass", project: "Q1 Launch Reel", kind: "at_risk", detail: "Behind current pace" },
  { id: "f5", memberId: "tm4", title: "Spring key visual", project: "Spring Campaign", kind: "at_risk", detail: "Late start, tight window" },
];

// ---------------------------------------------------------------------------
// Pre-written insight cards (Insights tab + Overview top insights).
// ---------------------------------------------------------------------------

export type InsightCategory =
  | "strength"
  | "growth"
  | "wellbeing"
  | "bottleneck"
  | "trend"
  | "anomaly";

export type InsightSeverity = "positive" | "caution" | "problem" | "neutral";

export interface Insight {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  memberId: string | null;
  statement: string;
  miniStat: string;
  action: string;
  actionTo?: string; // member id for drill-down
  why: string;
  priority: number; // for "top insights"
}

export const insights: Insight[] = [
  {
    id: "i1",
    category: "strength",
    severity: "positive",
    memberId: "tm1",
    statement: "Aria Patel's first-pass rate (94%) is the team's best — consider her work as a benchmark or pair her with others on Editing.",
    miniStat: "94% first-pass · 0.3 avg revision loops",
    action: "View Aria",
    actionTo: "tm1",
    why: "Flagged because first-pass rate is > 1.5 standard deviations above the team mean across 20+ completed tasks.",
    priority: 3,
  },
  {
    id: "i2",
    category: "growth",
    severity: "caution",
    memberId: "tm3",
    statement: "Maya Romero's Editing tasks take 2.3× the team average with a higher revision rate — a training or pairing opportunity, not a red flag.",
    miniStat: "Editing avg 9.2h vs team 4.0h · n = 8",
    action: "Suggest pairing",
    actionTo: "tm3",
    why: "Flagged because work time on Editing is > 2 standard deviations above the team average across 6+ tasks.",
    priority: 9,
  },
  {
    id: "i3",
    category: "wellbeing",
    severity: "caution",
    memberId: "tm3",
    statement: "Maya Romero has been over 100% capacity for 2 weeks and averaging 9.8h/day — consider redistributing her load.",
    miniStat: "118% utilization · 9.8h/day avg",
    action: "Rebalance load",
    actionTo: "tm3",
    why: "Flagged because utilization stayed above 100% for 10+ consecutive working days. Surfaced as a wellbeing signal, not a productivity win.",
    priority: 10,
  },
  {
    id: "i4",
    category: "wellbeing",
    severity: "caution",
    memberId: "tm6",
    statement: "Kai Müller is allocated above capacity this week and logging long hours — check in before assigning more.",
    miniStat: "110% utilization · 44h allocated",
    action: "Rebalance load",
    actionTo: "tm6",
    why: "Flagged because allocated hours exceed weekly capacity (40h). Supportive signal, not a target.",
    priority: 7,
  },
  {
    id: "i5",
    category: "bottleneck",
    severity: "neutral",
    memberId: null,
    statement: "The Review stage is 1.8× slower than any other stage — most dwell time is review-waiting, not hands-on work.",
    miniStat: "Avg elapsed 4.2h vs work 1.1h",
    action: "View stage",
    why: "Flagged because elapsed-to-work ratio for the Review stage is the highest across all stages.",
    priority: 8,
  },
  {
    id: "i6",
    category: "trend",
    severity: "problem",
    memberId: "tm2",
    statement: "Noah Chen's productivity dropped 28% over 3 weeks — worth a supportive check-in.",
    miniStat: "Productivity 72% → 52%",
    action: "View Noah",
    actionTo: "tm2",
    why: "Flagged because productivity ratio fell more than 25% across a 3-week rolling window.",
    priority: 9,
  },
  {
    id: "i7",
    category: "growth",
    severity: "caution",
    memberId: "tm5",
    statement: "Olivia Lindqvist's work bounces back in revisions more often than the team — clearer briefs may help.",
    miniStat: "Revision rate 55% vs team 18%",
    action: "View Olivia",
    actionTo: "tm5",
    why: "Flagged because revision rate is > 2 standard deviations above the team mean. Could be a brief-clarity issue rather than execution.",
    priority: 6,
  },
  {
    id: "i8",
    category: "strength",
    severity: "positive",
    memberId: "tm1",
    statement: "Aria Patel sits comfortably inside the healthy productivity band (72%) — a good model of sustainable pace.",
    miniStat: "72% productivity (band 55–80%)",
    action: "View Aria",
    actionTo: "tm1",
    why: "Flagged because productivity is within the healthy 55–80% band with stable hours — neither under- nor over-working.",
    priority: 4,
  },
  {
    id: "i9",
    category: "anomaly",
    severity: "neutral",
    memberId: "tm4",
    statement: "Jin Okafor's average start time drifted ~30 min later over the period — surfaced neutrally for context.",
    miniStat: "Avg start 09:31 vs shift 09:00",
    action: "View Jin",
    actionTo: "tm4",
    why: "Flagged because average start time is a statistical outlier (z-score > 2) versus the team's punctuality distribution.",
    priority: 5,
  },
  {
    id: "i10",
    category: "bottleneck",
    severity: "neutral",
    memberId: null,
    statement: "Corrections generate the most revision loops across the team — often a sign of brief ambiguity upstream.",
    miniStat: "42% of all revision loops",
    action: "View stage",
    why: "Flagged because the Corrections stage accounts for the largest share of revision loops in the period.",
    priority: 6,
  },
  {
    id: "i11",
    category: "trend",
    severity: "positive",
    memberId: null,
    statement: "Team on-time delivery improved 6 points vs the previous period — momentum worth acknowledging.",
    miniStat: "On-time 81% (+6 pts)",
    action: "View trend",
    why: "Flagged because on-time delivery rate rose by more than 5 points versus the prior equivalent window.",
    priority: 4,
  },
];

export const PROJECT_OPTIONS = PROJECTS;

// ---------------------------------------------------------------------------
// Month-on-month project time per member.
// For each of the last N months we list every project the person worked on
// and the total hands-on hours they logged against it. Deterministic so SSR
// and client render identically.
// ---------------------------------------------------------------------------

/** Wider project pool so each person's month looks varied but coherent. */
const PROJECT_POOL = [
  "Aurora Brand Film",
  "Q1 Launch Reel",
  "Spring Campaign",
  "Annual Report",
  "Investor Pitch",
  "Northwind Keynote",
  "Lumen Social Pack",
  "Halo Product Demo",
  "Vertex Sizzle",
  "Onboarding Series",
  "Brand Refresh",
  "Holiday Promo",
] as const;

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface MonthProjectEntry {
  project: string;
  hours: number;
}

export interface MemberMonth {
  monthKey: string; // YYYY-MM
  label: string; // "June 2026"
  totalHours: number;
  projects: MonthProjectEntry[]; // sorted desc by hours
  partial?: boolean; // true when only part of the month falls inside the window
}

export const MONTHS_BACK = 6;

function buildMonthlyProjectTime(member: Teammate, archetype: Archetype): MemberMonth[] {
  const rand = rng(hashStr(member.id + "monthproj"));
  const months: MemberMonth[] = [];
  const refYear = REFERENCE_DATE.getUTCFullYear();
  const refMonth = REFERENCE_DATE.getUTCMonth(); // 0-based

  for (let back = MONTHS_BACK - 1; back >= 0; back--) {
    const d = new Date(Date.UTC(refYear, refMonth - back, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const monthKey = `${y}-${String(m + 1).padStart(2, "0")}`;

    // Roughly a working month of capacity, biased by archetype.
    let monthTarget = member.capacity * 4 * (0.78 + rand() * 0.22); // ~capacity*4 weeks
    if (archetype === "overloaded" || archetype === "overcapacity") monthTarget *= 1.18;
    if (archetype === "declining") monthTarget *= 1 - back * 0.04; // erodes toward recent months

    // 2–4 projects this month.
    const projectCount = 2 + Math.floor(rand() * 3);
    const startIdx = hashStr(member.id + monthKey) % PROJECT_POOL.length;
    const chosen: string[] = [];
    for (let i = 0; i < projectCount; i++) {
      chosen.push(PROJECT_POOL[(startIdx + i * 3 + Math.floor(rand() * 2)) % PROJECT_POOL.length]);
    }
    const uniqueProjects = Array.from(new Set(chosen));

    // Split the month's hours across projects with random weights.
    const weights = uniqueProjects.map(() => 0.5 + rand());
    const weightSum = weights.reduce((s, w) => s + w, 0);
    const projects: MonthProjectEntry[] = uniqueProjects
      .map((project, i) => ({
        project,
        hours: Math.max(2, Math.round((monthTarget * weights[i]) / weightSum)),
      }))
      .sort((a, b) => b.hours - a.hours);

    const totalHours = projects.reduce((s, p) => s + p.hours, 0);
    months.push({ monthKey, label: `${MONTH_LABELS[m]} ${y}`, totalHours, projects });
  }
  return months;
}

export const monthlyProjectTimeByMember: Record<string, MemberMonth[]> = Object.fromEntries(
  team.map((m) => [m.id, buildMonthlyProjectTime(m, MEMBER_ARCHETYPE[m.id] ?? "steady")]),
);

/**
 * Scope a member's monthly project time to the selected date-range window
 * (the same `days` the top filter uses). Months fully inside the window keep
 * their hours; a month that only partially overlaps is prorated by the share
 * of its days that fall inside the window, and flagged `partial`.
 */
export function windowMonthlyProjectTime(memberId: string, days: number): MemberMonth[] {
  const months = monthlyProjectTimeByMember[memberId] ?? [];
  const refMs = REFERENCE_DATE.getTime();
  const windowStart = refMs - days * DAY_MS;
  const out: MemberMonth[] = [];

  for (const month of months) {
    const [y, mm] = month.monthKey.split("-").map(Number);
    const monthStart = Date.UTC(y, mm - 1, 1);
    const daysInMonth = new Date(Date.UTC(y, mm, 0)).getUTCDate();
    const monthLastDayMs = Date.UTC(y, mm - 1, daysInMonth);

    const overlapStart = Math.max(monthStart, windowStart);
    const overlapEnd = Math.min(monthLastDayMs, refMs);
    if (overlapEnd < overlapStart) continue; // month is entirely outside the window

    const overlapDays = Math.floor((overlapEnd - overlapStart) / DAY_MS) + 1;
    const elapsedDays = Math.floor((Math.min(monthLastDayMs, refMs) - monthStart) / DAY_MS) + 1;
    const fraction = Math.min(1, overlapDays / elapsedDays);
    if (fraction <= 0) continue;

    const projects = month.projects
      .map((p) => ({ project: p.project, hours: Math.max(1, Math.round(p.hours * fraction)) }))
      .sort((a, b) => b.hours - a.hours);
    const totalHours = projects.reduce((s, p) => s + p.hours, 0);
    out.push({ ...month, totalHours, projects, partial: fraction < 0.999 });
  }
  return out;
}

/** Stable color per project for charts/legends. */
const PROJECT_COLOR_VARS = [
  "var(--color-status-done)",
  "var(--color-status-progress)",
  "var(--color-status-review)",
  "var(--color-status-idle)",
  "var(--color-status-overdue)",
  "var(--color-primary)",
];

export function projectColor(project: string): string {
  return PROJECT_COLOR_VARS[hashStr(project) % PROJECT_COLOR_VARS.length];
}