import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/admin")({
  component: () => (
    <RoleGuard allow="admin">
      <Outlet />
    </RoleGuard>
  ),
});