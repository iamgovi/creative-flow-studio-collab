export type Role = "employee" | "manager" | "admin";
export type TaskStatus = "assigned" | "in_progress" | "review" | "revision" | "done";
export type Priority = "low" | "medium" | "high" | "critical";
export type ProjectType = "video" | "static";

export const VIDEO_STAGES = [
  "Request", "Planning", "Concept", "Raw Assets", "Editing", "Review", "Corrections", "Approval", "Delivered",
];
export const STATIC_STAGES = [
  "Request", "Concept", "Design", "Review", "Revision", "Approval", "Delivered",
];

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: "Video" | "Design" | "Motion" | "Operations";
  position: string;
  avatar: string;
  status: "active" | "inactive";
  lastLogin: string;
}

const FIRST = ["Aria","Noah","Maya","Jin","Olivia","Kai","Zara","Theo","Ines","Ravi","Sofia","Leo","Mira","Eli","Yuki","Diego","Nora"];
const LAST = ["Patel","Chen","Romero","Okafor","Lindqvist","Müller","Hassan","Park","Silva","Nguyen","Tanaka","Khan","Bauer","Costa"];

function pick<T>(a: T[], i: number) { return a[i % a.length]; }

const POSITIONS: Record<Role, Record<string, string>> = {
  employee: { Video: "🎬 Video Editor", Design: "🎨 Graphic Designer", Motion: "✨ Motion Designer", Operations: "📋 Production Coordinator" },
  manager: { Video: "🎥 Video Lead", Design: "🖌️ Design Lead", Motion: "🌀 Motion Lead", Operations: "🗂️ Operations Manager" },
  admin: { Video: "🚀 Studio Director", Design: "🚀 Studio Director", Motion: "🚀 Studio Director", Operations: "🚀 Studio Director" },
};

export const users: User[] = Array.from({ length: 17 }, (_, i) => {
  const role: Role = i < 12 ? "employee" : i < 16 ? "manager" : "admin";
  const dept = (["Video","Design","Motion","Operations"] as const)[i % 4];
  return {
    id: `u${i + 1}`,
    name: `${pick(FIRST, i)} ${pick(LAST, i + 3)}`,
    email: `${pick(FIRST, i).toLowerCase()}.${pick(LAST, i + 3).toLowerCase()}@wwems.co`,
    role,
    department: dept,
    position: POSITIONS[role][dept],
    avatar: `https://i.pravatar.cc/120?img=${(i % 70) + 1}`,
    status: i === 11 ? "inactive" : "active",
    lastLogin: new Date(Date.now() - i * 3600_000).toISOString(),
  };
});

export const currentEmployee = users[0];
export const currentManager = users[12];
export const currentAdmin = users[16];

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  client: string;
  ownerId: string;
  deadline: string;
  progress: number;
  currentStage: number;
  memberIds: string[];
}

const PROJECT_NAMES = [
  ["Aurora Brand Film","video","Aurora Co."],
  ["Q4 Product Launch Reel","video","Northwind"],
  ["Summer Campaign Hero","static","Lumen Retail"],
  ["Annual Report Microsite","static","Helix Group"],
  ["Investor Pitch Animation","video","Vertex"],
  ["Holiday Social Pack","static","Bloom"],
  ["Internal Culture Doc","video","Wwems"],
  ["Packaging Refresh","static","Halo Foods"],
] as const;

export const projects: Project[] = PROJECT_NAMES.map(([name, type, client], i) => {
  const stages = type === "video" ? VIDEO_STAGES : STATIC_STAGES;
  const stage = (i + 1) % stages.length;
  return {
    id: `p${i + 1}`,
    name,
    type: type as ProjectType,
    client,
    ownerId: users[12 + (i % 4)].id,
    deadline: new Date(Date.now() + (i + 3) * 86400_000 * 2).toISOString(),
    progress: Math.round((stage / (stages.length - 1)) * 100),
    currentStage: stage,
    memberIds: users.slice(0, 12).filter((_, j) => (j + i) % 3 === 0).map((u) => u.id),
  };
});

export interface Task {
  id: string;
  projectId: string;
  title: string;
  stage: number;
  assigneeId: string;
  status: TaskStatus;
  priority: Priority;
  deadline: string;
  startedAt?: string;
  timeSpentMin: number;
  comments: number;
  attachments: number;
}

