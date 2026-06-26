import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/manager")({
  component: () => (
    <RoleGuard allow="manager">
      <Outlet />
    </RoleGuard>
  ),
});