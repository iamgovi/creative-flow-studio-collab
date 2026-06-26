import { create } from "zustand";

export type DateRangePreset = "today" | "week" | "30days" | "quarter" | "custom";
export type AnalyticsTab = "overview" | "time" | "attendance" | "quality" | "workload" | "insights";
export type InsightFilter = "all" | "strength" | "growth" | "wellbeing" | "bottleneck" | "trend" | "anomaly";

export const DATE_PRESETS: { value: DateRangePreset; label: string; days: number }[] = [
  { value: "today", label: "Today", days: 1 },
  { value: "week", label: "This Week", days: 7 },
  { value: "30days", label: "Last 30 Days", days: 30 },
  { value: "quarter", label: "This Quarter", days: 30 }, // capped at our 30-day dataset
];

interface AnalyticsState {
  preset: DateRangePreset;
  days: number;
  members: string[]; // empty = all
  projects: string[]; // empty = all
  compare: boolean;
  activeTab: AnalyticsTab;
  insightFilter: InsightFilter;
  dismissed: string[];
  setPreset: (p: DateRangePreset) => void;
  setMembers: (ids: string[]) => void;
  setProjects: (ids: string[]) => void;
  toggleCompare: () => void;
  setTab: (t: AnalyticsTab) => void;
  setInsightFilter: (f: InsightFilter) => void;
  dismiss: (id: string) => void;
}

export const useAnalytics = create<AnalyticsState>((set) => ({
  preset: "30days",
  days: 30,
  members: [],
  projects: [],
  compare: false,
  activeTab: "overview",
  insightFilter: "all",
  dismissed: [],
  setPreset: (p) =>
    set(() => {
      const found = DATE_PRESETS.find((d) => d.value === p);
      return { preset: p, days: found?.days ?? 30 };
    }),
  setMembers: (ids) => set({ members: ids }),
  setProjects: (ids) => set({ projects: ids }),
  toggleCompare: () => set((s) => ({ compare: !s.compare })),
  setTab: (t) => set({ activeTab: t }),
  setInsightFilter: (f) => set({ insightFilter: f }),
  dismiss: (id) => set((s) => ({ dismissed: [...s.dismissed, id] })),
}));