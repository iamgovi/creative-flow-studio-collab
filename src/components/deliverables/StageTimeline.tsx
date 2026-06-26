import { Check, Clock, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/deliverablesMath";
import type { StageEntry } from "@/data/mockDeliverables";

/**
 * READ-ONLY high-level stage progression for a deliverable. Shows which stages
 * are done / in progress / pending with dates and any delay — NOT a kanban and
 * not task-level. The admin sees "Editing took 9 days, 4 over estimate".
 */
export function StageTimeline({ timeline }: { timeline: StageEntry[] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-5">
      {timeline.map((s, i) => {
        const done = s.status === "done";
        const active = s.status === "in-progress";
        const Icon = done ? Check : active ? Clock : Circle;
        return (
          <li key={s.stage} className="relative">
            {i < timeline.length - 1 && (
              <span className="absolute left-3 top-3 hidden h-px w-full bg-border sm:block" aria-hidden />
            )}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "z-10 flex size-6 shrink-0 items-center justify-center rounded-full border",
                  done && "border-status-done bg-status-done/10 text-status-done",
                  active && "border-status-progress bg-status-progress/10 text-status-progress",
                  !done && !active && "border-border bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-3" />
              </span>
              <span className="text-sm font-medium">{s.stage}</span>
            </div>
            <div className="mt-1.5 space-y-0.5 pl-8 text-[11px] text-muted-foreground">
              {s.start ? (
                <div>
                  {fmtDate(s.start)}
                  {s.end ? ` → ${fmtDate(s.end)}` : " → now"}
                </div>
              ) : (
                <div>Not started</div>
              )}
              <div>
                Est {s.estimateDays}d
                {s.actualDays != null && ` · actual ${s.actualDays}d`}
              </div>
              {s.delayDays > 0 && (
                <div className="font-medium text-status-overdue">+{s.delayDays}d over estimate</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}