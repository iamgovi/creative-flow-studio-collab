import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ListTodo, Clock, Bell, FolderKanban,
  Users as UsersIcon, BarChart3, ScrollText, Settings, Briefcase, Gamepad2, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/data/mock";
import { useCurrentRole } from "@/hooks/use-current-role";
import logoDark from "@/assets/logo.png";
import logoLight from "@/assets/logo-light.png";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

// Each role's nav is a hardcoded, role-scoped list of namespaced paths.
// No role ever links to another role's namespace, so navigation cannot bleed.
const NAV: Record<Role, NavItem[]> = {
  employee: [
    { to: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/employee/tasks", label: "My Tasks", icon: ListTodo },
    { to: "/employee/timesheet", label: "Timesheet", icon: Clock },
    { to: "/employee/team", label: "Team", icon: UsersIcon },
    { to: "/employee/games", label: "Games", icon: Gamepad2 },
    { to: "/employee/notifications", label: "Notifications", icon: Bell },
  ],
  manager: [
    { to: "/manager/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/manager/deliverables", label: "Deliverables", icon: FolderKanban },
    { to: "/manager/tasks", label: "Tasks", icon: ListTodo },
    { to: "/manager/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/manager/team", label: "Team", icon: UsersIcon },
  ],
  admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/clients", label: "Clients", icon: Briefcase },
    { to: "/admin/projects", label: "Projects", icon: FolderKanban },
    { to: "/admin/deliverables", label: "Deliverables", icon: Activity },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/admin/employees", label: "Employees", icon: UsersIcon },
    { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ],
};

export function AppSidebar() {
  const role = useCurrentRole();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const items = NAV[role];

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="h-14 px-4 border-b flex items-center justify-center">
        <img src={logoLight} alt="cntrlm" className="h-9 w-auto object-contain block dark:hidden animate-logo-breathe" />
        <img src={logoDark} alt="cntrlm" className="h-9 w-auto object-contain hidden dark:block animate-logo-breathe" />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {role}
        </div>
        {items.map(({ to, label, icon: Icon }: NavItem) => {
          const active = path === to || path.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-3 border-t text-xs text-muted-foreground">
        v0.1 · UI preview
      </div>
    </aside>
  );
}
