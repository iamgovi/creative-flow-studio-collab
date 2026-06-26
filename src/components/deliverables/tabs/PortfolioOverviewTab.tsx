import { Card } from "@/components/ui/card";
import { KpiCard } from "../KpiCard";
import { InsightCard } from "../InsightCard";
import { StatusDonut } from "../charts/StatusDonut";
import { OnTimeTrend } from "../charts/OnTimeTrend";
import { ThroughputBar } from "../charts/ThroughputBar";
import { useDeliverableData } from "../useDeliverableData";
import { insights, STATUS_META, type DeliverableStatus } from "@/data/mockDeliverables";
import type { DeliverablesTab } from "@/stores/deliverablesFilters";
import {
  activeCount,
  atRiskCount,
  avgCycleTime,
  avgDelay,
  clientsAtRisk,
  delta,
  onTimeRate,
  statusCounts,
} from "@/lib/deliverablesMath";

const ORDER: DeliverableStatus[] = ["on-track", "at-risk", "delayed", "completed", "not-started"];

export function PortfolioOverviewTab({ onDrill }: { onDrill: (tab: DeliverablesTab) => void }) {
  const { dels, weeks, prevWeeks, compare, target } = useDeliverableData();

  const otr = onTimeRate(weeks);
  const otrPrev = onTimeRate(prevWeeks);
  const sc = statusCounts(dels);
  const total = dels.length;
  const atRisk = atRiskCount(dels);
  const aDelay = avgDelay(dels);
  const aDelayPrev = prevWeeks.length ? prevWeeks[prevWeeks.length - 1].avgDelay : aDelay;

  const donut = ORDER.filter((s) => sc[s] > 0).map((s) => ({ name: STATUS_META[s].label, value: sc[s], color: STATUS_META[s].colorVar }));

  const topInsights = insights.filter((i) => i.severity === "critical" || i.severity === "warning").slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <KpiCard
          label="On-Time Delivery Rate"
          value={`${otr}%`}
          info="Share of deliverables completed on or before their deadline. The headline delivery-health number; green at or above target."
          tone={otr >= target ? "good" : otr >= target - 7 ? "warn" : "bad"}
          spark={weeks.map((w) => w.onTimeRate)}
          delta={delta(otr, otrPrev)}
          showDelta={compare}
        />
        <KpiCard
          label="Active Deliverables"
          value={String(activeCount(dels))}
          info="Total deliverables currently in flight across all clients (excludes completed)."
          spark={weeks.map((w) => w.started)}
        />
        <KpiCard
          label="At-Risk Deliverables"
          value={String(atRisk)}
          sub={total ? `${Math.round((atRisk / total) * 100)}% of portfolio` : undefined}
          info="Deliverables flagged at risk of, or already missing, their deadline (at-risk + delayed)."
          tone={atRisk === 0 ? "good" : "warn"}
        />
        <KpiCard
          label="Avg Delivery Delay"
          value={`${aDelay.toFixed(1)}d`}
          info="Average days late across deliverables that are currently delayed."
          tone={aDelay === 0 ? "good" : aDelay < 2 ? "warn" : "bad"}
          spark={weeks.map((w) => w.avgDelay)}
          delta={delta(aDelay, aDelayPrev)}
          lowerIsBetter
          showDelta={compare}
        />
        <KpiCard
          label="Avg Cycle Time"
          value={`${avgCycleTime(dels).toFixed(0)}d`}
          info="Average days from deliverable start to completion, across completed work."
        />
        <KpiCard
          label="Clients at Risk"
          value={String(clientsAtRisk(dels))}
          info="Count of clients with at least one at-risk or delayed deliverable."
          tone={clientsAtRisk(dels) === 0 ? "good" : "warn"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 font-medium">Delivery status breakdown</div>
          <StatusDonut data={donut} />
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-medium">On-time delivery trend</div>
            <span className="text-xs text-muted-foreground">Target {target}%</span>
          </div>
          <OnTimeTrend data={weeks} target={target} />
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-1 font-medium">Delivery throughput</div>
        <p className="mb-3 text-xs text-muted-foreground">Deliverables started vs completed each week — when started outpaces completed, the backlog is growing.</p>
        <ThroughputBar data={weeks} />
      </Card>

      <div>
        <div className="mb-2 text-sm font-medium">Top concerns</div>
        <div className="grid gap-3 md:grid-cols-3">
          {topInsights.map((i) => (
            <InsightCard key={i.id} insight={i} onDrill={onDrill} />
          ))}
        </div>
      </div>
    </div>
  );
}