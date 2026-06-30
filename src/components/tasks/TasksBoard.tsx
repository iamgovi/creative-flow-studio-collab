import { useMemo, useState } from "react";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { getSupabaseClient } from "@/repositories/supabase/client";
import { TaskColumn, ColumnSkeleton } from "./TaskColumn";
import { TaskCard } from "./TaskCard";
import { useActiveTask, type TaskStore } from "@/hooks/useActiveTask";
import {
  LIFECYCLE_ORDER, LEGAL_TRANSITIONS, type Lifecycle, type MyTask,
} from "@/data/myTasks";

interface Props {
  tasks: MyTask[];
  loading: boolean;
  tasksState: MyTask[];
  setTasks: React.Dispatch<React.SetStateAction<MyTask[]>>;
  onSubmit: (task: MyTask) => void;
  onOpenDetail: (task: MyTask) => void;
  /** Which board store to drive. Defaults to the shared employee store. */
  store?: TaskStore;
  /** Optional: jump to the linked deliverable from a deliverable-linked card. */
  onOpenDeliverable?: (task: MyTask) => void;
}

export function TasksBoard({
  tasks,
  loading,
  tasksState,
  setTasks,
  onSubmit,
  onOpenDetail,
  store = useActiveTask,
  onOpenDeliverable,
}: Props) {
  const startTask = store((s) => s.startTask);
  const pauseTask = store((s) => s.pauseTask);
  const resumeRevision = store((s) => s.resumeRevision);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const grouped = useMemo(() => {
    const out: Record<Lifecycle, MyTask[]> = {
      assigned: [], in_progress: [], paused: [], review: [], revision: [], done: [],
    };
    for (const t of tasks) out[t.lifecycle].push(t);
    return out;
  }, [tasks]);

  const draggedTask = activeDragId ? tasks.find((t) => t.id === activeDragId) ?? null : null;
  const allowedTargets = draggedTask ? new Set(LEGAL_TRANSITIONS[draggedTask.lifecycle]) : null;

  const handleDragStart = (e: DragStartEvent) => setActiveDragId(String(e.active.id));

  const handleDragEnd = (e: DragEndEvent) => {
    const id = String(e.active.id);
    const over = e.over?.id ? (String(e.over.id) as Lifecycle) : null;
    setActiveDragId(null);
    if (!over) return;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const allowed = LEGAL_TRANSITIONS[task.lifecycle];
    if (!allowed.includes(over)) {
      setShakeId(id);
      toast.error("You can't move this task there.");
      setTimeout(() => setShakeId(null), 500);
      return;
    }
    if (over === "review") {
      onSubmit(task);
      return;
    }
    if (over === "in_progress") {
      if (task.lifecycle === "revision") resumeRevision(id);
      else startTask(id);
      return;
    }
    if (over === "paused") pauseTask(id);
  };

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {LIFECYCLE_ORDER.map((id) => (
          <div key={id} className="w-[300px] shrink-0">
            <ColumnSkeleton />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {LIFECYCLE_ORDER.map((id) => {
          const items = grouped[id];
          const highlight = !!allowedTargets?.has(id);
          const dimmed = !!draggedTask && !highlight && draggedTask.lifecycle !== id;
          return (
            <TaskColumn
              key={id}
              id={id}
              count={items.length}
              highlight={highlight}
              dimmed={dimmed}
              isEmpty={items.length === 0}
            >
              {items.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  shake={shakeId === t.id}
                  onStart={async () => {
                    const supabase = getSupabaseClient();

                    const { error } = await supabase
                      .from("tasks")
                      .update({
                        status: "in_progress",
                        started_at: new Date().toISOString(),
                      })
                      .eq("id", t.id);

                    if (error) {
                      console.error(error);
                      return;
                    }

                    setTasks((prev) =>
                      prev.map((t) =>
                        t.id === t.id
                          ? {
                              ...t,
                              lifecycle: "in_progress",
                              runningSince: new Date().toISOString(),
                            }
                          : t
                      )
                    );
                  }}
                  onPause={async () => {
                    const supabase = getSupabaseClient();

                    const { error } = await supabase
                      .from("tasks")
                      .update({
                        status: "paused",
                        started_at: null,
                      })
                      .eq("id", t.id);

                    if (error) {
                      console.error(error);
                      return;
                    }

                    setTasks((prev) =>
                      prev.map((t) =>
                        t.id === t.id
                          ? {
                              ...t,
                              lifecycle: "paused",
                              runningSince: undefined,
                            }
                          : t
                      )
                    );
                  }}
                  onSubmit={async () => {
                    const supabase = getSupabaseClient();

                    const { error } = await supabase
                      .from("tasks")
                      .update({
                        status: "review",
                        completed_at: new Date().toISOString(),
                      })
                      .eq("id", t.id);

                    if (error) {
                      console.error(error);
                      return;
                    }

                    setTasks((prev) =>
                      prev.map((t) =>
                        t.id === t.id
                          ? {
                               ...t,
                              lifecycle: "review",
                              submittedAt: new Date().toISOString(),
                            }
                          : t
                      )
                    );
                  }}
                  onResume={async () => {
                    const supabase = getSupabaseClient();

                    const now = new Date().toISOString();

                    const { error } = await supabase
                      .from("tasks")
                      .update({
                        status: "in_progress",
                        started_at: now,
                      })
                      .eq("id", t.id);

                    if (error) {
                      console.error(error);
                      return;
                    }

                    setTasks((prev) =>
                      prev.map((t) =>
                        t.id === t.id
                          ? {
                              ...t,
                              lifecycle: "in_progress",
                              runningSince: now,
                            }
                          : t
                      )
                    );
                  }}
                  onResumeRevision={async () => {
                  const supabase = getSupabaseClient();

                  const now = new Date().toISOString();

                  const { error } = await supabase
                    .from("tasks")
                    .update({
                      status: "in_progress",
                      started_at: now,
                    })
                    .eq("id", t.id);

                  if (error) {
                    toast.error("Failed to resume task");
                    return;
                  }

                  setTasks((prev) =>
                    prev.map((task) =>
                      task.id === t.id
                        ? {
                            ...task,
                            lifecycle: "in_progress",
                            runningSince: now,
                          }
                        : task
                    )
                  );
                }}
                  onOpenDetail={() => onOpenDetail(t)}
                  onOpenDeliverable={onOpenDeliverable ? () => onOpenDeliverable(t) : undefined}
                />
              ))}
            </TaskColumn>
          );
        })}
      </div>
      <DragOverlay>{draggedTask ? <div className="opacity-80"><TaskCardGhost title={draggedTask.title} /></div> : null}</DragOverlay>
    </DndContext>
  );
}

function TaskCardGhost({ title }: { title: string }) {
  return (
    <div className="w-[280px] bg-card border rounded-lg shadow-lg p-3">
      <div className="text-sm font-semibold line-clamp-2">{title}</div>
    </div>
  );
}
