import { create } from "zustand";
import { initialMyTasks, type MyTask, type Lifecycle, LEGAL_TRANSITIONS } from "@/data/myTasks";

interface State {
  tasks: MyTask[];
  /** Current id of the in_progress task, if any. */
  activeId: string | null;
  /** Pending switch confirmation: replace active with this id. */
  pendingSwitchId: string | null;
  setPendingSwitch: (id: string | null) => void;
  /** Try to start (or resume) a task. Returns "switch" if user must confirm. */
  startTask: (id: string) => "started" | "switch" | "noop";
  /** Force-start: pause the current active and start the requested. */
  confirmSwitch: () => void;
  pauseTask: (id: string) => void;
  /** Submit a task for review with files + optional note. */
  submitForReview: (id: string, note?: string, fileNames?: string[]) => void;
  /** Move from revision back into in_progress (timer starts). */
  resumeRevision: (id: string) => void;
  /** Generic helper used by drag handler. Returns true if applied. */
  attemptMove: (id: string, to: Lifecycle) => boolean;
  /** Append a new task to the board (used by the manager's "+ New Task"). */
  addTask: (task: MyTask) => void;
}

function findActive(tasks: MyTask[]): string | null {
  return tasks.find((t) => t.lifecycle === "in_progress")?.id ?? null;
}

function bankRunningTime(t: MyTask): MyTask {
  if (!t.runningSince) return t;
  const min = Math.floor((Date.now() - new Date(t.runningSince).getTime()) / 60_000);
  return { ...t, accumulatedMin: t.accumulatedMin + min, runningSince: undefined };
}

/**
 * Factory that builds an independent task-board store from a seed list.
 * Each store enforces its own "one active task at a time" rule, so the
 * employee board and the manager board stay isolated while sharing all logic.
 */
export function createTaskStore(initial: MyTask[]) {
  return create<State>((set, get) => ({
  tasks: initial,
  activeId: findActive(initial),
  pendingSwitchId: null,

  setPendingSwitch: (id) => set({ pendingSwitchId: id }),

  startTask: (id) => {
    const { tasks, activeId } = get();
    const task = tasks.find((t) => t.id === id);
    if (!task) return "noop";
    if (task.lifecycle === "in_progress") return "noop";
    if (activeId && activeId !== id) {
      set({ pendingSwitchId: id });
      return "switch";
    }
    set({
      tasks: tasks.map((t) =>
        t.id === id ? { ...t, lifecycle: "in_progress", runningSince: new Date().toISOString() } : t,
      ),
      activeId: id,
    });
    return "started";
  },

  confirmSwitch: () => {
    const { tasks, activeId, pendingSwitchId } = get();
    if (!pendingSwitchId) return;
    const next = tasks.map((t) => {
      if (t.id === activeId) return { ...bankRunningTime(t), lifecycle: "paused" as Lifecycle };
      if (t.id === pendingSwitchId) return { ...t, lifecycle: "in_progress" as Lifecycle, runningSince: new Date().toISOString() };
      return t;
    });
    set({ tasks: next, activeId: pendingSwitchId, pendingSwitchId: null });
  },

  pauseTask: (id) => {
    const { tasks, activeId } = get();
    set({
      tasks: tasks.map((t) => (t.id === id ? { ...bankRunningTime(t), lifecycle: "paused" } : t)),
      activeId: activeId === id ? null : activeId,
    });
  },

  submitForReview: (id, note, fileNames) => {
    const { tasks, activeId } = get();
    set({
      tasks: tasks.map((t) =>
        t.id === id
          ? {
              ...bankRunningTime(t),
              lifecycle: "review",
              submittedAt: new Date().toISOString(),
              attachments: t.attachments + (fileNames?.length ?? 0),
              comments: t.comments + (note ? 1 : 0),
            }
          : t,
      ),
      activeId: activeId === id ? null : activeId,
    });
  },

  resumeRevision: (id) => {
    const { tasks, activeId } = get();
    if (activeId && activeId !== id) {
      set({ pendingSwitchId: id });
      return;
    }
    set({
      tasks: tasks.map((t) =>
        t.id === id ? { ...t, lifecycle: "in_progress", runningSince: new Date().toISOString(), revisions: t.revisions + 1 } : t,
      ),
      activeId: id,
    });
  },

  attemptMove: (id, to) => {
    const { tasks } = get();
    const task = tasks.find((t) => t.id === id);
    if (!task) return false;
    const allowed = LEGAL_TRANSITIONS[task.lifecycle];
    if (!allowed.includes(to)) return false;
    if (to === "in_progress") {
      // resume / start path
      if (task.lifecycle === "revision") {
        get().resumeRevision(id);
      } else {
        const r = get().startTask(id);
        if (r === "switch") return false; // requires confirmation modal
      }
      return true;
    }
    if (to === "paused") {
      get().pauseTask(id);
      return true;
    }
    if (to === "review") {
      // Submission requires modal — caller will open it; treat drag as "open submit modal".
      return false;
    }
    return false;
  },

  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
  }));
}

export type TaskStore = ReturnType<typeof createTaskStore>;

/** The shared employee board store (seeded with the employee mock tasks). */
export const useActiveTask = createTaskStore(initialMyTasks);
