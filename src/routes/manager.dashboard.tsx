import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, AlertTriangle, Clock, CheckCircle2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { IncomingProjectsStrip } from "@/components/setup/IncomingProjectsStrip";
import { useManagerDashboard } from "@/hooks/useManagerDashboard";

export const Route = createFileRoute("/manager/dashboard")({ component: ManagerDashboard });

function ManagerDashboard() {
  const { data, isLoading, isError, error } = useManagerDashboard();
  const counts = data?.counts ?? {
    incomingProjects: 0,
    activeDeliverables: 0,
    pendingApprovals: 0,
    teamProductivity: 0,
  };
  const activeProjects = data?.activeProjects ?? [];
  const pendingApprovals = data?.pendingApprovals ?? [];
  const delayAlerts = data?.delayAlerts ?? [];
  const workloadRows = data?.workloadRows ?? [];

  const kpis = [
    {
      label: "Incoming Projects",
      value: isLoading ? "—" : counts.incomingProjects,
      trend: "awaiting setup",
      icon: Inbox,
      tone: "text-status-review",
    },
    {
      label: "Active Deliverables",
      value: isLoading ? "—" : counts.activeDeliverables,
      trend: "projects.status = active",
      icon: ArrowUpRight,
      tone: "text-status-done",
    },
    {
      label: "Pending Approvals",
      value: counts.pendingApprovals,
      trend: "no approvals backend yet",
      icon: Clock,
      tone: "text-status-review",
    },
    {
      label: "Team Productivity",
      value: `${counts.teamProductivity}%`,
      trend: "not calculated yet",
      icon: CheckCircle2,
      tone: "text-status-done",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manager dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your team and deliverables.</p>
        </div>

        <IncomingProjectsStrip />

        {isError && (
          <Card className="p-3 text-sm text-destructive">
            {error.message}
          </Card>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <Card key={k.label} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <k.icon className={cn("size-4", k.tone)} />
              </div>
              <div className="mt-2 text-2xl font-semibold tabular">{k.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{k.trend}</div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Pending Approvals */}
          <Card className="lg:col-span-2 overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="font-medium">Pending Approvals</div>
              <Button variant="ghost" size="sm">View all</Button>
            </div>
            {pendingApprovals.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">All caught up.</div>
            ) : (
              <ul className="divide-y" />
            )}
          </Card>

          {/* Delay alerts */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b">
              <div className="font-medium flex items-center gap-2">
                <AlertTriangle className="size-4 text-status-overdue" /> Delay alerts
              </div>
            </div>
            <ul className="divide-y max-h-[360px] overflow-auto">
              {delayAlerts.length === 0 && (
                <li className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No delay alerts.
                </li>
              )}
            </ul>
          </Card>
        </div>

        {/* Workload heatmap */}
        <Card className="p-5">
          <div className="font-medium mb-4">Team workload — this week</div>
          <Heatmap rows={workloadRows} />
        </Card>

        {/* Deliverable pipeline */}
        <Card className="p-5">
          <div className="font-medium mb-4">Deliverable pipeline</div>
          <div className="space-y-3">
            {activeProjects.map((p) => (
              <div key={p.id} className="grid grid-cols-[200px_1fr_60px] items-center gap-4">
                <div>
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{p.currentStage} · {p.client}</div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${p.progress}%` }} />
                </div>
                <div className="text-xs text-right tabular text-muted-foreground">{p.progress}%</div>
              </div>
            ))}
            {isLoading && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Loading pipeline...
              </div>
            )}
            {!isLoading && !isError && activeProjects.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No active deliverables found.
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Heatmap({ rows }: { rows: [] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  if (rows.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No workload data available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-sm">
        <thead>
          <tr>
            <th className="text-left pr-4 pb-2 font-normal text-xs text-muted-foreground">Member</th>
            {days.map((d) => (
              <th key={d} className="px-2 pb-2 font-normal text-xs text-muted-foreground">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody />
      </table>
    </div>
  );
}
