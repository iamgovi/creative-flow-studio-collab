import { getSupabaseClient } from "@/repositories/supabase/client";
import type { Database } from "@/types/database";
import type { Client } from "@/types/client";

const CLIENT_COLUMNS =
  "id,name,contact_email,industry,notes,monthly_revenue,setup_fee,contract_months,is_contract,static_count,video_count,deadline,created_by,created_at,updated_at";
const PROJECT_COLUMNS =
  "id,name,client,type,current_stage,progress,owner_id,deadline,created_at,updated_at,status,client_id";
const USER_COLUMNS = "id";

export type ClientProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
export type ClientWorkflowRow = Database["public"]["Tables"]["client_workflows"]["Row"];
export type ClientWorkflowInsert = Database["public"]["Tables"]["client_workflows"]["Insert"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type UserRow = Database["public"]["Tables"]["users"]["Row"];

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await getSupabaseClient()
    .from("clients")
    .select(CLIENT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

export async function fetchClientById(id: string): Promise<Client | null> {
  const { data, error } = await getSupabaseClient()
    .from("clients")
    .select(CLIENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function fetchClientProjects(): Promise<ClientProjectRow[]> {
  const { data, error } = await getSupabaseClient()
    .from("projects")
    .select(PROJECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

async function resolveClientCreatedById(authUserId: string): Promise<string | null> {
  const { data, error } = await getSupabaseClient()
    .from("users")
    .select(USER_COLUMNS)
    .eq("id", authUserId)
    .maybeSingle();

  if (error) throw error;

  return data?.id ?? null;
}

export async function createClient(input: Omit<ClientInsert, "created_by">): Promise<Client> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be signed in to create a client.");

  const createdBy = await resolveClientCreatedById(user.id);
  const payload = { ...input, created_by: createdBy };
  console.log("CLIENT INSERT PAYLOAD", payload);
  const { data, error } = await supabase
    .from("clients")
    .insert(payload)
    .select(CLIENT_COLUMNS)
    .single();

  if (error) throw error;

  return data;
}

export async function createClientWorkflows(
  rows: ClientWorkflowInsert[],
): Promise<ClientWorkflowRow[]> {
  if (rows.length === 0) return [];

  const { data, error } = await getSupabaseClient()
    .from("client_workflows")
    .insert(rows)
    .select("id,client_id,workflow_type,created_at");

  if (error) throw error;

  return data ?? [];
}

export async function createProject(input: ProjectInsert): Promise<ClientProjectRow> {
  const { data, error } = await getSupabaseClient()
    .from("projects")
    .insert(input)
    .select(PROJECT_COLUMNS)
    .single();

  if (error) throw error;

  return data;
}

export async function deleteClientWorkflows(clientId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("client_workflows")
    .delete()
    .eq("client_id", clientId);

  if (error) throw error;
}

export async function deleteClientProjects(clientId: string): Promise<void> {
  const { error } = await getSupabaseClient().from("projects").delete().eq("client_id", clientId);

  if (error) throw error;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from("clients").delete().eq("id", id);

  if (error) throw error;
}

export const clientsRepository = {
  fetchClients,
  fetchClientById,
  fetchClientProjects,
  createClient,
  createClientWorkflows,
  createProject,
  deleteClientProjects,
  deleteClientWorkflows,
  deleteClient,
};
