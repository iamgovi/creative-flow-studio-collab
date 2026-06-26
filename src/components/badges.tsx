import { cn } from "@/lib/utils";
import type { TaskStatus, Priority } from "@/data/mock";

const STATUS_LABEL: Record<TaskStatus, string> = {
  assigned: "Assigned",
  in_progress: "In Progress",
  review: "Under Review",
  revision: "Revision",
  done: "Completed",
};

const STATUS_CLS: Record<TaskStatus, string> = {
  assigned: "bg-status-idle/15 text-foreground border-status-idle/30",
  in_progress: "bg-status-progress/15 text-status-progress border-status-progress/30",
  review: "bg-status-review/15 text-status-review border-status-review/30",
  revision: "bg-status-overdue/15 text-status-overdue border-status-overdue/30",
  done: "bg-status-done/15 text-status-done border-status-done/30",
};

export function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border font-medium", STATUS_CLS[status], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

const PRI_CLS: Record<Priority, string> = {
  low: "bg-priority-low/15 text-priority-low border-priority-low/30",
  medium: "bg-priority-medium/15 text-priority-medium border-priority-medium/30",
  high: "bg-priority-high/15 text-priority-high border-priority-high/30",
  critical: "bg-priority-critical/15 text-priority-critical border-priority-critical/30",
};

export function PriorityChip({ priority }: { priority: Priority }) {
  return (
    <span className={cn("inline-flex px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide font-semibold border", PRI_CLS[priority])}>
      {priority}
    </span>
  );
}
