import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/employee")({
  component: () => (
    <RoleGuard allow="employee">
      <Outlet />
    </RoleGuard>
  ),
});