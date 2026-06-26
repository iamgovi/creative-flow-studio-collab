import { create } from "zustand";
import { employeesService } from "@/services/employees.service";
import { applyDependencies, type PermissionMap } from "@/data/permissions";
import type { InviteMemberInput, RoleEmployee, RoleRecord } from "@/types/employees";

interface RolesState {
  roles: RoleRecord[];
  employees: RoleEmployee[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  loadRoles: () => Promise<void>;
  inviteMember: (input: InviteMemberInput) => Promise<void>;
  upsertRole: (r: RoleRecord) => Promise<void>;
  createRole: (
    r: Omit<RoleRecord, "id" | "createdAt" | "type" | "assignedIds"> & {
      permissions: PermissionMap;
    },
  ) => Promise<void>;
  cloneRole: (sourceId: string) => Promise<RoleRecord | null>;
  archiveRole: (id: string, reassignments: Record<string, string>) => Promise<void>;
  deleteEmpty: (id: string) => Promise<void>;
}

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Unable to load roles.";
}

export const useRoles = create<RolesState>((set, get) => ({
  roles: [],
  employees: [],
  loading: false,
  error: null,
  loaded: false,

  loadRoles: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const data = await employeesService.getEmployeesModuleData();
      set({
        roles: data.roles,
        employees: data.employees,
        loading: false,
        loaded: true,
        error: null,
      });
    } catch (error) {
      set({ loading: false, loaded: true, error: messageFrom(error) });
    }
  },

  inviteMember: async (input) => {
    await employeesService.inviteMember(input);
    await get().loadRoles();
  },

  upsertRole: async (role) => {
    const next = { ...role, permissions: applyDependencies(role.permissions) };
    await employeesService.updateRole(next);
    await get().loadRoles();
  },

  createRole: async (role) => {
    await employeesService.createRole({
      name: role.name,
      description: role.description,
      permissions: applyDependencies(role.permissions),
    });
    await get().loadRoles();
  },

  cloneRole: async (sourceId) => {
    const src = get().roles.find((role) => role.id === sourceId);
    if (!src) return null;
    await employeesService.cloneRole(src);
    await get().loadRoles();
    return get().roles.find((role) => role.name === `${src.name} (Copy)`) ?? null;
  },

  archiveRole: async (id, reassignments) => {
    await employeesService.archiveRole(id, reassignments);
    await get().loadRoles();
  },

  deleteEmpty: async (id) => {
    await employeesService.deleteEmptyRole(id);
    await get().loadRoles();
  },
}));
