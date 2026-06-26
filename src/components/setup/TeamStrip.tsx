import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { Teammate, SetupTask } from "@/data/mockSetup";
import type { WorkloadInfo } from "@/hooks/useWorkloadCalc";

export function TeamStrip({
  team,
  tasks,
  workload,
}: {
  team: Teammate[];
  tasks: SetupTask[];
  workload: Map<string, WorkloadInfo>;
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {team.map((tm) => {
          const count = tasks.filter((t) => t.assigneeId === tm.id).length;
          const wl = workload.get(tm.id)!;
          return (
            <DraggableAvatar
              key={tm.id}
              teammate={tm}
              count={count}
              wl={wl}
              tasks={tasks.filter((t) => t.assigneeId === tm.id)}
            />
          );
        })}
        <a
          href="/team"
          target="_blank"
          rel="noreferrer"
          className="ml-2 text-xs text-primary hover:underline whitespace-nowrap"
        >
          Manage team →
        </a>
      </div>
    </TooltipProvider>
  );
}

function DraggableAvatar({
  teammate,
  count,
  wl,
  tasks,
}: {
  teammate: Teammate;
  count: number;
  wl: WorkloadInfo;
  tasks: SetupTask[];
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `teammate-${teammate.id}`,
    data: { teammateId: teammate.id },
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          className={cn(
            "flex flex-col items-center gap-1 shrink-0 cursor-grab active:cursor-grabbing",
            isDragging && "opacity-50"
          )}
        >
          <div className="relative">
            <Avatar className="size-10 ring-2 ring-card">
              <AvatarImage src={teammate.avatar} />
              <AvatarFallback>{teammate.name[0]}</AvatarFallback>
            </Avatar>
            {count > 0 && (
              <span className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center ring-2 ring-card">
                {count}
              </span>
            )}
          </div>
          <div className="h-1 w-10 rounded-full bg-muted overflow-hidden">
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
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <div className="font-medium">{teammate.name}</div>
        <div className="text-muted-foreground">{teammate.role}</div>
        <div className="text-muted-foreground">{wl.total}h / {wl.capacity}h this week</div>
        {tasks.length > 0 && (
          <div className="mt-1 border-t pt-1">
            <div className="text-muted-foreground">On this project:</div>
            {tasks.slice(0, 3).map((t) => (
              <div key={t.id} className="truncate max-w-[200px]">· {t.title}</div>
            ))}
            {tasks.length > 3 && <div className="text-muted-foreground">+{tasks.length - 3} more</div>}
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