const TASK_VERBS = ["Draft","Edit","Color grade","Storyboard","Compose","Layout","Refine","Export","Review","Animate","Concept","Polish"];
const TASK_NOUNS = ["opening sequence","logo lockup","hero frame","motion teaser","social cuts","poster set","key visual","title card","B-roll selects","color pass","caption pack","thumbnail set"];
const STATUSES: TaskStatus[] = ["assigned","in_progress","review","revision","done"];
const PRIORS: Priority[] = ["low","medium","high","critical"];

export const tasks: Task[] = Array.from({ length: 48 }, (_, i) => {
  const project = projects[i % projects.length];
  const stages = project.type === "video" ? VIDEO_STAGES : STATIC_STAGES;
  const status = STATUSES[i % STATUSES.length];
  return {
    id: `t${i + 1}`,
    projectId: project.id,
    title: `${pick(TASK_VERBS, i)} ${pick(TASK_NOUNS, i + 2)}`,
    stage: i % stages.length,
    assigneeId: users[i % 12].id,
    status,
    priority: PRIORS[i % PRIORS.length],
    deadline: new Date(Date.now() + ((i % 14) - 4) * 86400_000).toISOString(),
    startedAt: status === "in_progress" ? new Date(Date.now() - (i % 5) * 1800_000).toISOString() : undefined,
    timeSpentMin: (i * 37) % 480,
    comments: i % 6,
    attachments: i % 4,
  };
});

export interface AuditEvent {
  id: string;
  ts: string;
  actorId: string;
  action: string;
  target: string;
  ip: string;
  details?: Record<string, unknown>;
}

const ACTIONS = ["TASK_STARTED","TASK_PAUSED","TASK_SUBMITTED","REVIEW_APPROVED","REVISION_REQUESTED","DEADLINE_MODIFIED","USER_LOGIN","USER_LOGOUT","PROJECT_CREATED","ROLE_CHANGED"];

export const auditEvents: AuditEvent[] = Array.from({ length: 220 }, (_, i) => ({
  id: `a${i + 1}`,
  ts: new Date(Date.now() - i * 1800_000 - (i % 7) * 3600_000).toISOString(),
  actorId: users[i % users.length].id,
  action: pick(ACTIONS, i),
  target: pick(["task:", "project:", "user:"], i) + (i % 40 + 1),
  ip: `10.0.${i % 250}.${(i * 7) % 250}`,
  details: { agent: "web", session: `s${i % 20}` },
}));

export interface NotificationItem {
  id: string;
  type: "mention" | "review" | "deadline" | "system";
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

const NOTI_TPL = [
  ["mention","mentioned you on a task"],
  ["review","Submitted a deliverable for review"],
  ["deadline","Task deadline in 24h"],
  ["system","System maintenance scheduled"],
] as const;

export const notifications: NotificationItem[] = Array.from({ length: 32 }, (_, i) => {
  const [type, msg] = NOTI_TPL[i % NOTI_TPL.length];
  return {
    id: `n${i + 1}`,
    type: type as NotificationItem["type"],
    message: `${users[i % users.length].name} ${msg}`,
    time: new Date(Date.now() - i * 1800_000).toISOString(),
    read: i > 6,
  };
});

// 30 days productivity per employee
export const productivityByDay = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(Date.now() - (29 - i) * 86400_000);
  return {
    date: d.toISOString().slice(5, 10),
    productivity: 55 + Math.round(20 * Math.sin(i / 3) + (i % 5) * 3),
    completed: 4 + (i % 6),
    revised: i % 3,
    overdue: i % 7 === 0 ? 2 : 0,
  };
});

export const stageVelocity = (VIDEO_STAGES).map((s, i) => ({
  stage: s,
  days: 1 + ((i * 1.7) % 6),
}));

export const timeBreakdown = [
  { name: "Productive", value: 62 },
  { name: "Idle", value: 23 },
  { name: "Break", value: 15 },
];

export const departmentProductivity = [
  { dept: "Video", productive: 71, idle: 18, break: 11 },
  { dept: "Design", productive: 66, idle: 22, break: 12 },
  { dept: "Motion", productive: 74, idle: 15, break: 11 },
  { dept: "Operations", productive: 58, idle: 28, break: 14 },
];
