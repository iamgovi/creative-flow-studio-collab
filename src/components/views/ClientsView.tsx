import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase,
  Plus,
  TrendingUp,
  DollarSign,
  Users as UsersIcon,
  FolderKanban,
  ArrowUpRight,
  Search,
} from "lucide-react";
import { useCurrentRole } from "@/hooks/use-current-role";
import { useClientsPageData } from "@/hooks/useClients";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export function ClientsView() {
  const role = useCurrentRole();
  const newClientTo = role === "admin" ? "/admin/clients/new" : "/manager/clients/new";
  const projectsTo = role === "admin" ? "/admin/projects" : "/manager/projects";
  const { data, isLoading, isError, error } = useClientsPageData();
  const [query, setQuery] = useState("");

  const clients = data?.clients ?? [];
  const deliverables = data?.deliverables ?? [];
  const summary = data?.summary ?? {
    totalMRR: 0,
    revenueYTD: 0,
    activeClients: 0,
    activeDeliverables: 0,
    totalDeliverables: 0,
  };
  const revenueTrend = data?.revenueTrend ?? [];

  const filtered = useMemo(
    () => clients.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [clients, query],
  );

  const topClients = clients.slice(0, 6).map((c) => ({ name: c.name, ytd: c.ytd }));

  // Add client form (legacy state retained but unused; navigation handles creation)

  const kpis = [
    {
      label: "Total MRR",
      value: `₹${summary.totalMRR}k`,
      sub: "from client revenue",
      icon: DollarSign,
    },
    {
      label: "Revenue YTD",
      value: `₹${summary.revenueYTD}k`,
      sub: "MRR + setup fees",
      icon: TrendingUp,
    },
    {
      label: "Active clients",
      value: summary.activeClients,
      sub: "visible client rows",
      icon: UsersIcon,
    },
    {
      label: "Active deliverables",
      value: summary.activeDeliverables,
      sub: `${summary.totalDeliverables} total`,
      icon: FolderKanban,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
            <p className="text-sm text-muted-foreground">Revenue, accounts and ongoing deliverable pipeline.</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search clients…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 w-56"
              />
            </div>
            <Button asChild>
              <Link to={newClientTo}><Plus className="size-4" />Add client</Link>
            </Button>
          </div>
        </div>

        {/* KPIs */}
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

        {isError && (
          <Card className="p-4 text-sm text-destructive">
            {(error as Error).message || "Unable to load clients from Supabase."}
          </Card>
        )}

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="font-medium">Revenue (12 mo)</div>
              <span className="text-xs text-muted-foreground">in ₹k</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueTrend}
                  margin={{ left: -10, right: 8, top: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="url(#rev)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-medium">Top clients YTD</div>
              <span className="text-xs text-muted-foreground">₹k</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topClients} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={90}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="ytd" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Clients + projects */}
        <div className="grid lg:grid-cols-5 gap-4">
          <Card className="p-5 lg:col-span-3">
            <div className="font-medium flex items-center gap-2 mb-4">
              <Briefcase className="size-4" /> Clients ({filtered.length})
            </div>
            <ul className="divide-y">
              {filtered.map((c) => (
                <li key={c.id} className="py-3 flex items-center gap-3">
                  <div className="size-9 rounded-md bg-muted grid place-items-center text-xs font-semibold">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.projects} deliverable{c.projects !== 1 && "s"} · {c.activeProjects} active ·
                      ₹{c.mrr}k/mo
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular">₹{c.ytd}k</div>
                    <div className="text-[11px] text-muted-foreground">YTD</div>
                  </div>
                </li>
              ))}
              {isLoading && (
                <li className="py-8 text-center text-sm text-muted-foreground">Loading clients...</li>
              )}
              {!isLoading && filtered.length === 0 && (
                <li className="py-8 text-center text-sm text-muted-foreground">No clients match "{query}".</li>
              )}
            </ul>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="font-medium flex items-center gap-2">
                <FolderKanban className="size-4" /> Existing deliverables
              </div>
              <Button asChild size="sm" variant="ghost">
                <Link to={projectsTo}>
                  Deliverables <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
            </div>
            <ul className="space-y-3">
              {deliverables.slice(0, 8).map((p) => (
                <li key={p.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.client} · {p.type}</div>
                    </div>
                    <span
                      className={cn(
                        "text-[11px] tabular shrink-0",
                        p.progress >= 100 ? "text-status-done" : "text-muted-foreground",
                      )}
                    >
                      {p.progress}%
                    </span>
                  </div>
                  <Progress value={p.progress} className="h-1.5" />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
