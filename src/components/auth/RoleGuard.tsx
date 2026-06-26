import { Navigate } from "@tanstack/react-router";
import { useSession } from "@/stores/session";
import type { Role } from "@/data/mock";

const HOME: Record<Role, string> = {
  admin: "/admin/dashboard",
  manager: "/manager/dashboard",
  employee: "/employee/dashboard",
};

/**
 * Wraps a role's layout. Renders children only when the authenticated session
 * role matches `allow`. Otherwise it redirects — to the user's own home if they
 * are signed in as a different role, or to the login screen if not signed in.
 * This is what stops Manager/Admin/Employee navigation from bleeding across
 * layouts: each layout subtree is sealed to its own role.
 */
export function RoleGuard({ allow, children }: { allow: Role; children: React.ReactNode }) {
  const role = useSession((s) => s.role);
  const status = useSession((s) => s.status);

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 text-sm text-muted-foreground">
        Restoring session...
      </div>
    );
  }

  if (role === null) return <Navigate to={"/" as never} params={{} as never} search={{} as never} replace />;
  if (role !== allow) return <Navigate to={HOME[role]} params={{} as never} search={{} as never} replace />;

  return <>{children}</>;
}
