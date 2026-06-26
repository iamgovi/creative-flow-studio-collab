import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Play, Pause, CheckCircle2, Clock, MoreHorizontal, Film, Palette,
  MessageCircle, Paperclip, RotateCcw, AlertTriangle, CheckCheck, Link2,
  ArrowDownToLine, ArrowUpFromLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { fmtHMS, fmtHMShort, useTimer } from "@/hooks/useTimer";
import type { MyTask, MyPriority } from "@/data/myTasks";
import { myProjects } from "@/data/myTasks";
import { formatDistanceToNow } from "date-fns";

const PRI_DOT: Record<MyPriority, string> = {
  low: "bg-priority-low",
  medium: "bg-priority-medium",
  high: "bg-priority-high",
  critical: "bg-priority-critical",
};
const PRI_LABEL: Record<MyPriority, string> = {
  low: "Low", medium: "Medium", high: "High", critical: "Critical",
};

interface Props {
  task: MyTask;
  shake?: boolean;
  onStart: () => void;
  onPause: () => void;
  onSubmit: () => void;
  onResume: () => void;
  onResumeRevision: () => void;
  onOpenDetail: () => void;
  /** Present only on deliverable-linked manager tasks: jumps to Deliverables. */
  onOpenDeliverable?: () => void;
}

