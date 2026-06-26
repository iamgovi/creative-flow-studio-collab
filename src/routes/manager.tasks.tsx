import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Keyboard, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TasksBoard } from "@/components/tasks/TasksBoard";
import { SubmitModal } from "@/components/tasks/SubmitModal";
import { NewTaskModal } from "@/components/tasks/NewTaskModal";
import { cn } from "@/lib/utils";
import { useManagerTasks } from "@/hooks/useManagerTasks";
import { useRelayStore } from "@/hooks/useRelayWorkflow";
import type { MyTask } from "@/data/myTasks";

export const Route = createFileRoute("/manager/tasks")({
  head: () => ({
    meta: [
      { title: "My Tasks — cntrlm" },
      { name: "description", content: "Your personal work — self-assigned deliverable stages and personal to-dos." },
    ],
  }),
  component: ManagerTasksPage,
});

type SortKey = "deadline" | "priority" | "updated";
type SourceFilter = "all" | "deliverable" | "personal";
const PRIORITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 } as const;

function ManagerTasksPage() {
  const tasks = useManagerTasks((s) => s.tasks);
  const submitForReview = useManagerTasks((s) => s.submitForReview);
  const addTask = useManagerTasks((s) => s.addTask);
  const pendingSwitchId = useManagerTasks((s) => s.pendingSwitchId);
  const setPendingSwitch = useManagerTasks((s) => s.setPendingSwitch);
  const confirmSwitch = useManagerTasks((s) => s.confirmSwitch);
  const startTask = useManagerTasks((s) => s.startTask);
  const pauseTask = useManagerTasks((s) => s.pauseTask);

  // Bridge: submitting a deliverable-linked task flips the linked deliverable
  // to "awaiting review" in the Deliverables window (where the manager reviews it).
  const simulateSubmit = useRelayStore((s) => s.simulateSubmit);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);

  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("deadline");

  const [submitTask, setSubmitTask] = useState<MyTask | null>(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const visible = useMemo(() => {
    let out = tasks;
    if (sourceFilter !== "all") {
      out = out.filter((t) => (sourceFilter === "deliverable" ? t.source === "deliverable" : t.source === "personal"));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((t) => t.title.toLowerCase().includes(q) || (t.deliverableName ?? "").toLowerCase().includes(q));
    }
    const sorted = [...out];
    sorted.sort((a, b) => {
      switch (sort) {
        case "priority": return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        case "updated": return (b.submittedAt ?? b.runningSince ?? "").localeCompare(a.submittedAt ?? a.runningSince ?? "");
        case "deadline":
        default: return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
    });
    return sorted;
  }, [tasks, sourceFilter, search, sort]);

  const counts = useMemo(() => {
    const inProgress = tasks.filter((t) => t.lifecycle === "in_progress").length;
    const review = tasks.filter((t) => t.lifecycle === "review").length;
    return { inProgress, review };
  }, [tasks]);

  // Keyboard shortcuts (parity with employee board)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inField = ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName ?? "");
      if (e.key === "?" && !inField) { e.preventDefault(); setShortcutsOpen(true); return; }
      if (e.key === "/" && !inField) { e.preventDefault(); document.getElementById("mgr-tasks-search")?.focus(); return; }
      if (e.key === " " && !inField) {
        e.preventDefault();
        const active = tasks.find((t) => t.lifecycle === "in_progress");
        if (active) pauseTask(active.id);
        else {
          const first = tasks.find((t) => t.lifecycle === "paused") ?? tasks.find((t) => t.lifecycle === "assigned");
          if (first) startTask(first.id);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tasks, pauseTask, startTask]);

  const isEmpty = tasks.length === 0;

  return (
    <AppShell>
      <div className="space-y-4 max-w-[1700px]">
        {/* Header */}
        <header className="flex flex-wrap items-center gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">My Tasks</h1>
            <p className="text-sm text-muted-foreground">
              Your personal work — self-assigned deliverable stages and personal to-dos
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {counts.inProgress} in progress · {counts.review} awaiting review
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <SegmentedSource value={sourceFilter} onChange={setSourceFilter} />
            <div className="relative">
              <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="mgr-tasks-search"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[220px] pl-8"
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-[170px] h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline">Sort: Deadline</SelectItem>
                <SelectItem value="priority">Sort: Priority</SelectItem>
                <SelectItem value="updated">Sort: Recently updated</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setNewTaskOpen(true)}>
              <Plus className="size-4" /> New Task
            </Button>
          </div>
        </header>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
            <h3 className="font-semibold">No tasks yet</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              Self-assign a deliverable stage in Deliverables, or create a personal to-do.
            </p>
            <Button className="mt-4" onClick={() => setNewTaskOpen(true)}><Plus className="size-4" /> New Task</Button>
          </div>
        ) : (
          <TasksBoard
            tasks={visible}
            loading={loading}
            store={useManagerTasks}
            onSubmit={(t) => setSubmitTask(t)}
            onOpenDetail={(t) => {
              if (t.source === "deliverable") navigate({ to: "/manager/deliverables" });
            }}
            onOpenDeliverable={() => navigate({ to: "/manager/deliverables" })}
          />
        )}
      </div>

      {/* Floating shortcuts trigger */}
      <button
        onClick={() => setShortcutsOpen(true)}
        aria-label="Keyboard shortcuts"
        className="fixed bottom-4 right-4 size-10 grid place-items-center rounded-full bg-card border shadow-md hover:shadow-lg hover:bg-accent transition-all"
      >
        <Keyboard className="size-4 text-muted-foreground" />
      </button>

      <SubmitModal
        task={submitTask}
        open={!!submitTask}
        onClose={() => setSubmitTask(null)}
        onSubmit={(note, files) => {
          if (submitTask) {
            submitForReview(submitTask.id, note, files);
            // Deliverables bridge: keep the linked deliverable in sync.
            if (submitTask.source === "deliverable" && submitTask.deliverableId) {
              simulateSubmit(submitTask.deliverableId);
            }
          }
          setSubmitTask(null);
          toast.success("Submitted for review", {
            description: submitTask?.source === "deliverable"
              ? "The linked deliverable now awaits your review in Deliverables."
              : undefined,
          });
        }}
      />

      <NewTaskModal
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        onCreate={(task) => { addTask(task); setNewTaskOpen(false); toast.success("Task created"); }}
      />

      {/* Switch active timer confirmation */}
      <Dialog open={!!pendingSwitchId} onOpenChange={(v) => !v && setPendingSwitch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Already working on another task</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You're already working on{" "}
            <span className="font-medium text-foreground">
              "{tasks.find((t) => t.lifecycle === "in_progress")?.title ?? "another task"}"
            </span>
            . Pause it and start this one?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingSwitch(null)}>Cancel</Button>
            <Button onClick={() => confirmSwitch()}>Pause &amp; Switch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Keyboard shortcuts</DialogTitle></DialogHeader>
          <ul className="text-sm space-y-2">
            <li><kbd className="rounded border px-1.5 py-0.5 text-xs">/</kbd> Focus search</li>
            <li><kbd className="rounded border px-1.5 py-0.5 text-xs">Space</kbd> Start / pause active task</li>
            <li><kbd className="rounded border px-1.5 py-0.5 text-xs">?</kbd> Show this help</li>
          </ul>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function SegmentedSource({ value, onChange }: { value: SourceFilter; onChange: (v: SourceFilter) => void }) {
  const opts: { key: SourceFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "deliverable", label: "Deliverable-linked" },
    { key: "personal", label: "Personal" },
  ];
  return (
    <div className="inline-flex items-center rounded-md border bg-card p-0.5 text-sm">
      {opts.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            value === o.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
