import { getSupabaseClient } from "@/repositories/supabase/client";
import type { Database } from "@/types/database";
import type { InviteMemberInput } from "@/types/employees";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type RoleRow = Database["public"]["Tables"]["roles"]["Row"];
export type PermissionRow = Database["public"]["Tables"]["permissions"]["Row"];
export type UserRoleRow = Database["public"]["Tables"]["user_roles"]["Row"];

const PROFILE_COLUMNS = "id,email,full_name,job_role,role,avatar_url,created_at";
const ROLE_COLUMNS = "id,name,description,created_at";
const PERMISSION_COLUMNS = "id,role_id,module,action";
const USER_ROLE_COLUMNS = "user_id,role_id";

type CreateEmployeeResponse = {
  id?: string;
  error?: {
    code?: string;
    message?: string;
  };
};

async function messageFromFunctionError(error: unknown): Promise<string> {
  const fallback = error instanceof Error ? error.message : "Unable to invite team member.";
  const context = (error as { context?: { json?: () => Promise<unknown> } } | null)?.context;

  if (!context?.json) return fallback;

  try {
    const body = await context.json();
    if (!body || typeof body !== "object") return fallback;
    const errorBody = body as CreateEmployeeResponse;
    return errorBody.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function fetchProfiles(): Promise<ProfileRow[]> {
  const { data, error } = await getSupabaseClient()
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .order("full_name", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function fetchManagerProfiles(): Promise<ProfileRow[]> {
  const { data, error } = await getSupabaseClient()
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("role", "manager")
    .order("full_name", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function fetchRoles(): Promise<RoleRow[]> {
  const { data, error } = await getSupabaseClient()
    .from("roles")
    .select(ROLE_COLUMNS)
    .order("name", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function fetchPermissions(): Promise<PermissionRow[]> {
  const { data, error } = await getSupabaseClient().from("permissions").select(PERMISSION_COLUMNS);

  if (error) throw error;

  return data ?? [];
}

export async function fetchUserRoles(): Promise<UserRoleRow[]> {
  const { data, error } = await getSupabaseClient().from("user_roles").select(USER_ROLE_COLUMNS);

  if (error) throw error;

  return data ?? [];
}

export async function inviteMember(input: InviteMemberInput): Promise<void> {
  const { data, error } = await getSupabaseClient().functions.invoke<CreateEmployeeResponse>(
    "create-employee",
    {
      body: {
        full_name: input.fullName,
        email: input.email,
        password: input.password,
        job_role: input.jobRole,
      },
    },
  );

  if (error) throw new Error(await messageFromFunctionError(error));
  if (data?.error) throw new Error(data.error.message ?? "Unable to invite team member.");
}

export async function insertRole(input: {
  name: string;
  description: string | null;
}): Promise<RoleRow> {
  const { data, error } = await getSupabaseClient()
    .from("roles")
    .insert({ name: input.name, description: input.description })
    .select(ROLE_COLUMNS)
    .single();

  if (error) throw error;

  return data;
}

export async function updateRole(input: {
  id: string;
  name: string;
  description: string | null;
}): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("roles")
    .update({ name: input.name, description: input.description })
    .eq("id", input.id);

  if (error) throw error;
}

export async function deleteRole(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from("roles").delete().eq("id", id);

  if (error) throw error;
}

export async function replaceRolePermissions(
  roleId: string,
  permissions: { module: string; action: string }[],
): Promise<void> {
  const client = getSupabaseClient();
  const { error: deleteError } = await client.from("permissions").delete().eq("role_id", roleId);

  if (deleteError) throw deleteError;
  if (permissions.length === 0) return;

  const { error: insertError } = await client
    .from("permissions")
    .insert(permissions.map((permission) => ({ role_id: roleId, ...permission })));

  if (insertError) throw insertError;
}

export async function reassignUserRole(input: {
  userId: string;
  fromRoleId: string;
  toRoleId: string;
}): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("user_roles")
    .update({ role_id: input.toRoleId })
    .eq("user_id", input.userId)
    .eq("role_id", input.fromRoleId);

  if (error) throw error;
}
