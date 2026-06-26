import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SetupTask, Teammate } from "@/data/mockSetup";
import type { WorkloadInfo } from "@/hooks/useWorkloadCalc";
import { TaskRow } from "./TaskRow";

export function StageGroup({
  stage,
  tasks,
  team,
  workload,
  selectedIds,
  projectDeadline,
  onUpdate,
  onSelect,
  onDelete,
  onDuplicate,
  onAssign,
  onAddTask,
}: {
  stage: string;
  tasks: SetupTask[];
  team: Teammate[];
  workload: Map<string, WorkloadInfo>;
  selectedIds: Set<string>;
  projectDeadline: Date;
  onUpdate: (id: string, patch: Partial<SetupTask>) => void;
  onSelect: (id: string, sel: boolean) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAssign: (taskId: string, teammateId: string | null) => void;
  onAddTask: (stage: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const assignedCount = tasks.filter((t) => t.assigneeId).length;
  const pct = tasks.length ? (assignedCount / tasks.length) * 100 : 0;

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-accent/40 text-left"
      >
        <ChevronDown
          className={cn("size-4 text-muted-foreground transition-transform", !open && "-rotate-90")}
        />
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <span className="font-medium text-sm">{stage}</span>
          <span className="text-xs text-muted-foreground">{tasks.length} tasks</span>
        </div>
        <div className="flex items-center gap-2 w-48">
          <span className="text-xs text-muted-foreground tabular">
            {assignedCount}/{tasks.length} assigned
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </button>
      {open && (
        <div>
          <div className="grid grid-cols-[20px_20px_minmax(0,2.5fr)_70px_90px_120px_minmax(0,1.5fr)_30px] gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground border-t bg-muted/30">
            <span />
            <span />
            <span>Task</span>
            <span>Hours</span>
            <span>Priority</span>
            <span>Deadline</span>
            <span>Assignee</span>
            <span />
          </div>
          {tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              team={team}
              workload={workload}
              selected={selectedIds.has(t.id)}
              projectDeadline={projectDeadline}
              onUpdate={onUpdate}
              onSelect={onSelect}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onAssign={onAssign}
            />
          ))}
          <div className="px-3 py-2 border-t bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddTask(stage)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-3.5" /> Add task to {stage}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
