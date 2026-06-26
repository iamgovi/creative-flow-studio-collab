import { Flag, Info } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { KpiCard } from "../KpiCard";
import { StatusPill } from "../Pills";
import { HBar } from "../charts/HBar";
import { DelayTrend } from "../charts/DelayTrend";
import { useDeliverableData } from "../useDeliverableData";
import { clientName, managerName } from "@/data/mockDeliverables";
import { useDeliverableFilters } from "@/stores/deliverablesFilters";
import {
  atRiskForecast,
  avgDelay,
  deliverableDelay,
  delayByClient,
  delayByStage,
  delayByType,
  fmtDate,
} from "@/lib/deliverablesMath";
import { history } from "@/data/mockDeliverables";

function stageColor(v: number, max: number) {
  if (max === 0) return "var(--color-primary)";
  const r = v / max;
  if (r >= 0.66) return "var(--color-status-overdue)";
  if (r >= 0.33) return "var(--color-status-progress)";
  return "var(--color-primary)";
}

export function DelaysRiskTab() {
  const { dels, weeks } = useDeliverableData();
  const { flagged, toggleFlag } = useDeliverableFilters();

  const delayed = dels.filter((d) => d.status === "delayed");
  const worst = [...delayed].sort((a, b) => deliverableDelay(b) - deliverableDelay(a))[0];
  const atRisk = dels.filter((d) => d.status === "at-risk");

  const stageDelays = delayByStage(dels);
  const stageMax = Math.max(...stageDelays.map((s) => s.avgDelay), 0);
  const stageBars = stageDelays.map((s) => ({ label: s.stage, value: s.avgDelay, color: stageColor(s.avgDelay, stageMax), enoughData: s.enoughData }));

  const clientBars = delayByClient(dels).map((c) => ({ label: c.label, value: c.avgDelay, color: "var(--color-status-overdue)", enoughData: c.enoughData }));
  const typeBars = delayByType(dels).map((t) => ({ label: t.label, value: t.avgDelay, color: "var(--color-status-progress)", enoughData: t.enoughData }));

  const forecast = atRiskForecast(dels);
  const delayTrendWeeks = weeks.length >= 4 ? weeks : history;

  const flag = (id: string, name: string) => {
    toggleFlag(id);
    toast.success(flagged.includes(id) ? `Removed "${name}" from watchlist` : `Flagged "${name}" for review — manager notified`);
  };

  return (
    <div className="space-y-4">
      {/* A — summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Delayed Deliverables" value={String(delayed.length)} tone={delayed.length ? "bad" : "good"} info="Deliverables that have already missed their deadline." />
        <KpiCard label="Avg Delay" value={`${avgDelay(dels).toFixed(1)}d`} tone="bad" info="Average days over estimate across delayed deliverables." />
        <KpiCard
          label="Worst Delay"
          value={worst ? `${deliverableDelay(worst)}d` : "—"}
          sub={worst ? `${worst.name} · ${clientName(worst.clientId)}` : undefined}
          tone="bad"
          info="The single most-delayed deliverable and which client it belongs to."
        />
        <KpiCard label="At-Risk (forecast)" value={String(atRisk.length)} tone={atRisk.length ? "warn" : "good"} info="Deliverables forecast to miss their deadline based on remaining work vs time left." />
      </div>

      {/* B — delay by stage (root cause) */}
      <Card className="p-5">
        <div className="mb-1 font-medium">Delay by stage — where work gets stuck</div>
        <p className="mb-3 text-xs text-muted-foreground">Average delay each workflow stage contributes across the portfolio. The tallest bars are your systemic bottlenecks.</p>
        <HBar data={stageBars} unit="d" height={220} />
      </Card>

      {/* C — by client & by type */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-1 font-medium">Avg delay by client</div>
          <p className="mb-3 text-xs text-muted-foreground">Which client relationships are most affected by delays.</p>
          {clientBars.length ? <HBar data={clientBars} unit="d" height={200} /> : <p className="py-10 text-center text-sm text-muted-foreground">No delays in this selection.</p>}
        </Card>
        <Card className="p-5">
          <div className="mb-1 font-medium">Avg delay by type</div>
          <p className="mb-3 text-xs text-muted-foreground">Is this a Video problem or a Static problem?</p>
          {typeBars.length ? <HBar data={typeBars} unit="d" height={200} /> : <p className="py-10 text-center text-sm text-muted-foreground">No delays in this selection.</p>}
        </Card>
      </div>

      {/* D — at-risk forecast list */}
      <Card className="overflow-hidden">
        <div className="border-b px-5 py-4">
          <div className="font-medium">At-risk forecast</div>
          <p className="text-xs text-muted-foreground">Deliverables projected to miss deadline, ranked by severity. Flagging notifies the assigned manager and adds it to your watchlist.</p>
        </div>
        <ul className="divide-y">
          {forecast.map((f) => {
            const d = f.deliverable;
            const isFlagged = flagged.includes(d.id);
            return (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <Link to="/admin/deliverables/$id" params={{ id: d.id }} className="text-sm font-medium hover:underline">{d.name}</Link>
                  <div className="text-xs text-muted-foreground">{clientName(d.clientId)} · {d.type} · {managerName(d.managerId)} · current stage {d.currentStage}</div>
                </div>
                <div className="text-xs text-muted-foreground tabular">Due {fmtDate(d.dueDate)}</div>
                <div className="flex items-center gap-1">
                  <span className={cn("font-mono text-sm font-medium tabular", f.projectedOverage > 0 ? "text-status-overdue" : "text-status-progress")}>
                    {f.projectedOverage > 0 ? `+${f.projectedOverage}d` : "tight"}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="Why flagged" className="text-muted-foreground/60 hover:text-foreground"><Info className="size-3.5" /></button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[240px] text-xs">{f.reason}</TooltipContent>
                  </Tooltip>
                </div>
                <StatusPill status={d.status} />
                <Button size="sm" variant={isFlagged ? "secondary" : "outline"} className="h-7 gap-1.5 text-xs" onClick={() => flag(d.id, d.name)}>
                  <Flag className={cn("size-3.5", isFlagged && "fill-current")} />
                  {isFlagged ? "Flagged" : "Flag for review"}
                </Button>
              </li>
            );
          })}
          {forecast.length === 0 && <li className="px-5 py-10 text-center text-sm text-muted-foreground">No at-risk deliverables in this selection.</li>}
        </ul>
      </Card>

      {/* E — delay trend */}
      <Card className="p-5">
        <div className="mb-1 font-medium">Delay trend</div>
        <p className="mb-3 text-xs text-muted-foreground">Average delay severity and the count of delayed deliverables over time — is the problem getting better or worse?</p>
        <DelayTrend data={delayTrendWeeks} />
      </Card>
    </div>
  );
}