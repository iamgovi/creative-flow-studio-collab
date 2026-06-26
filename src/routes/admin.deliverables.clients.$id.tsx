import { createFileRoute } from "@tanstack/react-router";
import { ClientDetailPage } from "@/components/deliverables/ClientDetailPage";

export const Route = createFileRoute("/admin/deliverables/clients/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <ClientDetailPage id={id} />;
}