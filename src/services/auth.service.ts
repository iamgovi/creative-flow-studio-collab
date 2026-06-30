import {
  fetchProfileByUserId,
  fetchRoleNamesForUser,
  getCurrentSession,
  onAuthStateChange,
  signInWithPassword,
  signOut,
} from "@/repositories/auth.repository";
import { attendanceService } from "@/services/attendance.service";
import type { AppRole, AuthSession, AuthSessionUser } from "@/types/auth";

const ROLE_PRIORITY: AppRole[] = ["admin", "manager", "employee"];

function normalizeRole(value: string | null | undefined): AppRole | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();

  if (normalized === "admin" || normalized === "super admin" || normalized === "administrator") return "admin";
  if (normalized === "manager" || normalized.includes("manager")) return "manager";
  if (normalized === "employee" || normalized === "staff" || normalized === "member") return "employee";

  return null;
}

function resolveRole(profileRole: string | null | undefined, roleNames: string[]): AppRole {
  const normalizedRoleNames = roleNames.map(normalizeRole).filter(Boolean) as AppRole[];

  for (const role of ROLE_PRIORITY) {
    if (normalizedRoleNames.includes(role)) return role;
  }

  const profileAppRole = normalizeRole(profileRole);
  if (profileAppRole) return profileAppRole;

  return "employee";
}

async function buildSessionUser(session: AuthSession): Promise<AuthSessionUser> {
  const user = session.user;
  const profile = await fetchProfileByUserId(user.id);

  if (!profile) {
    throw new Error("Authenticated user does not have a matching profile.");
  }

  let roleNames: string[] = [];
  try {
    roleNames = await fetchRoleNamesForUser(user.id);
  } catch {
    roleNames = [];
  }

  return {
    user,
    profile,
    role: resolveRole(profile.role, roleNames),
  };
}

export const authService = {
  async signIn(email: string, password: string): Promise<AuthSessionUser> {
    const session = await signInWithPassword(email, password);
    const sessionUser = await buildSessionUser(session);

    if (sessionUser.role === "employee") {
      await attendanceService.ensureClockedInForTodaySafely(sessionUser.profile.id);
    }

    return sessionUser;
  },

  async signOut(): Promise<void> {
    await signOut();
  },

  async restoreSession(): Promise<AuthSessionUser | null> {
    const session = await getCurrentSession();
    if (!session) return null;

    return buildSessionUser(session);
  },

  onAuthStateChange,
};
