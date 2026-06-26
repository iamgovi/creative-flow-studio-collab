import { createFileRoute } from "@tanstack/react-router";
import { DeliverablesPage } from "@/components/deliverables/DeliverablesPage";

export const Route = createFileRoute("/admin/deliverables/")({
  head: () => ({
    meta: [
      { title: "Deliverables — cntrlm" },
      { name: "description", content: "Portfolio-level delivery health across all clients: on-time rate, at-risk clients, delay bottlenecks and trends." },
    ],
  }),
  component: DeliverablesPage,
});