import { AlertTriangle, ArrowRight, CheckCircle2, Info, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Insight } from "@/data/mockDeliverables";

const META: Record<Insight["severity"], { icon: typeof Info; text: string; ring: string }> = {
  critical: { icon: TrendingDown, text: "text-status-overdue", ring: "border-l-status-overdue" },
  warning: { icon: AlertTriangle, text: "text-status-progress", ring: "border-l-status-progress" },
  info: { icon: Info, text: "text-status-review", ring: "border-l-status-review" },
  positive: { icon: CheckCircle2, text: "text-status-done", ring: "border-l-status-done" },
};

export function InsightCard({ insight, onDrill }: { insight: Insight; onDrill?: (tab: Insight["tab"]) => void }) {
  const m = META[insight.severity];
  const Icon = m.icon;
  return (
    <button
      type="button"
      onClick={() => onDrill?.(insight.tab)}
      className={cn(
        "group flex w-full gap-3 rounded-lg border border-l-4 bg-card p-3 text-left transition-colors hover:bg-accent/50",
        m.ring,
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", m.text)} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{insight.title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{insight.body}</div>
      </div>
      {onDrill && (
        <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  );
}