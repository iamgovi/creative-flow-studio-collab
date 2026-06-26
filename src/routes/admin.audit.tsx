import { createFileRoute } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { PlaceholderView } from "@/components/views/PlaceholderView";

export const Route = createFileRoute("/admin/audit")({
  component: () => (
    <PlaceholderView
      title="Audit Log"
      description="A complete, tamper-evident history of security and account activity."
      icon={ScrollText}
    />
  ),
});