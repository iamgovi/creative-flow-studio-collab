import { createFileRoute } from "@tanstack/react-router";
import { DeliverableDetailPage } from "@/components/deliverables/DeliverableDetailPage";

export const Route = createFileRoute("/admin/deliverables/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <DeliverableDetailPage id={id} />;
}