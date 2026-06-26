// The manager's deliverable workflow. A single zustand store owns the simple
// status transitions: unassigned -> in_progress -> awaiting_review -> completed,
// with revision sending a deliverable back to in_progress.
import { create } from "zustand";
import {
  deliverables as seedDeliverables,
  type Deliverable,
  type DeliverableStatus,
} from "@/data/mockDeliverablesRelay";

export type { DeliverableStatus };

interface RelayState {
  deliverables: Deliverable[];
  lastVisitNewCount: number;
  assign: (deliverableId: string, memberId: string) => void;
  approve: (deliverableId: string) => void;
  requestRevision: (deliverableId: string, notes: string, newAssigneeId?: string) => void;
  // dev helper to simulate the employee-side submit (lives in employee view IRL)
  simulateSubmit: (deliverableId: string) => void;
}

const clone = (d: Deliverable[]): Deliverable[] => JSON.parse(JSON.stringify(d));

function mutate(
  state: RelayState,
  id: string,
  fn: (d: Deliverable) => void,
): Deliverable[] {
  const next = clone(state.deliverables);
  const d = next.find((x) => x.id === id);
  if (d) fn(d);
  return next;
}

export const useRelayStore = create<RelayState>((set) => ({
  deliverables: clone(seedDeliverables),
  lastVisitNewCount: 3,

  assign: (id, memberId) =>
    set((state) => ({
      deliverables: mutate(state, id, (d) => {
        if (d.status === "completed") return;
        d.assigneeId = memberId;
        d.status = "in_progress";
      }),
    })),

  approve: (id) =>
    set((state) => ({
      deliverables: mutate(state, id, (d) => {
        if (d.status !== "awaiting_review") return;
        d.status = "completed";
      }),
    })),

  requestRevision: (id, notes, newAssigneeId) =>
    set((state) => ({
      deliverables: mutate(state, id, (d) => {
        if (d.status !== "awaiting_review") return;
        d.status = "in_progress";
        d.revisionCount += 1;
        d.revisionNotes = notes;
        d.submissionNote = undefined;
        d.files = undefined;
        if (newAssigneeId) d.assigneeId = newAssigneeId;
      }),
    })),

  simulateSubmit: (id) =>
    set((state) => ({
      deliverables: mutate(state, id, (d) => {
        if (d.status !== "in_progress") return;
        d.status = "awaiting_review";
      }),
    })),
}));

// ---- derived helpers -------------------------------------------------------

/** A deliverable "needs the manager" when it is unassigned OR awaiting review. */
export function needsAction(d: Deliverable): boolean {
  return d.status === "unassigned" || d.status === "awaiting_review";
}

export function totalActionCount(ds: Deliverable[]): number {
  return ds.filter(needsAction).length;
}

export const STATUS_LABEL: Record<DeliverableStatus, string> = {
  unassigned: "Unassigned",
  in_progress: "In Progress",
  awaiting_review: "Awaiting Review",
  completed: "Completed",
};
