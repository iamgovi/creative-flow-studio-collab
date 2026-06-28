import {
  fetchManagerDeliverableOwnersByIds,
  fetchManagerDeliverableProjects,
  type ManagerDeliverableProjectRow,
} from "@/repositories/manager-deliverables.repository";

export interface ManagerDeliverableItem {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  type: string;
  status: string;
  currentStage: string;
  progress: number;
  deadline: string | null;
  ownerId: string | null;
  managerName: string;
  createdAt: string;
}

export interface ManagerDeliverableClient {
  id: string;
  name: string;
}

export interface ManagerDeliverablesData {
  deliverables: ManagerDeliverableItem[];
  clients: ManagerDeliverableClient[];
  statuses: string[];
}

const NOT_STARTED = "Not Started";

function normalizeProject(
  project: ManagerDeliverableProjectRow,
  ownerNamesById: Map<string, string>,
): ManagerDeliverableItem {
  const ownerId = project.owner_id ?? null;

  return {
    id: project.id,
    clientId: project.client_id ?? project.client,
    clientName: project.client,
    name: project.name,
    type: project.type,
    status: project.status ?? "unknown",
    currentStage: project.current_stage ?? NOT_STARTED,
    progress: project.progress ?? 0,
    deadline: project.deadline,
    ownerId,
    managerName: ownerId ? ownerNamesById.get(ownerId) ?? "Unassigned" : "Unassigned",
    createdAt: project.created_at,
  };
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export async function getManagerDeliverablesData(): Promise<ManagerDeliverablesData> {
  const projectRows = await fetchManagerDeliverableProjects();
  const ownerRows = await fetchManagerDeliverableOwnersByIds(
    projectRows.map((project) => project.owner_id).filter((id): id is string => Boolean(id)),
  );
  const ownerNamesById = new Map(
    ownerRows.map((owner) => [owner.id, owner.name ?? owner.email ?? "Unnamed manager"]),
  );
  const deliverables = projectRows.map((project) => normalizeProject(project, ownerNamesById));
  const clients = Array.from(
    deliverables.reduce((map, deliverable) => {
      if (!map.has(deliverable.clientId)) {
        map.set(deliverable.clientId, {
          id: deliverable.clientId,
          name: deliverable.clientName,
        });
      }
      return map;
    }, new Map<string, ManagerDeliverableClient>()).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  return {
    deliverables,
    clients,
    statuses: uniqueSorted(deliverables.map((deliverable) => deliverable.status)),
  };
}

export const managerDeliverablesService = {
  getManagerDeliverablesData,
};
