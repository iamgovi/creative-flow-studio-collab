import {
  deleteRole,
  fetchPermissions,
  fetchProfiles,
  fetchRoles,
  fetchUserRoles,
  inviteMember as inviteMemberRequest,
  insertRole,
  reassignUserRole,
  replaceRolePermissions,
  updateRole,
  type PermissionRow,
  type ProfileRow,
  type RoleRow,
  type UserRoleRow,
} from "@/repositories/employees.repository";
import {
  ACTIONS,
  MODULES,
  applyDependencies,
  type ActionKey,
  type ModuleKey,
  type PermissionMap,
} from "@/data/permissions";
import {
  JOB_ROLES,
  type JobRole,
  type RoleEmployee,
  type RoleLevel,
  type RoleRecord,
  type InviteMemberInput,
} from "@/types/employees";

export interface EmployeesModuleData {
  employees: RoleEmployee[];
  roles: RoleRecord[];
}

const MODULE_KEYS = new Set(MODULES.map((module) => module.key));
const ACTION_KEYS = new Set(ACTIONS);
const JOB_ROLE_SET = new Set<string>(JOB_ROLES);
const NOT_ASSIGNED_JOB_ROLE = "Not Assigned";

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function roleLevel(name: string): RoleLevel {
  if (isJobRole(name)) return name;

  const normalized = name.toLowerCase();
  if (normalized.includes("admin") || normalized.includes("executive")) return "Executive";
  if (normalized.includes("manager") || normalized.includes("head")) return "Manager-Level";
  if (normalized.includes("senior") || normalized.includes("lead")) return "Team Lead-Level";
  if (normalized.includes("read")) return "Read-Only";
  return "Standard";
}

function roleDescription(name: string, description: string | null) {
  return description?.trim() || `${titleCase(name)} role from Supabase.`;
}

function isJobRole(value: string): value is JobRole {
  return JOB_ROLE_SET.has(value);
}

function profileToEmployee(profile: ProfileRow): RoleEmployee {
  const name = profile.full_name?.trim() || profile.email;
  const jobRole = profile.job_role?.trim() || NOT_ASSIGNED_JOB_ROLE;

  return {
    id: profile.id,
    name,
    email: profile.email,
    jobRole,
    department: jobRole,
    avatar: profile.avatar_url ?? "",
  };
}

function permissionsToMap(rows: PermissionRow[]): PermissionMap {
  const map: PermissionMap = {};

  for (const row of rows) {
    if (!MODULE_KEYS.has(row.module as ModuleKey)) continue;
    if (!ACTION_KEYS.has(row.action as ActionKey)) continue;

    const module = row.module as ModuleKey;
    const action = row.action as ActionKey;
    map[module] = { ...(map[module] ?? {}), [action]: true };
  }

  return applyDependencies(map);
}

function mapPermissionsForWrite(perms: PermissionMap) {
  const normalized = applyDependencies(perms);
  const rows: { module: string; action: string }[] = [];

  for (const module of MODULES) {
    for (const action of module.supports) {
      if (normalized[module.key]?.[action]) {
        rows.push({ module: module.key, action });
      }
    }
  }

  return rows;
}

function roleRowToRecord(
  role: RoleRow,
  permissionsByRole: Map<string, PermissionRow[]>,
  assignedIds: string[],
): RoleRecord {
  return {
    id: role.id,
    name: role.name,
    level: roleLevel(role.name),
    type: "custom",
    description: roleDescription(role.name, role.description),
    permissions: permissionsToMap(permissionsByRole.get(role.id) ?? []),
    createdAt: role.created_at,
    assignedIds,
  };
}

function buildModuleData(
  profiles: ProfileRow[],
  roles: RoleRow[],
  permissions: PermissionRow[],
  userRoles: UserRoleRow[],
): EmployeesModuleData {
  const employees = profiles.map(profileToEmployee);
  const permissionsByRole = new Map<string, PermissionRow[]>();
  const assignedByRole = new Map<string, string[]>();

  for (const permission of permissions) {
    permissionsByRole.set(permission.role_id, [
      ...(permissionsByRole.get(permission.role_id) ?? []),
      permission,
    ]);
  }

  for (const userRole of userRoles) {
    assignedByRole.set(userRole.role_id, [
      ...(assignedByRole.get(userRole.role_id) ?? []),
      userRole.user_id,
    ]);
  }

  const roleRecords = roles.map((role) =>
    roleRowToRecord(role, permissionsByRole, assignedByRole.get(role.id) ?? []),
  );

  return { employees, roles: roleRecords };
}

function assertPersistableRole(roleId: string) {
  if (!roleId) {
    throw new Error("A writable roles table record is required.");
  }
}

export const employeesService = {
  async getEmployeesModuleData(): Promise<EmployeesModuleData> {
    const [profiles, roles, permissions, userRoles] = await Promise.all([
      fetchProfiles(),
      fetchRoles(),
      fetchPermissions(),
      fetchUserRoles(),
    ]);

    return buildModuleData(profiles, roles, permissions, userRoles);
  },

  async inviteMember(input: InviteMemberInput): Promise<void> {
    await inviteMemberRequest({
      fullName: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      jobRole: input.jobRole,
    });
  },

  async createRole(input: {
    name: string;
    description: string;
    permissions: PermissionMap;
  }): Promise<void> {
    const role = await insertRole({ name: input.name, description: input.description });
    await replaceRolePermissions(role.id, mapPermissionsForWrite(input.permissions));
  },

  async updateRole(input: RoleRecord): Promise<void> {
    assertPersistableRole(input.id);
    await updateRole({ id: input.id, name: input.name, description: input.description });
    await replaceRolePermissions(input.id, mapPermissionsForWrite(input.permissions));
  },

  async cloneRole(input: RoleRecord): Promise<void> {
    const role = await insertRole({
      name: `${input.name} (Copy)`,
      description: input.description,
    });
    await replaceRolePermissions(role.id, mapPermissionsForWrite(input.permissions));
  },

  async deleteEmptyRole(roleId: string): Promise<void> {
    assertPersistableRole(roleId);
    await replaceRolePermissions(roleId, []);
    await deleteRole(roleId);
  },

  async archiveRole(roleId: string, reassignments: Record<string, string>): Promise<void> {
    assertPersistableRole(roleId);
    for (const [userId, toRoleId] of Object.entries(reassignments)) {
      assertPersistableRole(toRoleId);
      await reassignUserRole({ userId, fromRoleId: roleId, toRoleId });
    }
    await replaceRolePermissions(roleId, []);
    await deleteRole(roleId);
  },
};
