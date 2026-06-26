import { Card } from "@/components/ui/card";
import { KpiCard } from "../KpiCard";
import { OnTimeTrend } from "../charts/OnTimeTrend";
import { ThroughputBar } from "../charts/ThroughputBar";
import { DelayTrend } from "../charts/DelayTrend";
import { useDeliverableData } from "../useDeliverableData";
import { delta } from "@/lib/deliverablesMath";

export function TrendsTab() {
  const { weeks, compare, target } = useDeliverableData();
  if (!weeks.length) return null;

  const first = weeks[0];
  const last = weeks[weeks.length - 1];
  const totalStarted = weeks.reduce((a, w) => a + w.started, 0);
  const totalCompleted = weeks.reduce((a, w) => a + w.completed, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="On-time (window end)" value={`${last.onTimeRate}%`} tone={last.onTimeRate >= target ? "good" : "bad"} info="On-time rate at the end of the selected window." delta={delta(last.onTimeRate, first.onTimeRate)} showDelta={compare} spark={weeks.map((w) => w.onTimeRate)} />
        <KpiCard label="Avg delay (window end)" value={`${last.avgDelay.toFixed(1)}d`} tone="bad" info="Average delay at the end of the selected window." delta={delta(last.avgDelay, first.avgDelay)} lowerIsBetter showDelta={compare} spark={weeks.map((w) => w.avgDelay)} />
        <KpiCard label="Started (window)" value={String(totalStarted)} info="Total deliverables started across the window." />
        <KpiCard label="Completed (window)" value={String(totalCompleted)} sub={totalStarted > totalCompleted ? "Backlog growing" : "Keeping pace"} tone={totalStarted > totalCompleted ? "warn" : "good"} info="Total deliverables completed across the window." />
      </div>

      <Card className="p-5">
        <div className="mb-1 flex items-center justify-between"><div className="font-medium">On-time delivery rate</div><span className="text-xs text-muted-foreground">Target {target}%</span></div>
        <OnTimeTrend data={weeks} target={target} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-1 font-medium">Throughput — started vs completed</div>
          <p className="mb-3 text-xs text-muted-foreground">Is the team keeping pace with intake?</p>
          <ThroughputBar data={weeks} />
        </Card>
        <Card className="p-5">
          <div className="mb-1 font-medium">Delay severity & frequency</div>
          <p className="mb-3 text-xs text-muted-foreground">Average delay overlaid with the count of delayed deliverables.</p>
          <DelayTrend data={weeks} />
        </Card>
      </div>
    </div>
  );
}