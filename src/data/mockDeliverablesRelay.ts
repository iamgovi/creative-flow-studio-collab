// Mock data simulating the admin-setup output for the manager's intake view.
// An admin adds a client and enters a number of deliverables (e.g. 4 videos,
// 4 statics). Those deliverables land here assigned to this manager, who does
// two things per deliverable: assign it to a team member, and review the work
// that comes back.

export type DeliverableType = "video" | "static";

export type DeliverableStatus =
  | "unassigned"
  | "in_progress"
  | "awaiting_review"
  | "completed";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  workloadH: number; // current committed hours
  capacityH: number; // weekly capacity
}

export interface SubmittedFile {
  name: string;
  kind: "video" | "image" | "doc";
  thumb?: string; // preview image url for image/video kinds
  size?: string;
}

export interface Deliverable {
  id: string;
  clientId: string;
  name: string;
  type: DeliverableType;
  deadline: string; // ISO date
  createdAt: string;
  status: DeliverableStatus;
  assigneeId?: string;
  submissionNote?: string;
  files?: SubmittedFile[];
  revisionCount: number;
  revisionNotes?: string;
}

export interface Client {
  id: string;
  name: string;
  isNew: boolean;
  accent: string;
}

const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000).toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000).toISOString();

export const team: TeamMember[] = [
  { id: "e1", name: "Aria Patel", role: "🎬 Video Editor", avatar: "https://i.pravatar.cc/150?img=1", workloadH: 32, capacityH: 40 },
  { id: "e2", name: "Noah Chen", role: "🎨 Graphic Designer", avatar: "https://i.pravatar.cc/150?img=12", workloadH: 18, capacityH: 40 },
  { id: "e3", name: "Maya Romero", role: "✨ Motion Designer", avatar: "https://i.pravatar.cc/150?img=5", workloadH: 39, capacityH: 40 },
  { id: "e4", name: "Jin Park", role: "🎬 Video Editor", avatar: "https://i.pravatar.cc/150?img=15", workloadH: 24, capacityH: 40 },
  { id: "e5", name: "Olivia Silva", role: "🎨 Graphic Designer", avatar: "https://i.pravatar.cc/150?img=20", workloadH: 8, capacityH: 40 },
  { id: "e6", name: "Kai Nguyen", role: "✨ Motion Designer", avatar: "https://i.pravatar.cc/150?img=33", workloadH: 30, capacityH: 40 },
  { id: "e7", name: "Zara Khan", role: "📋 Production Coord.", avatar: "https://i.pravatar.cc/150?img=44", workloadH: 14, capacityH: 40 },
  { id: "e8", name: "Theo Bauer", role: "🎬 Video Editor", avatar: "https://i.pravatar.cc/150?img=51", workloadH: 36, capacityH: 40 },
];

export const clients: Client[] = [
  { id: "acme", name: "Acme", isNew: true, accent: "#6366f1" },
  { id: "globex", name: "Globex", isNew: false, accent: "#0ea5e9" },
  { id: "initech", name: "Initech", isNew: false, accent: "#10b981" },
];

export const deliverables: Deliverable[] = [
  // --- Acme: freshly arrived, mostly unassigned ---
  { id: "d-acme-1", clientId: "acme", name: "Brand Refresh Video", type: "video", deadline: daysFromNow(14), createdAt: hoursAgo(4), status: "unassigned", revisionCount: 0 },
  { id: "d-acme-2", clientId: "acme", name: "Social Promo Cutdowns", type: "video", deadline: daysFromNow(21), createdAt: hoursAgo(4), status: "unassigned", revisionCount: 0 },
  { id: "d-acme-3", clientId: "acme", name: "Launch Key Art", type: "static", deadline: daysFromNow(18), createdAt: hoursAgo(4), status: "in_progress", assigneeId: "e2", revisionCount: 0 },
  { id: "d-acme-4", clientId: "acme", name: "Instagram Story Set", type: "static", deadline: daysFromNow(10), createdAt: hoursAgo(4), status: "unassigned", revisionCount: 0 },

  // --- Globex: mid-flow, one awaiting review with files ---
  {
    id: "d-globex-1", clientId: "globex", name: "Product Explainer", type: "video", deadline: daysFromNow(5), createdAt: hoursAgo(120),
    status: "awaiting_review", assigneeId: "e1", revisionCount: 0,
    submissionNote: "Final cut with color grade and licensed music. Subtitles baked in. Let me know if the intro pacing works.",
    files: [
      { name: "product_explainer_final.mp4", kind: "video", thumb: "https://picsum.photos/seed/explainer/320/200", size: "184 MB" },
      { name: "thumbnail_option_a.jpg", kind: "image", thumb: "https://picsum.photos/seed/thumba/320/200", size: "2.1 MB" },
      { name: "export_notes.pdf", kind: "doc", size: "84 KB" },
    ],
  },
  { id: "d-globex-2", clientId: "globex", name: "Campaign Landing Visuals", type: "static", deadline: daysFromNow(9), createdAt: hoursAgo(72), status: "in_progress", assigneeId: "e2", revisionCount: 0 },
  { id: "d-globex-3", clientId: "globex", name: "Sizzle Reel", type: "video", deadline: daysFromNow(2), createdAt: hoursAgo(96), status: "unassigned", revisionCount: 0 },

  // --- Initech: one complete, one awaiting review, one in revision ---
  {
    id: "d-initech-1", clientId: "initech", name: "Annual Report Motion", type: "video", deadline: daysFromNow(-2), createdAt: hoursAgo(400),
    status: "completed", assigneeId: "e3", revisionCount: 0,
  },
  {
    id: "d-initech-2", clientId: "initech", name: "Rebrand Style Frames", type: "static", deadline: daysFromNow(3), createdAt: hoursAgo(200),
    status: "in_progress", assigneeId: "e6", revisionCount: 1,
    revisionNotes: "Type hierarchy needs work and the palette is too muted — push contrast.",
  },
  {
    id: "d-initech-3", clientId: "initech", name: "Investor Deck Graphics", type: "static", deadline: daysFromNow(6), createdAt: hoursAgo(150),
    status: "awaiting_review", assigneeId: "e5", revisionCount: 0,
    submissionNote: "All 14 slide graphics done in brand palette. Source files included.",
    files: [
      { name: "slide_cover.png", kind: "image", thumb: "https://picsum.photos/seed/slidecover/320/200", size: "3.4 MB" },
      { name: "slide_metrics.png", kind: "image", thumb: "https://picsum.photos/seed/slidemetrics/320/200", size: "2.8 MB" },
      { name: "deck_graphics_source.fig", kind: "doc", size: "12 MB" },
    ],
  },
];

export function memberById(id?: string): TeamMember | undefined {
  return id ? team.find((m) => m.id === id) : undefined;
}
export function clientById(id: string): Client | undefined {
  return clients.find((c) => c.id === id);
}
