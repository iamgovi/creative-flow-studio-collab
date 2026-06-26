import { createFileRoute } from "@tanstack/react-router";
import { ClientsView } from "@/components/views/ClientsView";

export const Route = createFileRoute("/admin/clients")({ component: ClientsView });