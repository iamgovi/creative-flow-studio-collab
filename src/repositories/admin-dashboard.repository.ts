import { getSupabaseClient } from "@/repositories/supabase/client";
import type { Database } from "@/types/database";

const TEAM_MATE_COLUMNS = "id,name,email,department,position,avatar_url,status,created_at";
const CLIENT_COLUMNS = "id,name,created_at";
const PROJECT_SUMMARY_COLUMNS = "id,client_id,client,status";

export type DashboardUserRow = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "name" | "email" | "department" | "position" | "avatar_url" | "status" | "created_at"
>;

export type DashboardClientRow = Pick<
  Database["public"]["Tables"]["clients"]["Row"],
  "id" | "name" | "created_at"
>;

export type DashboardProjectSummaryRow = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  "id" | "client_id" | "client" | "status"
>;

function supabaseError(error: unknown, operation: string): Error {
  if (error instanceof Error) return error;

  const record = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
  const message =
    typeof record?.message === "string" && record.message.trim()
      ? record.message
      : "Supabase request failed.";
  const details =
    typeof record?.details === "string" && record.details.trim() ? ` Details: ${record.details}` : "";
  const hint = typeof record?.hint === "string" && record.hint.trim() ? ` Hint: ${record.hint}` : "";
  const code = typeof record?.code === "string" && record.code.trim() ? ` (${record.code})` : "";

  return new Error(`${operation} failed${code}: ${message}${details}${hint}`);
}

export async function countUsersByPosition(position: "employee" | "manager"): Promise<number> {
  const { count, error } = await getSupabaseClient()
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("position", position);

  if (error) throw supabaseError(error, `Count ${position}s`);

  return count ?? 0;
}

export async function countClients(): Promise<number> {
  const { count, error } = await getSupabaseClient()
    .from("clients")
    .select("id", { count: "exact", head: true });

  if (error) throw supabaseError(error, "Count clients");

  return count ?? 0;
}

export async function countProjectsByStatus(status: "active" | "incoming"): Promise<number> {
  const { count, error } = await getSupabaseClient()
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("status", status);

  if (error) throw supabaseError(error, `Count ${status} projects`);

  return count ?? 0;
}

export async function fetchTeamMates(limit = 7): Promise<DashboardUserRow[]> {
  const { data, error } = await getSupabaseClient()
    .from("users")
    .select(TEAM_MATE_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw supabaseError(error, "Fetch team mates");

  return data ?? [];
}

export async function fetchRecentClients(limit = 7): Promise<DashboardClientRow[]> {
  const { data, error } = await getSupabaseClient()
    .from("clients")
    .select(CLIENT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw supabaseError(error, "Fetch recent clients");

  return data ?? [];
}

export async function fetchClientProjectSummaries(): Promise<DashboardProjectSummaryRow[]> {
  const { data, error } = await getSupabaseClient()
    .from("projects")
    .select(PROJECT_SUMMARY_COLUMNS)
    .in("status", ["active", "incoming"]);

  if (error) throw supabaseError(error, "Fetch client project summaries");

  return data ?? [];
}

export const adminDashboardRepository = {
  countUsersByPosition,
  countClients,
  countProjectsByStatus,
  fetchTeamMates,
  fetchRecentClients,
  fetchClientProjectSummaries,
};
