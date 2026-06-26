import { Card } from "@/components/ui/card";
import { KpiCard } from "../KpiCard";
import { TrendLine } from "../charts/TrendLine";
import { StackedBar } from "../charts/StackedBar";
import { PresenceBoard } from "../PresenceBoard";
import { InsightCard } from "../InsightCard";
import { useAnalytics } from "@/stores/analytics";
import { insights } from "@/data/mockAnalytics";
import {
  delta,
  fmtPct,
  HEALTHY_PRODUCTIVITY,
  HEALTHY_UTILIZATION,
  outputVsReworkByWeek,
  teamMetrics,
  teamProductivitySeries,
} from "@/lib/analyticsMath";

export function OverviewTab() {
  const { members, days, compare } = useAnalytics();
  const m = teamMetrics(members, days);
  const prev = teamMetrics(members, days, true);
  const series = teamProductivitySeries(members, days);
  const rework = outputVsReworkByWeek(members, days);
  const spark = series.map((s) => s.productivity);

  const topInsights = [...insights].sort((a, b) => b.priority - a.priority).slice(0, 3);

  const d = (cur: number, pr: number) => delta(cur, pr);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <KpiCard
          label="Team Productivity"
          value={fmtPct(m.productivity)}
          numericValue={m.productivity}
          band={HEALTHY_PRODUCTIVITY}
          bandLabel="Healthy band 55–80%"
          info="Share of logged time spent in focused, productive work. Both too low and too high are flagged — sustainable pace matters."
          spark={spark}
          delta={d(m.productivity, prev.productivity)}
          showDelta={compare}
        />
        <KpiCard
          label="First-Pass Quality"
          value={fmtPct(m.firstPass)}
          info="Percent of tasks approved on the first submission, across the team."
          spark={spark.map((x) => x + 8)}
          delta={d(m.firstPass, prev.firstPass)}
          showDelta={compare}
        />
        <KpiCard
          label="On-Time Delivery"
          value={fmtPct(m.onTime)}
          info="Percent of tasks completed before their deadline."
          delta={d(m.onTime, prev.onTime)}
          showDelta={compare}
        />
        <KpiCard
          label="Avg Review Turnaround"
          value={`${m.reviewTurnaround.toFixed(1)}h`}
          info="How quickly the manager reviews submitted work. Lower is better — this reflects on you, not just the team."
          delta={d(m.reviewTurnaround, prev.reviewTurnaround)}
          lowerIsBetter
          showDelta={compare}
        />
        <KpiCard
          label="Team Utilization"
          value={fmtPct(m.utilization)}
          numericValue={m.utilization}
          band={HEALTHY_UTILIZATION}
          bandLabel="Healthy band 70–95%"
          info="Average allocated hours vs capacity. Above 95% signals overload risk, not a win."
          delta={d(m.utilization, prev.utilization)}
          showDelta={compare}
        />
        <KpiCard
          label="Attendance Rate"
          value={fmtPct(m.attendance)}
          info="Percent of working days the team was present."
          delta={d(m.attendance, prev.attendance)}
          showDelta={compare}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-medium">Team Productivity Trend</div>
              <span className="text-xs text-muted-foreground">Shaded = healthy 55–80%</span>
            </div>
            <TrendLine data={series} band={HEALTHY_PRODUCTIVITY} />
          </Card>
          <Card className="p-5">
            <div className="mb-3 font-medium">Output vs Rework</div>
            <p className="mb-2 text-xs text-muted-foreground">Hours of first-pass work vs effort lost to revisions, by week.</p>
            <StackedBar
              data={rework}
              xKey="week"
              unit="h"
              series={[
                { key: "output", label: "First-pass work", color: "var(--color-status-done)" },
                { key: "rework", label: "Rework", color: "var(--color-status-progress)" },
              ]}
            />
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <div className="mb-3 font-medium">Today's Presence</div>
            <PresenceBoard memberIds={members} />
          </Card>
          <Card className="p-5">
            <div className="mb-3 font-medium">Top Insights</div>
            <div className="space-y-3">
              {topInsights.map((i) => (
                <InsightCard key={i.id} insight={i} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}