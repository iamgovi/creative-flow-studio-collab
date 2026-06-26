import { createFileRoute, useNavigate, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { toast } from "sonner";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  incomingProjects,
  generateTasks,
  team as initialTeam,
  type SetupTask,
} from "@/data/mockSetup";
import { ProjectBriefHeader } from "@/components/setup/ProjectBriefHeader";
import { StageGroup } from "@/components/setup/StageGroup";
import { SetupFooter } from "@/components/setup/SetupFooter";
import { LaunchConfirmDialog } from "@/components/setup/LaunchConfirmDialog";
import { useWorkloadCalc } from "@/hooks/useWorkloadCalc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckSquare, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/manager/projects_/$id/setup")({
  component: ProjectSetup,
  loader: ({ params }) => {
    const project = incomingProjects.find((p) => p.id === params.id);
    if (!project) throw notFound();
    return { project };
  },
});

function ProjectSetup() {
  const { project } = Route.useLoaderData();
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState(project.name);
  const [tasks, setTasks] = useState<SetupTask[]>(() => generateTasks(project));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const team = initialTeam;
  const workload = useWorkloadCalc(team, tasks);
  const projectDeadline = useMemo(() => new Date(project.deadline), [project.deadline]);

  const stages = useMemo(() => {
    const order: string[] = [];
    const grouped = new Map<string, SetupTask[]>();
    for (const t of tasks) {
      if (!grouped.has(t.stage)) {
        grouped.set(t.stage, []);
        order.push(t.stage);
      }
      grouped.get(t.stage)!.push(t);
    }
    return order.map((s) => ({ stage: s, tasks: grouped.get(s)! }));
  }, [tasks]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const onAssign = (taskId: string, teammateId: string | null) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, assigneeId: teammateId } : t)));
  };

  const onUpdate = (id: string, patch: Partial<SetupTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const onDelete = (id: string) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === id);
      if (!task) return prev;
      const sameStage = prev.filter((t) => t.stage === task.stage);
      if (sameStage.length <= 1) {
        toast.error("At least one task per stage is required");
        return prev;
      }
      return prev.filter((t) => t.id !== id);
    });
  };

  const onDuplicate = (id: string) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx < 0) return prev;
      const dup: SetupTask = {
        ...prev[idx],
        id: `${prev[idx].id}-copy-${Date.now()}`,
        title: `${prev[idx].title} (copy)`,
        assigneeId: null,
      };
      const next = [...prev];
      next.splice(idx + 1, 0, dup);
      return next;
    });
  };

  const onAddTask = (stage: string) => {
    const newTask: SetupTask = {
      id: `new-${Date.now()}`,
      stage,
      title: "New task",
      description: "",
      hours: 2,
      priority: "medium",
      deadline: project.deadline,
      assigneeId: null,
    };
    setTasks((prev) => {
      const lastIdx = prev.map((t) => t.stage).lastIndexOf(stage);
      const next = [...prev];
      next.splice(lastIdx + 1, 0, newTask);
      return next;
    });
  };

  const onSelect = (id: string, sel: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (sel) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const teammateId = active.data.current?.teammateId as string | undefined;
    const taskId = over.data.current?.taskId as string | undefined;
    if (teammateId && taskId) {
      onAssign(taskId, teammateId);
      const tm = team.find((t) => t.id === teammateId);
      if (tm) toast.success(`Assigned to ${tm.name}`);
    }
  };

  const bulkAssign = (teammateId: string) => {
    setTasks((prev) =>
      prev.map((t) => (selected.has(t.id) ? { ...t, assigneeId: teammateId } : t))
    );
    toast.success(`Assigned ${selected.size} tasks`);
    setSelected(new Set());
  };

  const bulkDelete = () => {
    setTasks((prev) => prev.filter((t) => !selected.has(t.id)));
    toast.success(`Deleted ${selected.size} tasks`);
    setSelected(new Set());
  };

  const handleLaunch = () => setConfirmOpen(true);
  const confirmLaunch = () => {
    setConfirmOpen(false);
    const involved = new Set(tasks.map((t) => t.assigneeId).filter(Boolean)).size;
    toast.success(`Project launched — ${tasks.length} tasks assigned to ${involved} teammates.`);
    navigate({ to: "/manager/dashboard" });
  };

  return (
    <AppShell>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="space-y-4 max-w-7xl pb-24">
          <ProjectBriefHeader
            project={{ ...project, name: projectName }}
            onRename={setProjectName}
          />

          {/* "Apply previous assignments" hint banner */}
          <Card className="px-4 py-3 flex items-center gap-3 bg-primary/5 border-primary/20">
            <div className="text-sm flex-1">
              <span className="font-medium">Apply previous assignments?</span>{" "}
              <span className="text-muted-foreground">
                You ran a similar {project.type} project for {project.client} last quarter.
              </span>
            </div>
            <Button size="sm" variant="outline">Apply</Button>
            <Button size="sm" variant="ghost">Dismiss</Button>
          </Card>

          <div className="space-y-3">
            {stages.map(({ stage, tasks: stageTasks }) => (
              <StageGroup
                key={stage}
                stage={stage}
                tasks={stageTasks}
                team={team}
                workload={workload}
                selectedIds={selected}
                projectDeadline={projectDeadline}
                onUpdate={onUpdate}
                onSelect={onSelect}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onAssign={onAssign}
                onAddTask={onAddTask}
              />
            ))}
          </div>

          {selected.size > 0 && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-foreground text-background rounded-full shadow-lg px-4 py-2 flex items-center gap-3 text-sm">
              <CheckSquare className="size-4" />
              <span>{selected.size} task{selected.size !== 1 ? "s" : ""} selected</span>
              <span className="text-background/40">·</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hover:underline">Assign to ▼</button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {team.map((tm) => (
                    <DropdownMenuItem key={tm.id} onClick={() => bulkAssign(tm.id)}>
                      {tm.name} — {tm.role}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <span className="text-background/40">·</span>
              <button onClick={bulkDelete} className="text-status-overdue hover:underline">
                Delete
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="ml-2 size-6 rounded-full hover:bg-background/10 flex items-center justify-center"
                aria-label="Clear selection"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          <SetupFooter
            tasks={tasks}
            team={team}
            workload={workload}
            projectDeadline={projectDeadline}
            onSaveDraft={() => toast.success("Draft saved")}
            onLaunch={handleLaunch}
          />

          <LaunchConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            projectName={projectName}
            taskCount={tasks.length}
            teammateCount={new Set(tasks.map((t) => t.assigneeId).filter(Boolean)).size}
            firstStage={stages[0]?.stage ?? ""}
            onConfirm={confirmLaunch}
          />
        </div>
      </DndContext>
    </AppShell>
  );
}

export function NotFoundFallback() {
  return (
    <AppShell>
      <div className="max-w-md mx-auto py-20 text-center">
        <h2 className="text-xl font-semibold">Project not found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          The project you&rsquo;re looking for may have been launched already.
        </p>
        <Link to="/manager/dashboard" className="text-primary text-sm mt-4 inline-block hover:underline">
          Back to dashboard
        </Link>
      </div>
    </AppShell>
  );
}
