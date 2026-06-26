import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IncomingProjectsStrip } from "@/components/setup/IncomingProjectsStrip";
import { projects } from "@/data/mock";
import { useCurrentRole } from "@/hooks/use-current-role";
import { ArrowRight } from "lucide-react";

export function ProjectsView() {
  const role = useCurrentRole();
  const dashboardTo = role === "admin" ? "/admin/dashboard" : "/manager/dashboard";
  const label = role === "admin" ? "admin" : "manager";

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Deliverables</h1>
          <p className="text-sm text-muted-foreground">All active and incoming deliverables.</p>
        </div>

        <IncomingProjectsStrip />

        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b font-medium">Active deliverables</div>
          <ul className="divide-y">
            {projects.map((p) => (
              <li key={p.id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{p.type} · {p.client}</div>
                </div>
                <div className="w-48">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground tabular w-10 text-right">{p.progress}%</div>
              </li>
            ))}
          </ul>
        </Card>

        <div>
          <Link to={dashboardTo}>
            <Button variant="ghost" size="sm">
              Back to {label} dashboard <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
