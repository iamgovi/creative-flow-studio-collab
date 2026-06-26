import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Plus, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SetupTask, Teammate } from "@/data/mockSetup";
import { useDroppable } from "@dnd-kit/core";
import {
  getSkillMatch,
  MATCH_LABEL,
  MATCH_CLASS,
} from "@/hooks/useSkillMatch";
import type { WorkloadInfo } from "@/hooks/useWorkloadCalc";

export function AssigneeCell({
  task,
  team,
  workload,
  onAssign,
}: {
  task: SetupTask;
  team: Teammate[];
  workload: Map<string, WorkloadInfo>;
  onAssign: (taskId: string, teammateId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const assigned = team.find((t) => t.id === task.assigneeId) ?? null;

  const { setNodeRef, isOver } = useDroppable({
    id: `assignee-${task.id}`,
    data: { taskId: task.id },
  });

  const filtered = team.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.role.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-md transition-colors",
        isOver && "ring-2 ring-primary ring-offset-1 bg-primary/5"
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {assigned ? (
            <button className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full border bg-card hover:bg-accent text-xs max-w-full">
              <Avatar className="size-5">
                <AvatarImage src={assigned.avatar} />
                <AvatarFallback>{assigned.name[0]}</AvatarFallback>
              </Avatar>
              <span className="truncate">{assigned.name}</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onAssign(task.id, null);
                }}
                className="size-4 inline-flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
                aria-label="Unassign"
              >
                <X className="size-3" />
              </span>
            </button>
          ) : (
            <button className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-dashed text-xs text-muted-foreground hover:bg-accent">
              <Plus className="size-3" /> Assign
            </button>
          )}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-0">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search teammates"
                className="pl-7 h-8"
              />
            </div>
          </div>
          <ul className="max-h-80 overflow-auto">
            {filtered.map((tm) => {
              const wl = workload.get(tm.id)!;
              const wouldExceed = wl.total + task.hours > tm.capacity && task.assigneeId !== tm.id;
              const match = getSkillMatch(tm.role, task.stage);
              return (
                <li key={tm.id}>
                  <button
                    onClick={() => {
                      onAssign(task.id, tm.id);
                      setOpen(false);
                    }}
                    className="w-full px-3 py-2 flex items-center gap-3 hover:bg-accent text-left"
                  >
                    <Avatar className="size-8 shrink-0">
                      <AvatarImage src={tm.avatar} />
                      <AvatarFallback>{tm.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium truncate">{tm.name}</div>
                        <span
                          className={cn(
                            "text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded border",
                            MATCH_CLASS[match]
                          )}
                        >
                          {MATCH_LABEL[match]}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">{tm.role}</div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full",
                              wl.zone === "green" && "bg-status-done",
                              wl.zone === "amber" && "bg-status-progress",
                              wl.zone === "red" && "bg-status-overdue"
                            )}
                            style={{ width: `${Math.min(100, wl.pct * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground tabular">
                          {wl.total}h / {wl.capacity}h
                        </span>
                      </div>
                      {wouldExceed && (
                        <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-status-overdue">
                          <AlertTriangle className="size-3" />
                          Would exceed capacity ({wl.total + task.hours}h / {wl.capacity}h)
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No teammates found
              </li>
            )}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}
