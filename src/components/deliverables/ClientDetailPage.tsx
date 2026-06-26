import { ArrowLeft, Flag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { KpiCard } from "./KpiCard";
import { HealthPill } from "./Pills";
import { DeliverableTable } from "./DeliverableTable";
import { OnTimeTrend } from "./charts/OnTimeTrend";
import { HBar } from "./charts/HBar";
import { deliverables, getClient, history, managerName } from "@/data/mockDeliverables";
import { useDeliverableFilters } from "@/stores/deliverablesFilters";
import { activeCount, clientStats, delayByStage, fmtMoney } from "@/lib/deliverablesMath";

export function ClientDetailPage({ id }: { id: string }) {
  const client = getClient(id);
  const { flagged, toggleFlag, notes, setNote, onTimeTarget } = useDeliverableFilters();

  if (!client) {
    return (
      <AppShell>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Client not found.</p>
          <Link to="/admin/deliverables" className="text-sm text-primary hover:underline">← Back to Deliverables</Link>
        </div>
      </AppShell>
    );
  }

  const own = deliverables.filter((d) => d.clientId === id);
  const stats = clientStats(id);
  const stageBars = delayByStage(own).map((s) => ({ label: s.stage, value: s.avgDelay, color: "var(--color-status-overdue)", enoughData: s.enoughData }));
  const isFlagged = flagged.includes(client.id);

  return (
    <AppShell>
      <div className="space-y-4">
        <Link to="/admin/deliverables" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Deliverables
        </Link>

        {/* header */}
        <Card className="flex flex-wrap items-center gap-4 p-5">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-lg font-semibold text-primary">
            {client.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{client.name}</h1>
              <HealthPill health={stats.health} />
            </div>
            <p className="text-xs text-muted-foreground">
              Onboarded {new Date(client.onboardedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })} · Manager {managerName(client.managerId)} · Contract {fmtMoney(client.contractValue)}
            </p>
          </div>
          <Button variant={isFlagged ? "secondary" : "outline"} size="sm" className="gap-1.5" onClick={() => { toggleFlag(client.id); toast.success(isFlagged ? "Removed from watchlist" : `${client.name} flagged for review`); }}>
            <Flag className={cn("size-3.5", isFlagged && "fill-current")} /> {isFlagged ? "On watchlist" : "Flag for review"}
          </Button>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Total Deliverables" value={String(stats.total)} info="All deliverables for this client." />
          <KpiCard label="On-Time Rate" value={`${stats.onTimeRate}%`} tone={stats.onTimeRate >= onTimeTarget ? "good" : "bad"} info="Share of this client's work delivered on time." />
          <KpiCard label="Avg Delay" value={stats.delayed ? `${stats.avgDelay.toFixed(1)}d` : "—"} tone={stats.delayed ? "bad" : "good"} info="Average days late across delayed deliverables." />
          <KpiCard label="Active" value={String(activeCount(own))} info="In-flight deliverables for this client." />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="mb-3 font-medium">On-time trend</div>
            <OnTimeTrend data={history} target={onTimeTarget} />
          </Card>
          <Card className="p-5">
            <div className="mb-1 font-medium">Delay by stage</div>
            <p className="mb-3 text-xs text-muted-foreground">Is this client's work getting stuck at a particular stage?</p>
            <HBar data={stageBars} unit="d" height={200} />
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="border-b px-5 py-4 font-medium">Deliverables (read-only)</div>
          <DeliverableTable rows={own} />
        </Card>

        {/* notes / watchlist */}
        <Card className="p-5">
          <div className="mb-2 font-medium">Strategic notes</div>
          <p className="mb-2 text-xs text-muted-foreground">Record observations about this relationship. Visible to the admin only.</p>
          <Textarea
            value={notes[client.id] ?? ""}
            onChange={(e) => setNote(client.id, e.target.value)}
            placeholder="e.g. Renewal at risk — escalate Editing delays with the manager before Q4."
            rows={3}
          />
          <div className="mt-2 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => toast.success("Note saved")}>Save note</Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}