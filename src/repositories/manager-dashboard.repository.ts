import {
  fetchActiveProjects,
  fetchIncomingProjects,
  type ProjectRow,
} from "@/repositories/projects.repository";

export type ManagerDashboardProjectRow = ProjectRow;

export async function fetchManagerIncomingProjects(): Promise<ManagerDashboardProjectRow[]> {
  return fetchIncomingProjects();
}

export async function fetchManagerActiveProjects(): Promise<ManagerDashboardProjectRow[]> {
  return fetchActiveProjects();
}

export const managerDashboardRepository = {
  fetchManagerIncomingProjects,
  fetchManagerActiveProjects,
};
