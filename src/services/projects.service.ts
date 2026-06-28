import {
  fetchActiveProjects,
  fetchIncomingProjects,
  fetchProjectManagersByIds,
  type ProjectRow,
} from "@/repositories/projects.repository";

export interface ProjectListItem {
  id: string;
  name: string;
  client: string;
  type: string;
  currentStage: string;
  progress: number;
  ownerId: string | null;
  managerName: string | null;
  deadline: string | null;
  receivedAt: string;
  priority: string;
  status: string;
}

export interface ProjectsPageData {
  projects: ProjectListItem[];
  incomingProjects: ProjectListItem[];
  activeProjects: ProjectListItem[];
}

function normalizeProject(
  project: ProjectRow,
  managerNamesById: Map<string, string>,
): ProjectListItem {
  const ownerId = project.owner_id ?? null;

  return {
    id: project.id,
    name: project.name,
    client: project.client,
    type: project.type,
    currentStage: project.current_stage ?? "Not started",
    progress: project.progress ?? 0,
    ownerId,
    managerName: ownerId ? managerNamesById.get(ownerId) ?? null : null,
    deadline: project.deadline,
    receivedAt: project.received_at ?? project.created_at,
    priority: project.priority ?? "medium",
    status: project.status ?? "unknown",
  };
}

export async function getProjectsPageData(): Promise<ProjectsPageData> {
  const [incomingRows, activeRows] = await Promise.all([
    fetchIncomingProjects(),
    fetchActiveProjects(),
  ]);
  const rows = [...incomingRows, ...activeRows];
  const managers = await fetchProjectManagersByIds(
    rows.map((project) => project.owner_id).filter((id): id is string => Boolean(id)),
  );
  const managerNamesById = new Map(
    managers.map((manager) => [
      manager.id,
      manager.name ?? manager.email ?? "Unnamed manager",
    ]),
  );
  const incomingProjects = incomingRows.map((project) =>
    normalizeProject(project, managerNamesById),
  );
  const activeProjects = activeRows.map((project) =>
    normalizeProject(project, managerNamesById),
  );

  return {
    projects: [...incomingProjects, ...activeProjects],
    incomingProjects,
    activeProjects,
  };
}

export const projectsService = {
  getProjectsPageData,
};
