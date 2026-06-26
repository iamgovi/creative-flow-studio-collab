import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { PlaceholderView } from "@/components/views/PlaceholderView";

export const Route = createFileRoute("/admin/settings")({
  component: () => (
    <PlaceholderView
      title="Settings"
      description="Workspace configuration, integrations, and organization-wide preferences."
      icon={Settings}
    />
  ),
});