import { createFileRoute } from "@tanstack/react-router";
import { ClientNewView } from "@/components/views/ClientNewView";

export const Route = createFileRoute("/admin/clients_/new")({ component: ClientNewView });