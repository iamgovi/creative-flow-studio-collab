import { getSupabaseClient } from "@/repositories/supabase/client";
import type { Session } from "@supabase/supabase-js";
import type { UserProfile } from "@/types/auth";

const PROFILE_COLUMNS = "id,email,full_name,role,avatar_url,created_at";
const ROLE_COLUMNS = "id,name,description";

export async function signInWithPassword(email: string, password: string): Promise<Session> {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });

  if (error) throw error;
  if (!data.session) throw new Error("Supabase did not return an authenticated session.");

  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut();

  if (error) throw error;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await getSupabaseClient().auth.getSession();

  if (error) throw error;

  return data.session;
}

export function onAuthStateChange(
  callback: Parameters<ReturnType<typeof getSupabaseClient>["auth"]["onAuthStateChange"]>[0],
) {
  return getSupabaseClient().auth.onAuthStateChange(callback);
}

export async function fetchProfileByUserId(userId: string): Promise<UserProfile | null> {
  const { data, error } = await getSupabaseClient()
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function fetchRoleNamesForUser(userId: string): Promise<string[]> {
  const { data: assignments, error: assignmentError } = await getSupabaseClient()
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId);

  if (assignmentError) throw assignmentError;
  if (!assignments?.length) return [];

  const roleIds = assignments.map((assignment) => assignment.role_id);
  const { data: roles, error: rolesError } = await getSupabaseClient()
    .from("roles")
    .select(ROLE_COLUMNS)
    .in("id", roleIds);

  if (rolesError) throw rolesError;

  return roles?.map((role) => role.name).filter(Boolean) ?? [];
}
