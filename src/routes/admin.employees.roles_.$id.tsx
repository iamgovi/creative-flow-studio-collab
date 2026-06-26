import { createFileRoute, Link } from "@tanstack/react-router";
import { useRoles } from "@/stores/roles";
import { RoleEditor } from "@/components/roles/RoleEditor";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useEffect } from "react";

const searchSchema = z.object({ edit: z.boolean().optional() });

export const Route = createFileRoute("/admin/employees/roles_/$id")({
  component: RoleDetailPage,
  validateSearch: searchSchema,
});

function RoleDetailPage() {
  const { id } = Route.useParams();
  const { edit } = Route.useSearch();
  const role = useRoles((s) => s.roles.find((r) => r.id === id));
  const loaded = useRoles((s) => s.loaded);
  const loading = useRoles((s) => s.loading);
  const loadRoles = useRoles((s) => s.loadRoles);

  useEffect(() => {
    if (!loaded) void loadRoles();
  }, [loadRoles, loaded]);

  if (loading && !role) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Loading role...</div>;
  }

  if (!role) {
    return (
      <div className="p-10 text-center">
        <div className="text-sm text-muted-foreground">Role not found.</div>
        <Button asChild variant="outline" className="mt-3"><Link to="/admin/employees/roles">Back to Roles</Link></Button>
      </div>
    );
  }

  const mode = edit ? "edit" : "view";
  return <RoleEditor mode={mode} initial={role} />;
}