export function TaskCard(props: Props) {
  const { task } = props;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const project = myProjects.find((p) => p.id === task.projectId);

  const liveSec = useTimer(task.runningSince);
  const totalSec = task.accumulatedMin * 60 + liveSec;

  const overdue = new Date(task.deadline).getTime() < Date.now() && task.lifecycle !== "done";

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group bg-card border rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing",
        props.shake && "animate-shake border-status-overdue",
      )}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Avoid opening drawer when clicking action buttons / menus
        if ((e.target as HTMLElement).closest("[data-no-drawer]")) return;
        props.onOpenDetail();
      }}
    >
      {/* Zone A — meta strip */}
      <div className="h-6 px-3 pt-2 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", PRI_DOT[task.priority], task.priority === "critical" && "animate-pulse")} />
          <span className="text-muted-foreground">{PRI_LABEL[task.priority]}</span>
        </span>
        <div data-no-drawer onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-60 hover:opacity-100 p-0.5 rounded hover:bg-accent">
                <MoreHorizontal className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={props.onOpenDetail}>View details</DropdownMenuItem>
              <DropdownMenuItem>Add comment</DropdownMenuItem>
              <DropdownMenuItem>View deliverable</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Zone B — title + project */}
      <div className="px-3 pt-1">
        <h3 className="text-sm font-semibold leading-snug line-clamp-2">{task.title}</h3>
        {task.source === "deliverable" ? (
          <button
            data-no-drawer
            onClick={(e) => { e.stopPropagation(); props.onOpenDeliverable?.(); }}
            className="mt-1 flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer max-w-full"
            title="Open in Deliverables"
          >
            <Link2 className="size-3 shrink-0" />
            <span className="truncate">
              {task.clientName} · {task.deliverableName}{task.stageLabel ? ` · ${task.stageLabel}` : ""}
            </span>
          </button>
        ) : task.source === "personal" ? (
          <div className="mt-1">
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Personal
            </span>
          </div>
        ) : (
          <div
            data-no-drawer
            onClick={(e) => e.stopPropagation()}
            className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {project?.type === "video" ? <Film className="size-3" /> : <Palette className="size-3" />}
            <span className="truncate">{project?.name} · {project?.stage}</span>
          </div>
        )}
      </div>

      {/* Zone C — timer + deadline */}
      <div className="px-3 pt-2.5 flex items-center justify-between gap-2">
        {(task.lifecycle === "in_progress" || task.lifecycle === "paused" || task.accumulatedMin > 0) ? (
          <TimerBlock task={task} totalSec={totalSec} />
        ) : <span />}
        <DeadlineBlock deadline={task.deadline} overdue={overdue} done={task.lifecycle === "done"} />
      </div>

      {/* Transfer meter */}
      <div className="px-3 pt-2.5">
        <TransferMeter task={task} />
      </div>

      {/* Zone D — actions per column */}
      <div className="px-3 pt-3 pb-3" data-no-drawer onClick={(e) => e.stopPropagation()}>
        {task.lifecycle === "assigned" && (
          <Button size="sm" className="w-full" onClick={props.onStart}>
            <Play className="size-3.5" /> Start Task
          </Button>
        )}
        {task.lifecycle === "in_progress" && (
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="flex-1" onClick={props.onPause}>
              <Pause className="size-3.5" /> Pause
            </Button>
            <Button size="sm" className="flex-1" onClick={props.onSubmit}>
              <CheckCircle2 className="size-3.5" /> Ready
            </Button>
          </div>
        )}
        {task.lifecycle === "paused" && (
          <Button size="sm" className="w-full" onClick={props.onResume}>
            <Play className="size-3.5" /> Resume
          </Button>
        )}
        {task.lifecycle === "review" && task.submittedAt && (
          <p className="text-xs italic text-muted-foreground">
            Submitted {formatDistanceToNow(new Date(task.submittedAt), { addSuffix: true })} · Awaiting manager review
          </p>
        )}
        {task.lifecycle === "revision" && (
          <div className="space-y-2">
            <div className="rounded-md border border-status-overdue/40 bg-status-overdue/10 p-2 text-xs">
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="size-3.5 text-status-overdue shrink-0 mt-0.5" />
                <div>
                  <span className="text-status-overdue font-medium">Manager note: </span>
                  <span className="text-foreground">
                    {(task.revisionNote ?? "").slice(0, 80)}
                    {(task.revisionNote?.length ?? 0) > 80 && (
                      <button className="ml-1 text-status-overdue hover:underline" onClick={props.onOpenDetail}>Read more →</button>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <Button size="sm" className="w-full" onClick={props.onResumeRevision}>
              <Play className="size-3.5" /> Resume Work
            </Button>
          </div>
        )}
        {task.lifecycle === "done" && task.approvedBy && task.approvedAt && (
          <p className="text-xs text-status-done flex items-center gap-1">
            <CheckCheck className="size-3.5" />
            Approved by {task.approvedBy} · {new Date(task.approvedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </p>
        )}
      </div>

      {/* Zone E — activity */}
      {(task.comments > 0 || task.attachments > 0 || task.revisions > 0) && (
        <div className="px-3 pb-2.5 -mt-1 flex items-center gap-3 text-xs text-muted-foreground border-t pt-2">
          {task.comments > 0 && <span className="inline-flex items-center gap-1"><MessageCircle className="size-3" />{task.comments}</span>}
          {task.attachments > 0 && <span className="inline-flex items-center gap-1"><Paperclip className="size-3" />{task.attachments}</span>}
          {task.revisions > 0 && <span className="inline-flex items-center gap-1"><RotateCcw className="size-3" />{task.revisions}</span>}
        </div>
      )}
    </div>
  );
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function TransferMeter({ task }: { task: MyTask }) {
  const h = hash(task.id);
  const isDone = task.lifecycle === "done";
  const isReview = task.lifecycle === "review";
  const isProgress = task.lifecycle === "in_progress";
  const dl = isDone ? 100 : isReview ? 100 : isProgress ? 35 + (h % 55) : 10 + (h % 40);
  const ul = isDone ? 100 : isReview ? 70 + (h % 25) : isProgress ? 10 + (h % 35) : (h % 12);
  const dlSpeed = (1.2 + ((h >> 3) % 80) / 10).toFixed(1);
  const ulSpeed = (0.4 + ((h >> 5) % 30) / 10).toFixed(1);
  return (
    <div className="grid grid-cols-2 gap-2 text-[10px]">
      <MeterRow
        icon={<ArrowDownToLine className="size-3 text-status-progress" />}
        label="DL"
        pct={dl}
        speed={`${dlSpeed} MB/s`}
        barCls="bg-status-progress"
        active={isProgress || isReview}
      />
      <MeterRow
        icon={<ArrowUpFromLine className="size-3 text-status-review" />}
        label="UL"
        pct={ul}
        speed={`${ulSpeed} MB/s`}
        barCls="bg-status-review"
        active={isReview || isDone}
      />
    </div>
  );
}

function MeterRow({
  icon, label, pct, speed, barCls, active,
}: { icon: React.ReactNode; label: string; pct: number; speed: string; barCls: string; active: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-muted-foreground font-medium">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barCls, active && "animate-pulse")}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
      <span className="font-mono tabular text-muted-foreground">{active ? speed : `${pct}%`}</span>
    </div>
  );
}

function TimerBlock({ task, totalSec }: { task: MyTask; totalSec: number }) {
  if (task.lifecycle === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <span className="size-2 rounded-full bg-status-done animate-pulse" />
        <span className="font-mono text-primary font-medium tabular">{fmtHMS(totalSec)}</span>
      </span>
    );
  }
  if (task.lifecycle === "paused") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Pause className="size-3" />
        <span className="font-mono tabular">{fmtHMS(totalSec)}</span>
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground font-mono tabular">{fmtHMShort(task.accumulatedMin)}</span>;
}

function DeadlineBlock({ deadline, overdue, done }: { deadline: string; overdue: boolean; done: boolean }) {
  const ms = new Date(deadline).getTime();
  const now = Date.now();
  const diffDays = Math.round((ms - now) / 86400_000);
  let label = "";
  let cls = "text-muted-foreground";
  if (overdue) {
    const od = Math.abs(diffDays);
    label = `${od}d overdue`;
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-status-overdue/10 text-status-overdue font-semibold px-2 py-0.5 text-xs">
        <AlertTriangle className="size-3" /> {label}
      </span>
    );
  }
  if (done) {
    label = `Due ${new Date(deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  } else if (diffDays <= 0) {
    label = "Due today"; cls = "text-amber-600 font-medium dark:text-amber-400";
  } else if (diffDays === 1) {
    label = "Due tomorrow"; cls = "text-amber-600 font-medium dark:text-amber-400";
  } else if (diffDays <= 7) {
    label = `Due in ${diffDays}d`; cls = "text-foreground";
  } else {
    label = `Due ${new Date(deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", cls)}>
      <Clock className="size-3" /> {label}
    </span>
  );
}
