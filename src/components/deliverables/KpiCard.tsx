import { ArrowDown, ArrowUp, Info, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/analytics/charts/Sparkline";

interface Props {
  label: string;
  value: string;
  sub?: string;
  info: string;
  spark?: number[];
  /** tone overrides the value color for the headline health number */
  tone?: "good" | "warn" | "bad" | "neutral";
  delta?: { pct: number; dir: "up" | "down" | "flat" } | null;
  lowerIsBetter?: boolean;
  showDelta?: boolean;
}

export function KpiCard({ label, value, sub, info, spark, tone = "neutral", delta, lowerIsBetter = false, showDelta = false }: Props) {
  const valueColor =
    tone === "good" ? "text-status-done" : tone === "warn" ? "text-status-progress" : tone === "bad" ? "text-status-overdue" : "text-foreground";

  const DeltaIcon = delta?.dir === "up" ? ArrowUp : delta?.dir === "down" ? ArrowDown : Minus;
  const deltaGood = delta?.dir === "flat" ? null : lowerIsBetter ? delta?.dir === "down" : delta?.dir === "up";

  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-label={`About ${label}`} className="text-muted-foreground/60 hover:text-foreground">
              <Info className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-[230px] text-xs">{info}</TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className={cn("font-mono text-2xl font-semibold tabular", valueColor)}>{value}</span>
        {showDelta && delta && delta.dir !== "flat" && (
          <span className={cn("flex items-center gap-0.5 text-xs font-medium", deltaGood ? "text-status-done" : "text-status-overdue")}>
            <DeltaIcon className="size-3" />
            {Math.abs(delta.pct).toFixed(0)}%
          </span>
        )}
      </div>
      {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
      {spark && spark.length > 1 && (
        <Sparkline data={spark} color={tone === "good" ? "var(--color-status-done)" : tone === "bad" ? "var(--color-status-overdue)" : "var(--color-primary)"} />
      )}
    </Card>
  );
}