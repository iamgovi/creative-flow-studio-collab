import { useQuery } from "@tanstack/react-query";
import { projectsService } from "@/services/projects.service";

export function useProjects() {
  const query = useQuery({
    queryKey: ["admin", "projects"],
    queryFn: () => projectsService.getProjectsPageData(),
  });

  return {
    projects: query.data?.projects ?? [],
    incomingProjects: query.data?.incomingProjects ?? [],
    activeProjects: query.data?.activeProjects ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
  };
}
