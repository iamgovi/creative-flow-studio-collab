import { useDroppable } from "@dnd-kit/core";
import { Sun, Play, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lifecycle, MyTask } from "@/data/myTasks";
import { LIFECYCLE_LABEL } from "@/data/myTasks";

const ACCENT: Record<Lifecycle, string> = {
  assigned: "bg-slate-400",
  in_progress: "bg-amber-500",
  paused: "bg-gray-400",
  review: "bg-blue-500",
  revision: "bg-status-overdue",
  done: "bg-status-done",
};

export function TaskColumn({
  id,
  count,
  highlight,
  dimmed,
  children,
  isEmpty,
}: {
  id: Lifecycle;
  count: number;
  highlight?: boolean;
  dimmed?: boolean;
  children: React.ReactNode;
  isEmpty: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-[300px] shrink-0 flex flex-col rounded-lg border bg-muted/30 transition-all",
        highlight && "border-dashed border-primary border-2 bg-primary/5",
        dimmed && "opacity-40",
        isOver && highlight && "bg-primary/10",
      )}
    >
      <div className="px-3 py-2.5 flex items-center gap-2 border-b">
        <span className={cn("size-2 rounded-full", ACCENT[id])} />
        <h2 className="text-sm font-semibold">{LIFECYCLE_LABEL[id]}</h2>
        <span className="ml-auto text-xs text-muted-foreground tabular">{count}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]">
        {isEmpty ? <EmptyState id={id} /> : children}
      </div>
    </div>
  );
}

function EmptyState({ id }: { id: Lifecycle }) {
  const map: Record<Lifecycle, { icon?: React.ReactNode; text: string }> = {
    assigned: { icon: <Sun className="size-5 text-muted-foreground/60" />, text: "Nothing on your plate" },
    in_progress: { icon: <Play className="size-5 text-muted-foreground/60" />, text: "Pick a task and hit play to start" },
    paused: { text: "No paused tasks" },
    review: { text: "No submissions pending review" },
    revision: { icon: <PartyPopper className="size-5 text-muted-foreground/60" />, text: "No revisions requested 🎉" },
    done: { text: "No completed tasks yet" },
  };
  const { icon, text } = map[id];
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
      {icon}
      <p className="text-xs text-muted-foreground px-4">{text}</p>
    </div>
  );
}

export function ColumnSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="border rounded-lg bg-card p-3 h-[140px] animate-pulse" />
      ))}
    </div>
  );
}

export type { MyTask };
