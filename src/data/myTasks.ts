// Local seed for the employee My Tasks board.
// Lifecycle is the EMPLOYEE'S relationship with a task — distinct from project stage.

export type Lifecycle =
  | "assigned"
  | "in_progress"
  | "paused"
  | "review"
  | "revision"
  | "done";

export type MyPriority = "low" | "medium" | "high" | "critical";
export type MyProjectType = "video" | "static";

export interface MyProject {
  id: string;
  name: string;
  type: MyProjectType;
  stage: string;
}

export interface MyTask {
  id: string;
  title: string;
  projectId: string;
  lifecycle: Lifecycle;
  priority: MyPriority;
  deadline: string; // ISO
  // accumulated minutes BEFORE the currently-running session
  accumulatedMin: number;
  // when the active timer started (only for in_progress)
  runningSince?: string;
  comments: number;
  attachments: number;
  revisions: number;
  // For review column
  submittedAt?: string;
  // For revision column
  revisionNote?: string;
  // For done column
  approvedBy?: string;
  approvedAt?: string;
  // ---- Manager board only (optional; employee tasks leave these unset) ----
  // Distinguishes self-assigned deliverable stages from standalone personal to-dos.
  source?: "personal" | "deliverable";
  // Deliverable-link context (only when source === "deliverable").
  deliverableId?: string;
  clientName?: string;
  deliverableName?: string;
  stageLabel?: string;
}

export const myProjects: MyProject[] = [
  { id: "pr1", name: "Brand Refresh Video", type: "video", stage: "Editing" },
  { id: "pr2", name: "Q4 Product Launch Reel", type: "video", stage: "Concept" },
  { id: "pr3", name: "Holiday Campaign Set", type: "static", stage: "Design" },
  { id: "pr4", name: "Investor Deck Redesign", type: "static", stage: "Review" },
  { id: "pr5", name: "Aurora Brand Film", type: "video", stage: "Raw Assets" },
  { id: "pr6", name: "Summer Campaign Hero", type: "static", stage: "Concept" },
  { id: "pr7", name: "Internal Culture Doc", type: "video", stage: "Planning" },
  { id: "pr8", name: "Packaging Refresh", type: "static", stage: "Revision" },
  { id: "pr9", name: "Annual Report Microsite", type: "static", stage: "Approval" },
  { id: "pr10", name: "Investor Pitch Animation", type: "video", stage: "Review" },
];

const day = 86400_000;
const now = Date.now();
const iso = (ms: number) => new Date(ms).toISOString();

