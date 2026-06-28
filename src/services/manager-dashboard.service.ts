import {
  fetchManagerActiveProjects,
  fetchManagerIncomingProjects,
  type ManagerDashboardProjectRow,
} from "@/repositories/manager-dashboard.repository";

export interface ManagerDashboardProject {
  id: string;
  name: string;
  client: string;
  progress: number;
  currentStage: string;
}

export interface ManagerDashboardData {
  counts: {
    incomingProjects: number;
    activeDeliverables: number;
    pendingApprovals: number;
    teamProductivity: number;
  };
  activeProjects: ManagerDashboardProject[];
  pendingApprovals: [];
  delayAlerts: [];
  workloadRows: [];
}

function normalizeProject(project: ManagerDashboardProjectRow): ManagerDashboardProject {
  return {
    id: project.id,
    name: project.name,
    client: project.client,
    progress: project.progress ?? 0,
    currentStage: project.current_stage ?? "Not started",
  };
}

export async function getManagerDashboardData(): Promise<ManagerDashboardData> {
  const [incomingProjects, activeProjects] = await Promise.all([
    fetchManagerIncomingProjects(),
    fetchManagerActiveProjects(),
  ]);

  return {
    counts: {
      incomingProjects: incomingProjects.length,
      activeDeliverables: activeProjects.length,
      pendingApprovals: 0,
      teamProductivity: 0,
    },
    activeProjects: activeProjects.map(normalizeProject),
    pendingApprovals: [],
    delayAlerts: [],
    workloadRows: [],
  };
}

export const managerDashboardService = {
  getManagerDashboardData,
};
