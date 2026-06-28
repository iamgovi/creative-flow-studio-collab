import {
  createClient,
  createClientWorkflows,
  createProject,
  deleteClient,
  deleteClientProjects,
  deleteClientWorkflows,
  fetchClientById,
  fetchClientProjects,
  fetchClients,
  type ClientProjectRow,
  type ProjectInsert,
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

export type CreateClientProjectType = "video" | "static";

export interface CreateClientInput {
  name: string;
  contactEmail: string;
  industry: string;
  notes: string;
  monthlyRevenue: string;
  setupFee: string;
  months: string;
  isContract: boolean;
  staticCount: string;
  videoCount: string;
  deadline?: Date;
  selectedManagerId: string;
  projectName: string;
  projectType: CreateClientProjectType | "";
  projectDeadline?: Date;
}

const DEFAULT_CLIENT_WORKFLOW_TYPES = ["static", "video"];

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

function nullableText(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function parseRequiredNumber(value: string, label: string, min: number) {
  if (value.trim() === "") throw new Error(`${label} is required.`);

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid number.`);
  if (parsed < min) throw new Error(`${label} must be at least ${min}.`);

  return parsed;
}

function parseOptionalMoney(value: string, label: string) {
  if (value.trim() === "") return 0;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid number.`);
  if (parsed < 0) throw new Error(`${label} cannot be negative.`);

  return parsed;
}

function assertValidEmail(value: string) {
  const email = value.trim();
  if (!email) throw new Error("Primary contact email is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid primary contact email.");
  }

  return email;
}

function validateDeadline(value: Date | undefined, label = "Deadline") {
  if (!value) return null;
  if (Number.isNaN(value.getTime())) throw new Error(`${label} must be a valid date.`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(value);
  deadline.setHours(0, 0, 0, 0);
  if (deadline < today) throw new Error(`${label} cannot be in the past.`);

  return value.toISOString();
}

function validateRequiredDate(value: Date | undefined, label: string) {
  const iso = validateDeadline(value, label);
  if (!iso) throw new Error(`${label} is required.`);

  return iso;
}

function mapCreateClientInput(input: CreateClientInput) {
  const name = input.name.trim();
  if (!name) throw new Error("Client name is required.");

  return {
    name,
    contact_email: assertValidEmail(input.contactEmail),
    industry: nullableText(input.industry),
    notes: nullableText(input.notes),
    monthly_revenue: parseRequiredNumber(input.monthlyRevenue, "Monthly revenue", 0),
    setup_fee: parseOptionalMoney(input.setupFee, "Setup fee"),
    contract_months: parseRequiredNumber(input.months, "Number of months", 1),
    is_contract: input.isContract,
    static_count: parseRequiredNumber(input.staticCount, "Static deliverables per month", 0),
    video_count: parseRequiredNumber(input.videoCount, "Video creatives per month", 0),
    deadline: validateDeadline(input.deadline),
  };
}

function mapCreateProjectInput(input: CreateClientInput, clientId: string): ProjectInsert {
  const name = input.projectName.trim();
  if (!name) throw new Error("Project name is required.");

  if (input.projectType !== "video" && input.projectType !== "static") {
    throw new Error("Project type is required.");
  }

  const ownerId = input.selectedManagerId.trim();
  if (!ownerId) throw new Error("Select a project manager before creating a client.");

  return {
    name,
    type: input.projectType,
    deadline: validateRequiredDate(input.projectDeadline, "Project deadline"),
    owner_id: ownerId,
    client_id: clientId,
    client: input.name.trim(),
    status: "active",
    progress: 0,
    current_stage: "planning",
  };
}

async function rollbackCreatedClient(clientId: string) {
  const results = await Promise.allSettled([
    deleteClientProjects(clientId),
    deleteClientWorkflows(clientId),
    deleteClient(clientId),
  ]);
  const failed = results.find((result) => result.status === "rejected");

  if (failed?.status === "rejected") {
    throw failed.reason;
  }
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export const clientsService = {
  getClients: fetchClients,
  getClientById: fetchClientById,
  async createClient(input: CreateClientInput): Promise<Client> {
    const client = await createClient(mapCreateClientInput(input));

    try {
      try {
        await createClientWorkflows(
          DEFAULT_CLIENT_WORKFLOW_TYPES.map((workflowType) => ({
            client_id: client.id,
            workflow_type: workflowType,
          })),
        );
      } catch (workflowError) {
        console.warn(errorMessage(workflowError, "Create client workflows failed."));
      }

      await createProject(mapCreateProjectInput(input, client.id));
    } catch (error) {
      try {
        await rollbackCreatedClient(client.id);
      } catch (rollbackError) {
        const rollbackMessage = errorMessage(rollbackError, "rollback failed");
        const originalMessage = errorMessage(error, "client setup failed");
        throw new Error(`${originalMessage} The client was created, but rollback failed: ${rollbackMessage}`);
      }

      throw error;
    }

    return client;
  },
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

export const clientService = clientsService;
