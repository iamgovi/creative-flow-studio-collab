import { createFileRoute } from "@tanstack/react-router";
import { ProjectsView } from "@/components/views/ProjectsView";

export const Route = createFileRoute("/admin/projects")({ component: ProjectsView });