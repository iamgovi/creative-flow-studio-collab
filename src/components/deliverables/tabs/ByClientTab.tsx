import { Card } from "@/components/ui/card";
import { ClientHealthTable } from "../ClientHealthTable";
import { HBar } from "../charts/HBar";
import { HEALTH_META, clients } from "@/data/mockDeliverables";
import { useDeliverableData } from "../useDeliverableData";
import { allClientStats, sortClientsByHealth } from "@/lib/deliverablesMath";

export function ByClientTab() {
  const { dels } = useDeliverableData();
  const stats = allClientStats(dels);

  const healthy = stats.filter((s) => s.health === "healthy").length;
  const watch = stats.filter((s) => s.health === "watch").length;
  const atRisk = stats.filter((s) => s.health === "at-risk").length;

  const mostDelays = [...stats].sort((a, b) => b.delayed - a.delayed || b.avgDelay - a.avgDelay)[0];
  const newest = [...clients].sort((a, b) => new Date(b.onboardedDate).getTime() - new Date(a.onboardedDate).getTime())[0];

  const rankBars = sortClientsByHealth(stats)
    .map((s) => ({ label: s.client.name, value: s.onTimeRate, color: HEALTH_META[s.health].colorVar }))
    .sort((a, b) => a.value - b.value);

  return (
    <div className="space-y-4">
      {/* summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Active clients</div>
          <div className="mt-1 font-mono text-2xl font-semibold">{stats.length}</div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            <span className="rounded-full bg-status-done/10 px-2 py-0.5 text-status-done">{healthy} healthy</span>
            <span className="rounded-full bg-status-progress/10 px-2 py-0.5 text-status-progress">{watch} watch</span>
            <span className="rounded-full bg-status-overdue/10 px-2 py-0.5 text-status-overdue">{atRisk} at-risk</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Most delays</div>
          <div className="mt-1 truncate text-lg font-semibold">{mostDelays?.client.name ?? "—"}</div>
          <div className="mt-2 text-xs text-muted-foreground">{mostDelays ? `${mostDelays.delayed} delayed · ${mostDelays.onTimeRate}% on-time` : "No delays"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Newest client</div>
          <div className="mt-1 truncate text-lg font-semibold">{newest.name}</div>
          <div className="mt-2 text-xs text-muted-foreground">Onboarded {new Date(newest.onboardedDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Portfolio on-time</div>
          <div className="mt-1 font-mono text-2xl font-semibold">
            {stats.length ? Math.round(stats.reduce((a, b) => a + b.onTimeRate, 0) / stats.length) : 0}%
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Average across clients</div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-1 font-medium">Clients ranked by on-time delivery</div>
        <p className="mb-3 text-xs text-muted-foreground">Color-coded by health — instantly shows which clients are well-served and which are being let down.</p>
        <HBar data={rankBars} unit="%" height={Math.max(180, rankBars.length * 36)} domainMax={100} />
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b px-5 py-4">
          <div className="font-medium">Client health</div>
          <p className="text-xs text-muted-foreground">Sorted worst-first so at-risk relationships surface. Click a row to drill into a client.</p>
        </div>
        <ClientHealthTable stats={stats} />
      </Card>
    </div>
  );
}