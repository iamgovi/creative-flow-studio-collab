import { useState } from "react";
import { useOpenMember } from "@/hooks/use-current-role";
import {
  Award,
  ChevronRight,
  HelpCircle,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Heart,
  GitBranch,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import type { Insight, InsightCategory, InsightSeverity } from "@/data/mockAnalytics";
import { cn } from "@/lib/utils";

const ICON: Record<InsightCategory, typeof Award> = {
  strength: Award,
  growth: Sparkles,
  wellbeing: Heart,
  bottleneck: GitBranch,
  trend: TrendingUp,
  anomaly: TrendingDown,
};

const SEVERITY: Record<InsightSeverity, { ring: string; text: string; bg: string }> = {
  positive: { ring: "border-l-status-done", text: "text-status-done", bg: "bg-status-done/10" },
  caution: { ring: "border-l-status-progress", text: "text-status-progress", bg: "bg-status-progress/10" },
  problem: { ring: "border-l-status-overdue", text: "text-status-overdue", bg: "bg-status-overdue/10" },
  neutral: { ring: "border-l-status-idle", text: "text-muted-foreground", bg: "bg-muted" },
};

export function InsightCard({ insight, onDismiss }: { insight: Insight; onDismiss?: (id: string) => void }) {
  const [showWhy, setShowWhy] = useState(false);
  const openMember = useOpenMember();
  const Icon = ICON[insight.category];
  const sev = SEVERITY[insight.severity];

  const onAction = () => {
    if (insight.actionTo) openMember(insight.actionTo);
    else toast.info(insight.action);
  };

  return (
    <Card className={cn("relative border-l-4 p-4", sev.ring)}>
      {onDismiss && (
        <button
          type="button"
          onClick={() => onDismiss(insight.id)}
          aria-label="Dismiss insight"
          className="absolute right-2 top-2 text-muted-foreground/60 hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
      <div className="flex gap-3 pr-4">
        <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", sev.bg)}>
          <Icon className={cn("size-4", sev.text)} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm leading-snug">{insight.statement}</p>
          <div className="font-mono text-xs text-muted-foreground">{insight.miniStat}</div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 gap-1" onClick={onAction}>
              {insight.action}
              <ChevronRight className="size-3" />
            </Button>
            <button
              type="button"
              onClick={() => setShowWhy((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="size-3" />
              Why am I seeing this?
            </button>
          </div>
          {showWhy && <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">{insight.why}</p>}
        </div>
      </div>
    </Card>
  );
}