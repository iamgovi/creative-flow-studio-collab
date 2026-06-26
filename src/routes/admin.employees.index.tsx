import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/employees/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/employees/roles" });
  },
});
