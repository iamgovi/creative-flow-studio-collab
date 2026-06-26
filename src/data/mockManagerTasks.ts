// The manager's personal execution queue. Two sources are merged onto ONE board:
//   1. Self-assigned deliverable stages (source: "deliverable") — work the
//      manager took on themselves in the Deliverables window. Carries a link
//      back to that deliverable via deliverableId + context strings.
//   2. Standalone personal to-dos (source: "personal") — created via "+ New Task".
//
// This reuses the exact same MyTask shape as the employee board so the shared
// TaskBoard renders both without modification.
import type { MyTask } from "@/data/myTasks";

const day = 86400_000;
const now = Date.now();
const iso = (ms: number) => new Date(ms).toISOString();

export const initialManagerTasks: MyTask[] = [
  // --- Source 1: self-assigned deliverable stages ---
  {
    id: "mgr-d1", title: "Cut the 30s hero edit", projectId: "",
    lifecycle: "in_progress", priority: "high", deadline: iso(now + 2 * day),
    accumulatedMin: 0, runningSince: iso(now - 1 * 3600_000 - 22 * 60_000),
    comments: 2, attachments: 1, revisions: 0,
    source: "deliverable", deliverableId: "d-acme-1",
    clientName: "Acme", deliverableName: "Brand Refresh Video", stageLabel: "Edit",
  },
  {
    id: "mgr-d2", title: "Design the launch key art", projectId: "",
    lifecycle: "assigned", priority: "critical", deadline: iso(now + 4 * day),
    accumulatedMin: 0, comments: 0, attachments: 0, revisions: 0,
    source: "deliverable", deliverableId: "d-acme-3",
    clientName: "Acme", deliverableName: "Launch Key Art", stageLabel: "Concept",
  },
  {
    id: "mgr-d3", title: "Sizzle reel rough assembly", projectId: "",
    lifecycle: "review", priority: "high", deadline: iso(now + 1 * day),
    accumulatedMin: 186, comments: 3, attachments: 4, revisions: 0,
    submittedAt: iso(now - 3 * 3600_000),
    source: "deliverable", deliverableId: "d-globex-3",
    clientName: "Globex", deliverableName: "Sizzle Reel", stageLabel: "Assembly",
  },

  // --- Source 2: standalone personal to-dos ---
  {
    id: "mgr-p1", title: "Prepare Q3 team review", projectId: "",
    lifecycle: "assigned", priority: "medium", deadline: iso(now + 5 * day),
    accumulatedMin: 0, comments: 0, attachments: 0, revisions: 0, source: "personal",
  },
  {
    id: "mgr-p2", title: "Update onboarding doc", projectId: "",
    lifecycle: "revision", priority: "low", deadline: iso(now + 8 * day),
    accumulatedMin: 64, revisionNote: "Add the new PTO policy section and refresh the org chart before this goes out.",
    comments: 1, attachments: 0, revisions: 0, source: "personal",
  },
  {
    id: "mgr-p3", title: "Draft hiring plan for video team", projectId: "",
    lifecycle: "paused", priority: "high", deadline: iso(now + 3 * day),
    accumulatedMin: 95, comments: 2, attachments: 1, revisions: 0, source: "personal",
  },
  {
    id: "mgr-p4", title: "Finalize 2026 budget proposal", projectId: "",
    lifecycle: "done", priority: "medium", deadline: iso(now - 2 * day),
    accumulatedMin: 240, comments: 4, attachments: 2, revisions: 1,
    approvedBy: "Director", approvedAt: iso(now - 1 * day), source: "personal",
  },
];
