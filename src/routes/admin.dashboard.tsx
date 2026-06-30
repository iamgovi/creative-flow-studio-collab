import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users as UsersIcon, Briefcase, ShieldAlert, UserPlus, FolderKanban, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useRecentSecurityEvents } from "@/hooks/useAuditLogs";
import {
  useAdminDashboardClients,
  useAdminDashboardKpis,
  useAdminDashboardTeamMates,
} from "@/hooks/useAdminDashboard";

export const Route = createFileRoute("/admin/dashboard")({ component: AdminDashboard });

function AdminDashboard() {
  const kpisQuery = useAdminDashboardKpis();
  const teamMatesQuery = useAdminDashboardTeamMates();
  const clientsQuery = useAdminDashboardClients();
  const securityQuery = useRecentSecurityEvents();
  const employees = teamMatesQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const security = securityQuery.data ?? [];

  const kpis = [
    {
      label: "Employees",
      value: kpisQuery.employees.data ?? "—",
      sub: kpisQuery.employees.isLoading
        ? "Loading..."
        : kpisQuery.employees.isError
          ? kpisQuery.employees.error.message
          : "users.position = employee",
      icon: UsersIcon,
    },
    {
      label: "Managers",
      value: kpisQuery.managers.data ?? "—",
      sub: kpisQuery.managers.isLoading
        ? "Loading..."
        : kpisQuery.managers.isError
          ? kpisQuery.managers.error.message
          : "users.position = manager",
      icon: UsersIcon,
    },
    {
      label: "Clients",
      value: kpisQuery.clients.data ?? "—",
      sub: kpisQuery.clients.isLoading
        ? "Loading..."
        : kpisQuery.clients.isError
          ? kpisQuery.clients.error.message
          : "total clients",
      icon: Briefcase,
    },
    {
      label: "Active deliverables",
      value: kpisQuery.activeDeliverables.data ?? "—",
      sub: kpisQuery.activeDeliverables.isLoading
        ? "Loading..."
        : kpisQuery.activeDeliverables.isError
          ? kpisQuery.activeDeliverables.error.message
          : "projects.status = active",
      icon: FolderKanban,
    },
    {
      label: "Incoming Projects",
      value: kpisQuery.incomingProjects.data ?? "—",
      sub: kpisQuery.incomingProjects.isLoading
        ? "Loading..."
        : kpisQuery.incomingProjects.isError
          ? kpisQuery.incomingProjects.error.message
          : "awaiting setup",
      icon: Inbox,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Admin overview</h1>
            <p className="text-sm text-muted-foreground">Manage your employees and clients across the studio.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/admin/clients"><Briefcase className="size-4" />Clients</Link></Button>
            <Button asChild><Link to="/admin/employees"><UserPlus className="size-4" />Employees</Link></Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {kpis.map((k) => (
            <Card key={k.label} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <k.icon className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-2 text-2xl font-semibold tabular">{k.value}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Employees */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-medium flex items-center gap-2"><UsersIcon className="size-4" /> Team Mates</div>
              <Button asChild size="sm" variant="ghost"><Link to="/admin/employees">View all</Link></Button>
            </div>
            <ul className="divide-y">
              {employees.map((u) => (
                <li key={u.id} className="py-2.5 flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarImage src={u.avatarUrl ?? undefined} />
                    <AvatarFallback>{u.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{u.department} · {u.position}</div>
                  </div>
                  <span className={cn(
                    "text-[11px] px-1.5 py-0.5 rounded-full border",
                    u.status === "active" ? "text-status-done border-status-done/40" : "text-muted-foreground"
                  )}>
                    {u.status}
                  </span>
                </li>
              ))}
              {teamMatesQuery.isLoading && (
                <li className="py-8 text-center text-sm text-muted-foreground">
                  Loading team mates...
                </li>
              )}
              {teamMatesQuery.isError && (
                <li className="py-8 text-center text-sm text-destructive">
                  {teamMatesQuery.error.message}
                </li>
              )}
              {!teamMatesQuery.isLoading && !teamMatesQuery.isError && employees.length === 0 && (
                <li className="py-8 text-center text-sm text-muted-foreground">
                  No team mates found.
                </li>
              )}
            </ul>
          </Card>

          {/* Clients */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-medium flex items-center gap-2"><Briefcase className="size-4" /> Clients</div>
              <Button asChild size="sm" variant="ghost"><Link to="/admin/clients">View all</Link></Button>
            </div>
            <ul className="divide-y">
              {clients.map((c) => (
                <li key={c.id} className="py-2.5 flex items-center gap-3">
                  <div className="size-8 rounded-md bg-muted grid place-items-center text-xs font-semibold">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.activeProjects} active · {c.incomingProjects} incoming
                    </div>
                  </div>
                  <FolderKanban className="size-4 text-muted-foreground" />
                </li>
              ))}
              {clientsQuery.isLoading && (
                <li className="py-8 text-center text-sm text-muted-foreground">
                  Loading clients...
                </li>
              )}
              {clientsQuery.isError && (
                <li className="py-8 text-center text-sm text-destructive">
                  {clientsQuery.error.message}
                </li>
              )}
              {!clientsQuery.isLoading && !clientsQuery.isError && clients.length === 0 && (
                <li className="py-8 text-center text-sm text-muted-foreground">
                  No clients found.
                </li>
              )}
            </ul>
          </Card>
        </div>

        {/* Security */}
        <Card className="p-5">
          <div className="font-medium flex items-center gap-2 mb-4">
            <ShieldAlert className="size-4 text-status-overdue" /> Recent security events
          </div>
          <ul className="space-y-3 text-sm">
            {security.map((event) => (
              <li key={event.id} className="flex items-start gap-3">
                <div className={cn("mt-1 size-1.5 rounded-full", event.action === "EMPLOYEE_LOGOUT" ? "bg-status-overdue" : "bg-status-review")} />
                <div className="min-w-0 flex-1">
                  <div className="truncate">
                    <span className="font-medium">{event.user}</span>{" "}
                    <span className="text-muted-foreground">— {event.actionLabel}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Attendance · {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </div>
                </div>
              </li>
            ))}
            {securityQuery.isLoading && (
              <li className="py-8 text-center text-sm text-muted-foreground">
                Loading security events...
              </li>
            )}
            {securityQuery.isError && (
              <li className="py-8 text-center text-sm text-destructive">
                {securityQuery.error.message}
              </li>
            )}
            {!securityQuery.isLoading && !securityQuery.isError && security.length === 0 && (
              <li className="py-8 text-center text-sm text-muted-foreground">
                No recent security events.
              </li>
            )}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
