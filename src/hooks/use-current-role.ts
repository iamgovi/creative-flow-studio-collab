import { useRouterState, useNavigate } from "@tanstack/react-router";
import type { Role } from "@/data/mock";

/**
 * The current role is derived purely from the URL — never from mutable state.
 * This is the single source of truth that keeps the shell, sidebar, active
 * highlight and page content from ever desyncing.
 */
export function useCurrentRole(): Role {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/manager")) return "manager";
  return "employee";
}

/** Navigate to a team member's analytics deep-dive within the current role. */
export function useOpenMember() {
  const role = useCurrentRole();
  const navigate = useNavigate();
  return (id: string) => {
    if (role === "admin") {
      navigate({ to: "/admin/analytics/employee/$id", params: { id } });
    } else {
      navigate({ to: "/manager/analytics/employee/$id", params: { id } });
    }
  };
}