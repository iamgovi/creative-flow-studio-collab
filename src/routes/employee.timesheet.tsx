import { createFileRoute } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { PlaceholderView } from "@/components/views/PlaceholderView";

export const Route = createFileRoute("/employee/timesheet")({
  component: () => (
    <PlaceholderView
      title="Timesheet"
      description="Your logged hours, attendance, and weekly breakdown."
      icon={Clock}
    />
  ),
});