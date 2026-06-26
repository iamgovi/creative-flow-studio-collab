import { ArrowDown, ArrowUp, Info, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Sparkline } from "./charts/Sparkline";
import { healthyBand, type Zone } from "@/lib/analyticsMath";

interface Props {
  label: string;
  value: string;
  numericValue?: number;
  info: string;
  band?: [number, number];
  bandLabel?: string;
  spark?: number[];
  delta?: { pct: number; dir: "up" | "down" | "flat" } | null;
  /** when true, a downward delta is good (e.g. review turnaround) */
  lowerIsBetter?: boolean;
  showDelta?: boolean;
}

export function KpiCard({
  label,
  value,
  numericValue,
  info,
  band,
  bandLabel,
  spark,
  delta,
  lowerIsBetter = false,
  showDelta = false,
}: Props) {
  let zone: Zone | null = null;
  if (band && numericValue != null) zone = healthyBand(numericValue, band);

  const valueColor =
    zone === "healthy"
      ? "text-status-done"
      : zone === "low" || zone === "high"
        ? "text-status-progress"
        : "text-foreground";

  const DeltaIcon = delta?.dir === "up" ? ArrowUp : delta?.dir === "down" ? ArrowDown : Minus;
  const deltaGood =
    delta?.dir === "flat"
      ? null
      : lowerIsBetter
        ? delta?.dir === "down"
        : delta?.dir === "up";

  return (
    <Card className="p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-label={`About ${label}`} className="text-muted-foreground/60 hover:text-foreground">
              <Info className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-[220px] text-xs">{info}</TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className={cn("font-mono text-2xl font-semibold tabular", valueColor)}>{value}</span>
        {showDelta && delta && delta.dir !== "flat" && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              deltaGood ? "text-status-done" : "text-status-overdue",
            )}
          >
            <DeltaIcon className="size-3" />
            {Math.abs(delta.pct).toFixed(0)}%
          </span>
        )}
      </div>
      {spark && spark.length > 1 && (
        <Sparkline data={spark} color={zone === "healthy" ? "var(--color-status-done)" : "var(--color-primary)"} />
      )}
      {bandLabel && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", zone === "healthy" ? "bg-status-done" : "bg-status-progress")} />
          {bandLabel}
        </div>
      )}
    </Card>
  );
}