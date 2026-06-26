import type { PermissionMap } from "@/data/permissions";

export const JOB_ROLES = [
  "Production Head",
  "Senior Graphic Designer",
  "Video Producer",
  "Graphic Designer",
  "Content Writer",
] as const;

export type JobRole = (typeof JOB_ROLES)[number];
export type AuthAccessLevel = "admin" | "manager" | "employee";
export type RoleLevel =
  | JobRole
  | "Executive"
  | "Manager-Level"
  | "Team Lead-Level"
  | "Standard"
  | "Read-Only";
export type RoleType = "system" | "custom";

export interface InviteMemberInput {
  fullName: string;
  email: string;
  password: string;
  jobRole: JobRole;
}

export interface RoleEmployee {
  id: string;
  name: string;
  email: string;
  jobRole: string;
  department: string;
  avatar: string;
}

export interface RoleRecord {
  id: string;
  name: string;
  level: RoleLevel;
  type: RoleType;
  description: string;
  permissions: PermissionMap;
  createdAt: string;
  assignedIds: string[];
  archived?: boolean;
  clonedFrom?: string;
}
