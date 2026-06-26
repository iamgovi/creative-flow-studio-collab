import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/employees")({ component: EmployeesLayout });

const TABS = [
  { to: "/admin/employees/roles", label: "Manage Roles", exact: false },
];

function EmployeesLayout() {
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <AppShell>
      <div className="max-w-7xl space-y-6">
        <div className="border-b">
          <nav className="flex gap-1 -mb-px">
            {TABS.map((t) => {
              const active = t.exact ? path === t.to : path.startsWith(t.to);
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn(
                    "px-4 py-2.5 text-sm border-b-2 transition-colors",
                    active
                      ? "border-primary text-foreground font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <Outlet />
      </div>
    </AppShell>
  );
}
