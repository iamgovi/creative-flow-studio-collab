import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { PlaceholderView } from "@/components/views/PlaceholderView";

export const Route = createFileRoute("/employee/notifications")({
  component: () => (
    <PlaceholderView
      title="Notifications"
      description="Mentions, assignments, approvals, and updates relevant to you."
      icon={Bell}
    />
  ),
});