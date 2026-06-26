import { createFileRoute } from "@tanstack/react-router";
import { ManagerDeliverablesView } from "@/components/deliverables/ManagerDeliverablesView";

export const Route = createFileRoute("/manager/deliverables/")({
  component: ManagerDeliverablesView,
});
