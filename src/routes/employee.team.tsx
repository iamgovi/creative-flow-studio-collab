import { createFileRoute } from "@tanstack/react-router";
import { TeamView } from "@/components/views/TeamView";

export const Route = createFileRoute("/employee/team")({ component: TeamView });