export const initialMyTasks: MyTask[] = [
  // Assigned (5)
  { id: "mt1", title: "Storyboard the opening teaser", projectId: "pr1", lifecycle: "assigned", priority: "high", deadline: iso(now + 3 * day), accumulatedMin: 0, comments: 1, attachments: 0, revisions: 0 },
  { id: "mt2", title: "Color reference moodboard", projectId: "pr2", lifecycle: "assigned", priority: "medium", deadline: iso(now + 6 * day), accumulatedMin: 0, comments: 0, attachments: 2, revisions: 0 },
  { id: "mt3", title: "Source stock B-roll selects", projectId: "pr1", lifecycle: "assigned", priority: "low", deadline: iso(now + 10 * day), accumulatedMin: 0, comments: 0, attachments: 0, revisions: 0 },
  { id: "mt4", title: "Holiday hero key visual concepts", projectId: "pr3", lifecycle: "assigned", priority: "critical", deadline: iso(now - 1 * day), accumulatedMin: 0, comments: 3, attachments: 1, revisions: 0 },
  { id: "mt5", title: "Investor deck cover options", projectId: "pr4", lifecycle: "assigned", priority: "medium", deadline: iso(now + 2 * day), accumulatedMin: 0, comments: 0, attachments: 0, revisions: 0 },

  // In Progress (1) — ~2h elapsed
  { id: "mt6", title: "Editing — Act II tightening pass", projectId: "pr1", lifecycle: "in_progress", priority: "high", deadline: iso(now + 1 * day), accumulatedMin: 0, runningSince: iso(now - 2 * 3600_000 - 14 * 60_000), comments: 5, attachments: 3, revisions: 0 },

  // Paused (2)
  { id: "mt7", title: "Title card animation", projectId: "pr2", lifecycle: "paused", priority: "medium", deadline: iso(now + 4 * day), accumulatedMin: 105, comments: 2, attachments: 1, revisions: 0 },
  { id: "mt8", title: "Social cuts — 9:16 versions", projectId: "pr1", lifecycle: "paused", priority: "low", deadline: iso(now + 8 * day), accumulatedMin: 42, comments: 0, attachments: 0, revisions: 0 },

  // Ready for Review (3)
  { id: "mt9", title: "Holiday social pack v1", projectId: "pr3", lifecycle: "review", priority: "high", deadline: iso(now + 1 * day), accumulatedMin: 263, comments: 4, attachments: 6, revisions: 0, submittedAt: iso(now - 2 * 3600_000) },
  { id: "mt10", title: "Investor deck — sections 1–3", projectId: "pr4", lifecycle: "review", priority: "critical", deadline: iso(now + 0.5 * day), accumulatedMin: 410, comments: 7, attachments: 1, revisions: 0, submittedAt: iso(now - 5 * 3600_000) },
  { id: "mt11", title: "Logo lockup variants", projectId: "pr3", lifecycle: "review", priority: "medium", deadline: iso(now + 5 * day), accumulatedMin: 88, comments: 1, attachments: 4, revisions: 0, submittedAt: iso(now - 26 * 3600_000) },

  // Revision Requested (2)
  { id: "mt12", title: "Product launch reel — first cut", projectId: "pr2", lifecycle: "revision", priority: "high", deadline: iso(now - 0.5 * day), accumulatedMin: 320, comments: 9, attachments: 2, revisions: 1, revisionNote: "The pacing in the first 20 seconds drags. Tighten the intro by ~4s and swap the second B-roll shot — it doesn't match the brand palette. Otherwise great work!" },
  { id: "mt13", title: "Packaging mockup — front panel", projectId: "pr3", lifecycle: "revision", priority: "medium", deadline: iso(now + 2 * day), accumulatedMin: 145, comments: 3, attachments: 5, revisions: 2, revisionNote: "Logo placement needs to shift up 8px and the tagline should use the secondary font weight. See annotated PDF in attachments." },

  // Completed (5)
  { id: "mt14", title: "Brand bible — typography page", projectId: "pr3", lifecycle: "done", priority: "low", deadline: iso(now - 4 * day), accumulatedMin: 180, comments: 2, attachments: 3, revisions: 0, approvedBy: "Sofia Romero", approvedAt: iso(now - 2 * day) },
  { id: "mt15", title: "Audio mix — promo cut", projectId: "pr1", lifecycle: "done", priority: "medium", deadline: iso(now - 7 * day), accumulatedMin: 240, comments: 6, attachments: 2, revisions: 1, approvedBy: "Sofia Romero", approvedAt: iso(now - 5 * day) },
  { id: "mt16", title: "Thumbnail set for YouTube", projectId: "pr2", lifecycle: "done", priority: "low", deadline: iso(now - 9 * day), accumulatedMin: 120, comments: 1, attachments: 8, revisions: 0, approvedBy: "Theo Park", approvedAt: iso(now - 6 * day) },
  { id: "mt17", title: "Caption/subtitle pass", projectId: "pr1", lifecycle: "done", priority: "medium", deadline: iso(now - 12 * day), accumulatedMin: 95, comments: 0, attachments: 1, revisions: 0, approvedBy: "Theo Park", approvedAt: iso(now - 10 * day) },
  { id: "mt18", title: "Investor deck — appendix layouts", projectId: "pr4", lifecycle: "done", priority: "high", deadline: iso(now - 14 * day), accumulatedMin: 360, comments: 4, attachments: 2, revisions: 2, approvedBy: "Sofia Romero", approvedAt: iso(now - 11 * day) },
];

export const LIFECYCLE_ORDER: Lifecycle[] = [
  "assigned", "in_progress", "paused", "review", "revision", "done",
];

export const LIFECYCLE_LABEL: Record<Lifecycle, string> = {
  assigned: "Assigned",
  in_progress: "In Progress",
  paused: "Paused",
  review: "Ready for Review",
  revision: "Revision Requested",
  done: "Completed",
};

// Legal drag transitions (from -> set of allowed to-columns)
export const LEGAL_TRANSITIONS: Record<Lifecycle, Lifecycle[]> = {
  assigned: ["in_progress"],
  in_progress: ["paused", "review"],
  paused: ["in_progress"],
  review: [],
  revision: ["in_progress"],
  done: [],
};
