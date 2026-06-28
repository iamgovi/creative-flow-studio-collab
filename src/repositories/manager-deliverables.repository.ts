import { getSupabaseClient } from "@/repositories/supabase/client";
import type { Database } from "@/types/database";

const PROJECT_COLUMNS =
  "id,name,client,type,status,progress,current_stage,deadline,owner_id,client_id,created_at,updated_at";
const USER_COLUMNS = "id,name,email";

export type ManagerDeliverableProjectRow = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  | "id"
  | "name"
  | "client"
  | "type"
  | "status"
  | "progress"
  | "current_stage"
  | "deadline"
  | "owner_id"
  | "client_id"
  | "created_at"
  | "updated_at"
>;

export type ManagerDeliverableUserRow = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "name" | "email"
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

export async function fetchManagerDeliverableProjects(): Promise<ManagerDeliverableProjectRow[]> {
  const { data, error } = await getSupabaseClient()
    .from("projects")
    .select(PROJECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw supabaseError(error, "Fetch manager deliverables");

  return data ?? [];
}

export async function fetchManagerDeliverableOwnersByIds(
  ids: string[],
): Promise<ManagerDeliverableUserRow[]> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const { data, error } = await getSupabaseClient()
    .from("users")
    .select(USER_COLUMNS)
    .in("id", uniqueIds);

  if (error) throw supabaseError(error, "Fetch deliverable owners");

  return data ?? [];
}

export const managerDeliverablesRepository = {
  fetchManagerDeliverableProjects,
  fetchManagerDeliverableOwnersByIds,
};
