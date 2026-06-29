import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search, Coffee, Keyboard,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TasksBoard } from "@/components/tasks/TasksBoard";
import { SubmitModal } from "@/components/tasks/SubmitModal";
import { TaskFilters, EMPTY_FILTERS, type FilterState } from "@/components/tasks/TaskFilters";
import { useActiveTask } from "@/hooks/useActiveTask";
import { myProjects, type MyTask, type MyProjectType } from "@/data/myTasks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getSupabaseClient } from "@/repositories/supabase/client";
export const Route = createFileRoute("/employee/tasks")({
  head: () => ({
    meta: [
      { title: "My Tasks — WWEMS" },
      { name: "description", content: "Personal task board: start, pause, and submit your work for review." },
    ],
  }),
  component: MyTasksPage,
});

type SortKey = "deadline" | "priority" | "updated" | "project";
const PRIORITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 } as const;

function MyTasksPage() {
  
  const supabase = getSupabaseClient();
  const submitForReview = useActiveTask((s) => s.submitForReview);
  const pendingSwitchId = useActiveTask((s) => s.pendingSwitchId);
  const setPendingSwitch = useActiveTask((s) => s.setPendingSwitch);
  const confirmSwitch = useActiveTask((s) => s.confirmSwitch);
  const startTask = useActiveTask((s) => s.startTask);
  const pauseTask = useActiveTask((s) => s.pauseTask);
  const navigate = useNavigate();
  const [department, setDepartment] = useState("");

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  console.log("RENDER TASKS", tasks);
  useEffect(() => {
  console.log("TASKS CHANGED", tasks);
}, [tasks]);
  useEffect(() => {
    async function loadTasks() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { data: employee } = await supabase
  .from("users")
  .select("department")
  .eq("id", user.id)
  .single();

console.log("EMPLOYEE", employee);
if (employee) {
  setDepartment(employee.department);
}

        console.log("AUTH USER", user);

        if (!user) return;

        console.log("FETCHING TASKS...");

        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("assignee_id", user.id)
          .order("created_at", { ascending: false });

        console.log("RAW DATA", data);
        console.log("RAW ERROR", error);

        if (error) {
          console.error(error);
          return;
        }

        const mappedTasks = (data || []).map((task) => ({
  id: task.id,
  title: task.title,
  priority: task.priority,
  deadline: task.deadline,

  deliverableType: task.deliverable_type, // ADD THIS

  lifecycle:
    task.status === "done"
      ? "done"
      : task.status === "in_progress"
      ? "in_progress"
      : task.status === "review"
      ? "review"
      : task.status === "revision"
      ? "revision"
      : "assigned",

  projectId: task.project_id || "default",

  accumulatedMin: task.time_spent_minutes || 0,
  runningSince: task.started_at,
  submittedAt: task.completed_at,
}));
        console.log("MAPPED TASKS", mappedTasks);
        setTasks(mappedTasks);
        console.log("FIRST TASK", mappedTasks[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, []);

  const [typeFilter, setTypeFilter] = useState<"all" | MyProjectType>("all");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("deadline");

  const [submitTask, setSubmitTask] = useState<MyTask | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Filter + sort
  const visible = useMemo(() => {
    let out = tasks;
    if (typeFilter !== "all") {
  out = out.filter(
    (t) => t.deliverableType === typeFilter
  );
}
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (filters.priorities.length) out = out.filter((t) => filters.priorities.includes(t.priority));
    if (filters.projectIds.length) out = out.filter((t) => filters.projectIds.includes(t.projectId));
    if (filters.deadline !== "any") {
      const now = Date.now();
      const d7 = now + 7 * 86400_000;
      const d14 = now + 14 * 86400_000;
      out = out.filter((t) => {
        const ms = new Date(t.deadline).getTime();
        switch (filters.deadline) {
          case "overdue": return ms < now && t.lifecycle !== "done";
          case "this_week": return ms >= now && ms <= d7;
          case "next_week": return ms > d7 && ms <= d14;
          case "later": return ms > d14;
          default: return true;
        }
      });
    }
    const sorted = [...out];
    sorted.sort((a, b) => {
      switch (sort) {
        case "priority": return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        case "project": return (a.projectId).localeCompare(b.projectId);
        case "updated": return (b.submittedAt ?? b.runningSince ?? "").localeCompare(a.submittedAt ?? a.runningSince ?? "");
        case "deadline":
        default: return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
    });
    return sorted;
  }, [tasks, typeFilter, search, filters, sort]);

  const counts = useMemo(() => {
    const active = tasks.filter((t) => ["assigned", "in_progress", "paused", "revision"].includes(t.lifecycle)).length;
    const review = tasks.filter((t) => t.lifecycle === "review").length;
    const revision = tasks.filter((t) => t.lifecycle === "revision").length;
    return { active, review, revision };
  }, [tasks]);

  console.log("TASKS STATE", tasks);

  const isEmpty = tasks.length === 0;

  // Keyboard shortcuts
  useEffect(() => {
    let lastG = 0;
    const onKey = (e: KeyboardEvent) => {
      const inField = ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName ?? "");
      if (e.key === "?" && !inField) { e.preventDefault(); setShortcutsOpen(true); return; }
      if (e.key === "/" && !inField) {
        e.preventDefault();
        document.getElementById("tasks-search")?.focus();
        return;
      }
      if (e.key === " " && !inField) {
        e.preventDefault();
        const active = tasks.find((t) => t.lifecycle === "in_progress");
        if (active) pauseTask(active.id);
        else {
          const first = tasks.find((t) => t.lifecycle === "paused") ?? tasks.find((t) => t.lifecycle === "assigned");
          if (first) startTask(first.id);
        }
        return;
      }
      if (!inField && e.key === "g") { lastG = Date.now(); return; }
      if (!inField && e.key === "t" && Date.now() - lastG < 800) {
        toast("Refreshed");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tasks, pauseTask, startTask]);

  return (
    <AppShell>
      <div className="space-y-4 max-w-[1700px]">
        {/* Header */}
        <header className="flex flex-wrap items-center gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">My Tasks</h1>
            <p className="text-sm text-muted-foreground">
              {counts.active} active · {counts.review} awaiting review · {counts.revision} need revision
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2 flex-wrap">
           <SegmentedType
  value={typeFilter}
  onChange={setTypeFilter}
  department={department}
/>
            <div className="relative">
              <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="tasks-search"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[240px] pl-8"
              />
            </div>
            <TaskFilters value={filters} onChange={setFilters} />
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline">Sort: Deadline</SelectItem>
                <SelectItem value="priority">Sort: Priority</SelectItem>
                <SelectItem value="updated">Sort: Recently updated</SelectItem>
                <SelectItem value="project">Sort: Deliverable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        {/* Mobile fallback notice */}
        <div className="md:hidden rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
          This view works best on a larger screen. Showing a compact list.
        </div>

        {/* Body */}
        {isEmpty ? <PageEmptyState /> : (
          <TasksBoard
            tasks={visible}
            loading={loading}
            store={useActiveTask}
            onSubmit={(t) => setSubmitTask(t)}
            onOpenDetail={(t) =>
  navigate({
    to: "/employee/tasks/$taskId",
    params: { taskId: t.id },
  })
}
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
          if (submitTask) submitForReview(submitTask.id, note, files);
          setSubmitTask(null);
          toast.success("Submitted for review");
        }}
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

      {/* Keyboard shortcuts cheat sheet */}
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <ul className="text-sm space-y-2">
            <Shortcut keys={["Space"]} desc="Toggle play/pause on active task" />
            <Shortcut keys={["/"]} desc="Focus search" />
            <Shortcut keys={["g", "t"]} desc="Go to My Tasks" />
            <Shortcut keys={["?"]} desc="Open this dialog" />
          </ul>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Shortcut({ keys, desc }: { keys: string[]; desc: string }) {
  return (
    <li className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{desc}</span>
      <span className="flex items-center gap-1">
        {keys.map((k) => (
          <kbd key={k} className="px-1.5 py-0.5 text-[11px] rounded border bg-muted font-mono">{k}</kbd>
        ))}
      </span>
    </li>
  );
}

function SegmentedType({
  value,
  onChange,
  department,
}: {
  value: "all" | MyProjectType;
  onChange: (v: "all" | MyProjectType) => void;
  department: string;
}) {
  let opts: { v: "all" | MyProjectType; label: string }[] = [];

if (department === "Video Producer") {
  opts = [
    { v: "video", label: "Shoot" },
    { v: "edit", label: "Edit" },
  ];
}

else if (department === "Content Writer") {
  opts = [
    { v: "video", label: "Shoot" },
    { v: "edit", label: "Edit" },
    { v: "static", label: "Static" },
  ];
}

else if (department === "Graphic Designer") {
  return null;
}
  return (
    <div className="inline-flex rounded-md border bg-card p-0.5 text-sm">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            "px-3 py-1 rounded transition-colors",
            value === o.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PageEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-3">
      <div className="size-16 rounded-full bg-accent grid place-items-center">
        <Coffee className="size-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold">All caught up!</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        You don't have any tasks assigned right now. Check back later or message your manager.
      </p>
    </div>
  );
}
