import {
  countClients,
  countProjectsByStatus,
  countUsersByPosition,
  fetchClientProjectSummaries,
  fetchRecentClients,
  fetchTeamMates,
  type DashboardClientRow,
  type DashboardProjectSummaryRow,
  type DashboardUserRow,
} from "@/repositories/admin-dashboard.repository";

export interface DashboardKpis {
  employees: number;
  managers: number;
  clients: number;
  activeDeliverables: number;
  incomingProjects: number;
}

export interface DashboardTeamMate {
  id: string;
  name: string;
  department: string;
  position: string;
  avatarUrl: string | null;
  status: string;
}

export interface DashboardClientSummary {
  id: string;
  name: string;
  activeProjects: number;
  incomingProjects: number;
}

function normalizeTeamMate(user: DashboardUserRow): DashboardTeamMate {
  return {
    id: user.id,
    name: user.name ?? user.email ?? "Unnamed user",
    department: user.department ?? "No department",
    position: user.position ?? "Unassigned",
    avatarUrl: user.avatar_url,
    status: user.status ?? "unknown",
  };
}

function buildProjectCounts(projects: DashboardProjectSummaryRow[]) {
  const counts = new Map<string, { activeProjects: number; incomingProjects: number }>();

  for (const project of projects) {
    const keys = [project.client_id, project.client].filter(Boolean) as string[];

    for (const key of keys) {
      const current = counts.get(key) ?? { activeProjects: 0, incomingProjects: 0 };

      if (project.status === "active") current.activeProjects += 1;
      if (project.status === "incoming") current.incomingProjects += 1;

      counts.set(key, current);
    }
  }

  return counts;
}

function normalizeClient(
  client: DashboardClientRow,
  projectCounts: Map<string, { activeProjects: number; incomingProjects: number }>,
): DashboardClientSummary {
  const counts = projectCounts.get(client.id) ?? projectCounts.get(client.name) ?? {
    activeProjects: 0,
    incomingProjects: 0,
  };

  return {
    id: client.id,
    name: client.name,
    activeProjects: counts.activeProjects,
    incomingProjects: counts.incomingProjects,
  };
}

export function getEmployeeCount(): Promise<number> {
  return countUsersByPosition("employee");
}

export function getManagerCount(): Promise<number> {
  return countUsersByPosition("manager");
}

export function getClientCount(): Promise<number> {
  return countClients();
}

export function getActiveDeliverableCount(): Promise<number> {
  return countProjectsByStatus("active");
}

export function getIncomingProjectCount(): Promise<number> {
  return countProjectsByStatus("incoming");
}

export async function getDashboardTeamMates(): Promise<DashboardTeamMate[]> {
  const users = await fetchTeamMates();

  return users.map(normalizeTeamMate);
}

export async function getDashboardClients(): Promise<DashboardClientSummary[]> {
  const [clients, projects] = await Promise.all([
    fetchRecentClients(),
    fetchClientProjectSummaries(),
  ]);
  const projectCounts = buildProjectCounts(projects);

  return clients.map((client) => normalizeClient(client, projectCounts));
}

export const adminDashboardService = {
  getEmployeeCount,
  getManagerCount,
  getClientCount,
  getActiveDeliverableCount,
  getIncomingProjectCount,
  getDashboardTeamMates,
  getDashboardClients,
};
