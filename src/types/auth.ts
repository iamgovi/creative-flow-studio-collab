import type { Session, User } from "@supabase/supabase-js";
import type { Role } from "@/data/mock";
import type { Database } from "./database";

export type AuthUser = User;
export type AuthSession = Session;
export type UserProfile = Database["public"]["Tables"]["profiles"]["Row"];
export type AppRole = Role;

export interface AuthSessionUser {
  user: AuthUser;
  profile: UserProfile;
  role: AppRole;
}
