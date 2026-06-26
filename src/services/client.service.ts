import {
  fetchClientById,
  fetchClientProjects,
  fetchClients,
  type ClientProjectRow,
} from "@/repositories/clients.repository";
import type { Client } from "@/types/client";

export interface ClientListRow {
  id: string;
  name: string;
  projects: number;
  activeProjects: number;
  mrr: number;
  ytd: number;
  since: string;
}

export interface ClientDeliverableRow {
  id: string;
  name: string;
  client: string;
  type: string;
  progress: number;
  status: string;
}

export interface ClientRevenueTrendPoint {
  month: string;
  revenue: number;
  new: number;
}

export interface ClientsPageData {
  clients: ClientListRow[];
  deliverables: ClientDeliverableRow[];
  summary: {
    totalMRR: number;
    revenueYTD: number;
    activeClients: number;
    activeDeliverables: number;
    totalDeliverables: number;
  };
  revenueTrend: ClientRevenueTrendPoint[];
  limitations: {
    activeClients: string;
    revenueTrend: string;
  };
}

const PLACEHOLDER_REVENUE_TREND: ClientRevenueTrendPoint[] = [
  { month: "Jun", revenue: 92, new: 2 },
  { month: "Jul", revenue: 98, new: 3 },
  { month: "Aug", revenue: 104, new: 1 },
  { month: "Sep", revenue: 101, new: 2 },
  { month: "Oct", revenue: 112, new: 4 },
  { month: "Nov", revenue: 118, new: 2 },
  { month: "Dec", revenue: 121, new: 3 },
  { month: "Jan", revenue: 126, new: 2 },
  { month: "Feb", revenue: 132, new: 3 },
  { month: "Mar", revenue: 137, new: 1 },
  { month: "Apr", revenue: 143, new: 2 },
  { month: "May", revenue: 149, new: 3 },
];

function monthsInCurrentYearSince(createdAt: string) {
  const now = new Date();
  const created = new Date(createdAt);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const startsAt = created > yearStart ? created : yearStart;

  if (startsAt.getFullYear() !== now.getFullYear()) return now.getMonth() + 1;

  return now.getMonth() - startsAt.getMonth() + 1;
}

function estimateRevenueYtd(client: Client) {
  const monthlyRevenue = client.monthly_revenue ?? 0;
  const setupFee = client.setup_fee ?? 0;
  const created = new Date(client.created_at);
  const setupFeeYtd = created.getFullYear() === new Date().getFullYear() ? setupFee : 0;

  return monthlyRevenue * monthsInCurrentYearSince(client.created_at) + setupFeeYtd;
}

function projectIsActive(project: ClientProjectRow) {
  const status = project.status?.toLowerCase();
  if (status === "done" || status === "completed" || status === "delivered") return false;
  return (project.progress ?? 0) < 100;
}

function buildProjectCounts(projects: ClientProjectRow[]) {
  const counts = new Map<string, { projects: number; activeProjects: number }>();

  for (const project of projects) {
    const keys = [project.client_id, project.client].filter(Boolean) as string[];

    for (const key of keys) {
      const current = counts.get(key) ?? { projects: 0, activeProjects: 0 };
      current.projects += 1;
      if (projectIsActive(project)) current.activeProjects += 1;
      counts.set(key, current);
    }
  }

  return counts;
}

function mapClientRows(clients: Client[], projects: ClientProjectRow[]): ClientListRow[] {
  const projectCounts = buildProjectCounts(projects);

  return clients
    .map((client) => {
      const counts = projectCounts.get(client.id) ?? projectCounts.get(client.name) ?? {
        projects: 0,
        activeProjects: 0,
      };

      return {
        id: client.id,
        name: client.name,
        projects: counts.projects,
        activeProjects: counts.activeProjects,
        mrr: client.monthly_revenue ?? 0,
        ytd: estimateRevenueYtd(client),
        since: client.created_at,
      };
    })
    .sort((a, b) => b.mrr - a.mrr);
}

function mapDeliverables(projects: ClientProjectRow[]): ClientDeliverableRow[] {
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    client: project.client,
    type: project.type,
    progress: project.progress ?? 0,
    status: project.status ?? "unknown",
  }));
}

export const clientService = {
  getClients: fetchClients,
  getClientById: fetchClientById,
  async getClientsPageData(): Promise<ClientsPageData> {
    const [clients, projects] = await Promise.all([fetchClients(), fetchClientProjects()]);
    const clientRows = mapClientRows(clients, projects);
    const deliverables = mapDeliverables(projects);
    const activeDeliverables = projects.filter(projectIsActive).length;

    return {
      clients: clientRows,
      deliverables,
      summary: {
        totalMRR: clientRows.reduce((sum, client) => sum + client.mrr, 0),
        revenueYTD: clientRows.reduce((sum, client) => sum + client.ytd, 0),
        activeClients: clientRows.length,
        activeDeliverables,
        totalDeliverables: projects.length,
      },
      revenueTrend: PLACEHOLDER_REVENUE_TREND,
      limitations: {
        activeClients:
          "clients has no status field, so active clients is the count of visible client rows.",
        revenueTrend:
          "No monthly revenue history table or timestamped revenue records exist; chart uses temporary placeholder values.",
      },
    };
  },
};
