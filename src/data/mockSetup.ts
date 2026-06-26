import type { Priority, ProjectType } from "./mock";

export type SetupTaskStatus = "draft" | "ready";

export interface Teammate {
  id: string;
  name: string;
  role:
    | "Editor"
    | "Senior Editor"
    | "Designer"
    | "Motion"
    | "Analyst"
    | "Copywriter";
  avatar: string;
  capacity: number; // hours/week
  allocated: number; // currently allocated hours (other projects)
}

export interface IncomingProject {
  id: string;
  name: string;
  type: ProjectType;
  client: string;
  requestedBy: { name: string; avatar: string };
  receivedAt: string;
  deadline: string;
  priority: Priority;
  description: string;
  tags: string[];
  budgetHours: number;
  referenceFiles: { name: string; size: string }[];
}

export interface SetupTask {
  id: string;
  stage: string;
  title: string;
  description: string;
  hours: number;
  priority: Priority;
  deadline: string; // iso
  assigneeId: string | null;
}

export const VIDEO_WORKFLOW = [
  "Request Received",
  "Planning",
  "Concept/Script",
  "Raw Assets",
  "Editing",
  "Review",
  "Corrections",
  "Approval",
  "Delivered",
];

export const STATIC_WORKFLOW = [
  "Request Received",
  "Concept",
  "Design",
  "Review",
  "Revision",
  "Approval",
  "Delivered",
];

// role -> stage compatibility
export const SKILL_MATRIX: Record<Teammate["role"], Record<string, "perfect" | "possible" | "unlikely">> = {
  "Senior Editor": {
    "Editing": "perfect", "Review": "perfect", "Corrections": "perfect",
    "Planning": "possible", "Concept/Script": "possible", "Approval": "possible",
  },
  Editor: {
    "Editing": "perfect", "Raw Assets": "perfect", "Corrections": "perfect",
    "Review": "possible",
  },
  Designer: {
    "Design": "perfect", "Concept": "perfect", "Revision": "perfect",
    "Review": "possible", "Raw Assets": "possible",
  },
  Motion: {
    "Editing": "perfect", "Concept/Script": "perfect", "Design": "possible",
  },
  Copywriter: {
    "Concept/Script": "perfect", "Concept": "perfect", "Planning": "perfect",
  },
  Analyst: {
    "Planning": "perfect", "Approval": "possible", "Review": "possible",
  },
};

export const team: Teammate[] = [
  { id: "tm1", name: "Aria Patel", role: "Senior Editor", avatar: "https://i.pravatar.cc/120?img=1", capacity: 40, allocated: 32 },
  { id: "tm2", name: "Noah Chen", role: "Editor", avatar: "https://i.pravatar.cc/120?img=2", capacity: 40, allocated: 20 },
  { id: "tm3", name: "Maya Romero", role: "Editor", avatar: "https://i.pravatar.cc/120?img=3", capacity: 40, allocated: 38 },
  { id: "tm4", name: "Jin Okafor", role: "Designer", avatar: "https://i.pravatar.cc/120?img=4", capacity: 40, allocated: 28 },
  { id: "tm5", name: "Olivia Lindqvist", role: "Designer", avatar: "https://i.pravatar.cc/120?img=5", capacity: 40, allocated: 18 },
  { id: "tm6", name: "Kai Müller", role: "Motion", avatar: "https://i.pravatar.cc/120?img=6", capacity: 40, allocated: 44 },
  { id: "tm7", name: "Zara Hassan", role: "Analyst", avatar: "https://i.pravatar.cc/120?img=7", capacity: 40, allocated: 22 },
  { id: "tm8", name: "Theo Park", role: "Copywriter", avatar: "https://i.pravatar.cc/120?img=8", capacity: 40, allocated: 25 },
];

const now = Date.now();
const day = 86400_000;

