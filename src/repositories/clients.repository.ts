import { getSupabaseClient } from "@/repositories/supabase/client";
import type { Database } from "@/types/database";
import type { Client } from "@/types/client";

const CLIENT_COLUMNS =
  "id,name,contact_email,industry,notes,monthly_revenue,setup_fee,created_by,created_at,updated_at";
const PROJECT_COLUMNS =
  "id,name,client,type,current_stage,progress,owner_id,deadline,created_at,updated_at,status,client_id";

export type ClientProjectRow = Database["public"]["Tables"]["projects"]["Row"];

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
