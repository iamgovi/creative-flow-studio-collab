import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { AnalyticsEmployeeView } from "@/components/views/AnalyticsEmployeeView";

export const Route = createFileRoute("/manager/analytics_/employee/$id")({
  component: EmployeeProfile,
  notFoundComponent: () => (
    <AppShell>
      <div className="p-10 text-center text-sm text-muted-foreground">Team member not found.</div>
    </AppShell>
  ),
});

function EmployeeProfile() {
  const { id } = Route.useParams();
  return <AnalyticsEmployeeView id={id} />;
}