export const incomingProjects: IncomingProject[] = [
  {
    id: "ip1",
    name: "Aurora Brand Film 2026",
    type: "video",
    client: "Aurora Co.",
    requestedBy: { name: "Sarah Chen", avatar: "https://i.pravatar.cc/120?img=20" },
    receivedAt: new Date(now - 2 * 3600_000).toISOString(),
    deadline: new Date(now + 14 * day).toISOString(),
    priority: "high",
    description:
      "Hero brand film for Aurora's annual launch. 90s hero cut with cutdowns for paid social. Tone: cinematic, optimistic, grounded in product craft. Locked script attached.",
    tags: ["Brand Film", "Cinematic", "Hero + Cutdowns"],
    budgetHours: 40,
    referenceFiles: [
      { name: "aurora_brief_v3.pdf", size: "1.2 MB" },
      { name: "moodboard.fig", size: "8.4 MB" },
      { name: "locked_script.docx", size: "240 KB" },
    ],
  },
  {
    id: "ip2",
    name: "Q1 Product Launch Reel",
    type: "video",
    client: "Northwind",
    requestedBy: { name: "David Park", avatar: "https://i.pravatar.cc/120?img=21" },
    receivedAt: new Date(now - 6 * 3600_000).toISOString(),
    deadline: new Date(now + 2 * day).toISOString(),
    priority: "critical",
    description: "Punchy 30s product reel for keynote opener.",
    tags: ["Reel", "Keynote"],
    budgetHours: 24,
    referenceFiles: [{ name: "northwind_assets.zip", size: "120 MB" }],
  },
  {
    id: "ip3",
    name: "Spring Campaign Key Visual",
    type: "static",
    client: "Lumen Retail",
    requestedBy: { name: "Priya Iyer", avatar: "https://i.pravatar.cc/120?img=22" },
    receivedAt: new Date(now - 26 * 3600_000).toISOString(),
    deadline: new Date(now + 10 * day).toISOString(),
    priority: "medium",
    description: "Hero key visual + 6 social adaptations for spring drop.",
    tags: ["Campaign", "Social", "OOH"],
    budgetHours: 28,
    referenceFiles: [{ name: "spring_brief.pdf", size: "900 KB" }],
  },
];

function genTasksForStage(stage: string, type: ProjectType, projectDeadline: number, stageIdx: number, totalStages: number): SetupTask[] {
  const stageSlice = day * Math.max(1, Math.floor((projectDeadline - now) / day / totalStages));
  const baseDeadline = now + stageSlice * (stageIdx + 1);
  const templates: Record<string, { title: string; description: string; hours: number }[]> = {
    "Request Received": [
      { title: "Confirm brief & scope", description: "Review brief, flag blockers, confirm deliverables.", hours: 1 },
    ],
    Planning: [
      { title: "Production schedule", description: "Map stages to calendar, identify risks.", hours: 2 },
      { title: "Resource plan", description: "Assign team and confirm availability.", hours: 1 },
    ],
    "Concept/Script": [
      { title: "Treatment v1", description: "Write creative treatment.", hours: 4 },
      { title: "Script lock", description: "Iterate script through 2 rounds.", hours: 3 },
    ],
    "Raw Assets": [
      { title: "Collect source footage", description: "Pull footage, organize bins.", hours: 2 },
      { title: "Sync & label", description: "Sync audio, label takes.", hours: 2 },
    ],
    Editing: [
      { title: "Rough cut", description: "Build rough cut from selects.", hours: 6 },
      { title: "Fine cut", description: "Refine pacing, transitions, audio.", hours: 5 },
      { title: "Color & sound pass", description: "Initial grade and mix.", hours: 4 },
    ],
    Review: [
      { title: "Internal review", description: "Internal QC pass.", hours: 1 },
      { title: "Client review prep", description: "Package review link with notes.", hours: 1 },
    ],
    Corrections: [
      { title: "Apply client notes", description: "Implement revision round.", hours: 3 },
    ],
    Approval: [
      { title: "Final approval", description: "Secure sign-off.", hours: 1 },
    ],
    Delivered: [
      { title: "Master export & handoff", description: "Export masters, upload to client drive.", hours: 2 },
    ],
    Concept: [
      { title: "Concept directions", description: "3 concept directions.", hours: 4 },
      { title: "Direction lock", description: "Present and lock direction.", hours: 1 },
    ],
    Design: [
      { title: "Key visual design", description: "Design hero key visual.", hours: 6 },
      { title: "Adaptations", description: "Format adaptations.", hours: 4 },
    ],
    Revision: [
      { title: "Apply revisions", description: "Revision round 1.", hours: 3 },
    ],
  };
  const tpl = templates[stage] ?? [{ title: stage, description: `${stage} work.`, hours: 2 }];
  return tpl.map((t, j) => ({
    id: `${stage}-${j}-${Math.random().toString(36).slice(2, 7)}`,
    stage,
    title: t.title,
    description: t.description,
    hours: t.hours,
    priority: "medium" as Priority,
    deadline: new Date(baseDeadline).toISOString(),
    assigneeId: null,
  }));
}

export function generateTasks(project: IncomingProject): SetupTask[] {
  const workflow = project.type === "video" ? VIDEO_WORKFLOW : STATIC_WORKFLOW;
  const projectDeadline = new Date(project.deadline).getTime();
  return workflow.flatMap((stage, idx) =>
    genTasksForStage(stage, project.type, projectDeadline, idx, workflow.length)
  );
}
