import { fmtHM } from "@/lib/analyticsMath";
import type { RecentTask } from "@/data/mockAnalytics";

export function WorkVsElapsedBars({ tasks }: { tasks: RecentTask[] }) {
  const max = Math.max(...tasks.map((t) => t.elapsedSec), 1);
  return (
    <div className="space-y-3">
      {tasks.map((t) => {
        const workPct = (t.workSec / max) * 100;
        const elapsedPct = (t.elapsedSec / max) * 100;
        return (
          <div key={t.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate font-medium">{t.title}</span>
              <span className="text-muted-foreground font-mono">
                {fmtHM(t.workSec)} work · {fmtHM(t.elapsedSec)} elapsed
              </span>
            </div>
            <div className="relative h-3 rounded-full bg-muted overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full bg-primary/25" style={{ width: `${elapsedPct}%` }} />
              <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${workPct}%` }} />
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-4 pt-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" /> Hands-on work</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary/25" /> Total elapsed</span>
      </div>
    </div>
  );
}