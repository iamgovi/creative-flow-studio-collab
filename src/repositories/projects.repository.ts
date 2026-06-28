import { getSupabaseClient } from "@/repositories/supabase/client";
import type { Database } from "@/types/database";

const PROJECT_COLUMNS = "*";
const USER_COLUMNS = "id,name,email";

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"] & {
  priority?: string | null;
  received_at?: string | null;
};

export type ProjectManagerRow = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name" | "email">;

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

async function fetchProjectsByStatus(status: "incoming" | "active"): Promise<ProjectRow[]> {
  const { data, error } = await getSupabaseClient()
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw supabaseError(error, `Fetch ${status} projects`);

  return (data ?? []) as ProjectRow[];
}

export function fetchIncomingProjects(): Promise<ProjectRow[]> {
  return fetchProjectsByStatus("incoming");
}

export function fetchActiveProjects(): Promise<ProjectRow[]> {
  return fetchProjectsByStatus("active");
}

export async function fetchProjectManagersByIds(ids: string[]): Promise<ProjectManagerRow[]> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const { data, error } = await getSupabaseClient()
    .from("users")
    .select(USER_COLUMNS)
    .in("id", uniqueIds);

  if (error) throw supabaseError(error, "Fetch project managers");

  return data ?? [];
}

export const projectsRepository = {
  fetchIncomingProjects,
  fetchActiveProjects,
  fetchProjectManagersByIds,
};
