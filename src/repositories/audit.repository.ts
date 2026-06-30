import { getSupabaseClient } from "@/repositories/supabase/client";
import type { Database } from "@/types/database";

const AUDIT_COLUMNS = "id,created_at,user_id,action,target,details,ip_address";
const USER_COLUMNS = "id,name,email";

export type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];
export type AuditLogInsert = Database["public"]["Tables"]["audit_logs"]["Insert"];
export type AuditUserRow = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name" | "email">;

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

export async function fetchAuditLogs(limit = 100): Promise<AuditLogRow[]> {
  const { data, error } = await getSupabaseClient()
    .from("audit_logs")
    .select(AUDIT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw supabaseError(error, "Fetch audit logs");

  return data ?? [];
}

export async function fetchAuditUsersByIds(ids: string[]): Promise<AuditUserRow[]> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const { data, error } = await getSupabaseClient()
    .from("users")
    .select(USER_COLUMNS)
    .in("id", uniqueIds);

  if (error) throw supabaseError(error, "Fetch audit users");

  return data ?? [];
}

export async function resolveCurrentAuditUserId(): Promise<string | null> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw supabaseError(userError, "Read signed-in audit user");
  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw supabaseError(error, "Resolve audit user");

  return data?.id ?? null;
}

export async function insertAuditLog(input: AuditLogInsert): Promise<void> {
  const { error } = await getSupabaseClient().from("audit_logs").insert(input);

  if (error) throw supabaseError(error, "Create audit log");
}

export const auditRepository = {
  fetchAuditLogs,
  fetchAuditUsersByIds,
  resolveCurrentAuditUserId,
  insertAuditLog,
};
