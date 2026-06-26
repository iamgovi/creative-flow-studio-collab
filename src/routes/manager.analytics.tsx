import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsView } from "@/components/views/AnalyticsView";

export const Route = createFileRoute("/manager/analytics")({
  head: () => ({
    meta: [
      { title: "Team Analytics — cntrlm" },
      { name: "description", content: "Optimization-focused team analytics: time, attendance, quality, workload and supportive insights." },
    ],
  }),
  component: AnalyticsView,
});