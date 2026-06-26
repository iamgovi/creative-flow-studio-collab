import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GripVertical, MoreHorizontal, Sparkles, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { SetupTask, Teammate } from "@/data/mockSetup";
import type { Priority } from "@/data/mock";
import { AssigneeCell } from "./AssigneeCell";
import type { WorkloadInfo } from "@/hooks/useWorkloadCalc";
import { getSkillMatch } from "@/hooks/useSkillMatch";

const PRIORITIES: Priority[] = ["low", "medium", "high", "critical"];

export function TaskRow({
  task,
  team,
  workload,
  selected,
  projectDeadline,
  onUpdate,
  onSelect,
  onDelete,
  onDuplicate,
  onAssign,
}: {
  task: SetupTask;
  team: Teammate[];
  workload: Map<string, WorkloadInfo>;
  selected: boolean;
  projectDeadline: Date;
  onUpdate: (id: string, patch: Partial<SetupTask>) => void;
  onSelect: (id: string, sel: boolean) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAssign: (taskId: string, teammateId: string | null) => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [desc, setDesc] = useState(task.description);

  const taskDeadline = new Date(task.deadline);
  const deadlineInvalid = taskDeadline > projectDeadline;

  // suggestions for unassigned tasks
  const suggestions = !task.assigneeId
    ? [...team]
        .map((tm) => ({
          tm,
          match: getSkillMatch(tm.role, task.stage),
          load: workload.get(tm.id)!.pct,
        }))
        .filter((s) => s.match !== "unlikely")
        .sort((a, b) => {
          const order = { perfect: 0, possible: 1, unlikely: 2 };
          return order[a.match] - order[b.match] || a.load - b.load;
        })
        .slice(0, 2)
    : [];

  return (
    <div className="grid grid-cols-[20px_20px_minmax(0,2.5fr)_70px_90px_120px_minmax(0,1.5fr)_30px] items-center gap-2 px-3 py-2 hover:bg-accent/40 group border-t">
      <button className="text-muted-foreground/50 hover:text-foreground cursor-grab" aria-label="Drag">
        <GripVertical className="size-4" />
      </button>
      <Checkbox checked={selected} onCheckedChange={(v) => onSelect(task.id, !!v)} />

      <div className="min-w-0">
        {editingTitle ? (
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              setEditingTitle(false);
              if (title.trim()) onUpdate(task.id, { title: title.trim() });
              else setTitle(task.title);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") {
                setTitle(task.title);
                setEditingTitle(false);
              }
            }}
            className="h-7"
          />
        ) : (
          <button
            onClick={() => setEditingTitle(true)}
            className="text-sm font-medium text-left truncate w-full hover:text-primary"
          >
            {task.title}
          </button>
        )}
        {editingDesc ? (
          <Input
            autoFocus
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={() => {
              setEditingDesc(false);
              onUpdate(task.id, { description: desc });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") {
                setDesc(task.description);
                setEditingDesc(false);
              }
            }}
            className="h-6 text-xs mt-1"
          />
        ) : (
          <button
            onClick={() => setEditingDesc(true)}
            className="text-xs text-muted-foreground text-left truncate w-full hover:text-foreground"
          >
            {task.description || "Add description"}
          </button>
        )}
        {suggestions.length > 0 && (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Sparkles className="size-3 text-primary" />
            <span>Suggested:</span>
            {suggestions.map((s) => (
              <button
                key={s.tm.id}
                onClick={() => onAssign(task.id, s.tm.id)}
                className="text-primary hover:underline"
              >
                {s.tm.name.split(" ")[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      <Input
        type="number"
        value={task.hours}
        min={0}
        onChange={(e) => onUpdate(task.id, { hours: Number(e.target.value) || 0 })}
        className="h-7 text-sm tabular"
      />

      <Select
        value={task.priority}
        onValueChange={(v) => onUpdate(task.id, { priority: v as Priority })}
      >
        <SelectTrigger className="h-7 text-xs capitalize">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRIORITIES.map((p) => (
            <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "h-7 px-2 rounded border text-xs inline-flex items-center gap-1.5 hover:bg-accent",
              deadlineInvalid && "border-status-overdue text-status-overdue"
            )}
          >
            {deadlineInvalid && <AlertTriangle className="size-3" />}
            {format(taskDeadline, "MMM d")}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={taskDeadline}
            onSelect={(d) => d && onUpdate(task.id, { deadline: d.toISOString() })}
            disabled={(d) => d > projectDeadline}
            className={cn("p-3 pointer-events-auto")}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <AssigneeCell task={task} team={team} workload={workload} onAssign={onAssign} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onDuplicate(task.id)}>Duplicate</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
