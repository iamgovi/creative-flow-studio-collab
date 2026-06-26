import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DeliverableStatus, DeliverableType } from "@/data/mockDeliverables";

export type DatePreset = "month" | "lastMonth" | "quarter" | "year" | "custom";

export const DATE_PRESETS: { value: DatePreset; label: string; weeks: number }[] = [
  { value: "month", label: "This Month", weeks: 4 },
  { value: "lastMonth", label: "Last Month", weeks: 4 },
  { value: "quarter", label: "This Quarter", weeks: 12 },
  { value: "year", label: "This Year", weeks: 12 },
  { value: "custom", label: "Custom", weeks: 12 },
];

interface State {
  preset: DatePreset;
  clientIds: string[]; // empty = all
  type: "all" | DeliverableType;
  status: "all" | DeliverableStatus;
  compare: boolean;
  /** configurable on-time target (%) — drives the reference line + thresholds */
  onTimeTarget: number;
  /** strategic watchlist: flagged deliverable / client ids */
  flagged: string[];
  notes: Record<string, string>;
  setPreset: (p: DatePreset) => void;
  setClientIds: (ids: string[]) => void;
  toggleClient: (id: string) => void;
  setType: (t: "all" | DeliverableType) => void;
  setStatus: (s: "all" | DeliverableStatus) => void;
  toggleCompare: () => void;
  setTarget: (n: number) => void;
  toggleFlag: (id: string) => void;
  setNote: (id: string, text: string) => void;
}

export const useDeliverableFilters = create<State>()(
  persist(
    (set) => ({
      preset: "quarter",
      clientIds: [],
      type: "all",
      status: "all",
      compare: false,
      onTimeTarget: 85,
      flagged: [],
      notes: {},
      setPreset: (preset) => set({ preset }),
      setClientIds: (clientIds) => set({ clientIds }),
      toggleClient: (id) =>
        set((s) => ({
          clientIds: s.clientIds.includes(id)
            ? s.clientIds.filter((x) => x !== id)
            : [...s.clientIds, id],
        })),
      setType: (type) => set({ type }),
      setStatus: (status) => set({ status }),
      toggleCompare: () => set((s) => ({ compare: !s.compare })),
      setTarget: (onTimeTarget) => set({ onTimeTarget }),
      toggleFlag: (id) =>
        set((s) => ({
          flagged: s.flagged.includes(id)
            ? s.flagged.filter((x) => x !== id)
            : [...s.flagged, id],
        })),
      setNote: (id, text) => set((s) => ({ notes: { ...s.notes, [id]: text } })),
    }),
    { name: "wwems-deliverables-filters", partialize: (s) => ({ onTimeTarget: s.onTimeTarget, flagged: s.flagged, notes: s.notes }) },
  ),
);

/** active tab is ephemeral (not persisted across reloads) */
export type DeliverablesTab = "overview" | "clients" | "deliverables" | "delays" | "trends";