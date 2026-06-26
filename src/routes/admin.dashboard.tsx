import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users as UsersIcon, Briefcase, ShieldAlert, UserPlus, ArrowUpRight, FolderKanban } from "lucide-react";
import { users, projects, auditEvents } from "@/data/mock";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/dashboard")({ component: AdminDashboard });

function AdminDashboard() {
  const employees = useMemo(() => users.filter((u) => u.role !== "admin"), []);
  const activeEmployees = employees.filter((u) => u.status === "active");

  // Aggregate clients from deliverables
  const clients = useMemo(() => {
    const map = new Map<string, { name: string; projects: number; activeProjects: number }>();
    for (const p of projects) {
      const c = map.get(p.client) ?? { name: p.client, projects: 0, activeProjects: 0 };
      c.projects += 1;
      if (p.progress < 100) c.activeProjects += 1;
      map.set(p.client, c);
    }
    return Array.from(map.values()).sort((a, b) => b.projects - a.projects);
  }, []);

  const security = auditEvents
    .filter((e) => ["USER_LOGIN", "ROLE_CHANGED"].includes(e.action))
    .slice(0, 5);

  const kpis = [
    { label: "Employees", value: activeEmployees.length, sub: `${employees.length} total`, icon: UsersIcon },
    { label: "Clients", value: clients.length, sub: `${projects.length} deliverables`, icon: Briefcase },
    { label: "Active deliverables", value: projects.filter((p) => p.progress < 100).length, sub: "in flight", icon: FolderKanban },
    { label: "Org productivity", value: "68%", sub: "+4% vs last wk", icon: ArrowUpRight },
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
              {employees.slice(0, 7).map((u) => (
                <li key={u.id} className="py-2.5 flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback>{u.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{u.position} · {u.department}</div>
                  </div>
                  <span className={cn(
                    "text-[11px] px-1.5 py-0.5 rounded-full border",
                    u.status === "active" ? "text-status-done border-status-done/40" : "text-muted-foreground"
                  )}>
                    {u.status}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Clients */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-medium flex items-center gap-2"><Briefcase className="size-4" /> Clients</div>
              <Button asChild size="sm" variant="ghost"><Link to="/admin/clients">View all</Link></Button>
            </div>
            <ul className="divide-y">
              {clients.slice(0, 7).map((c) => (
                <li key={c.name} className="py-2.5 flex items-center gap-3">
                  <div className="size-8 rounded-md bg-muted grid place-items-center text-xs font-semibold">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.projects} deliverable{c.projects > 1 ? "s" : ""} · {c.activeProjects} active</div>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Security */}
        <Card className="p-5">
          <div className="font-medium flex items-center gap-2 mb-4">
            <ShieldAlert className="size-4 text-status-overdue" /> Recent security events
          </div>
          <ul className="space-y-3 text-sm">
            {security.map((e) => {
              const u = users.find((x) => x.id === e.actorId)!;
              return (
                <li key={e.id} className="flex items-start gap-3">
                  <div className={cn("mt-1 size-1.5 rounded-full", e.action === "ROLE_CHANGED" ? "bg-status-overdue" : "bg-status-review")} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">
                      <span className="font-medium">{u.name}</span>{" "}
                      <span className="text-muted-foreground">— {e.action.replace(/_/g, " ").toLowerCase()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{e.ip} · {formatDistanceToNow(new Date(e.ts), { addSuffix: true })}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
