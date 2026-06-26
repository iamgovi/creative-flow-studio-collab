import { buildPerms, type PermissionMap } from "./permissions";

export type RoleLevel = "Executive" | "Manager-Level" | "Team Lead-Level" | "Standard" | "Read-Only";
export type RoleType = "system" | "custom";

export interface RoleEmployee {
  id: string;
  name: string;
  email: string;
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
  createdAt: string;       // ISO
  assignedIds: string[];   // employee ids
  archived?: boolean;
  clonedFrom?: string;
}

export const EMPLOYEES: RoleEmployee[] = Array.from({ length: 20 }, (_, i) => {
  const first = ["Aria","Noah","Maya","Jin","Olivia","Kai","Zara","Theo","Ines","Ravi","Sofia","Leo","Mira","Eli","Yuki","Diego","Nora","Sam","Liv","Tomas"][i];
  const last = ["Patel","Chen","Romero","Okafor","Lindqvist","Müller","Hassan","Park","Silva","Nguyen","Tanaka","Khan","Bauer","Costa","Reyes","Holm","Adler","Vance","Kim","Ortiz"][i];
  const dept = ["Marketing","Design","Operations","Analytics","Engineering"][i % 5];
  return {
    id: `e${i + 1}`,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@cntrlm.co`,
    department: dept,
    avatar: `https://i.pravatar.cc/150?img=${i + 1}`,
  };
});

const days = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

const headPerms = buildPerms({
  campaigns: ["create","read","update","delete","approve"],
  analytics: ["read","export"],
  customers: ["create","read","update"],
  content: ["create","read","update","delete","approve"],
  employees: ["read"],
});

const seniorPerms = buildPerms({
  content: ["create","read","update","delete","approve"],
  campaigns: ["read","update","approve"],
  analytics: ["read"],
  employees: ["read"],
});

const contributorPerms = buildPerms({
  content: ["create","read","update"],
  campaigns: ["read"],
  analytics: ["read"],
});

const SYSTEM_ROLE_SEED: Omit<RoleRecord, "id" | "type" | "assignedIds" | "createdAt">[] = [
  { name: "Production Head",         level: "Manager-Level",   description: "Heads the production team — owns campaigns, content, and approvals across deliverables.", permissions: headPerms },
  { name: "Senior Graphic Designer", level: "Team Lead-Level", description: "Senior designer with content delete rights and campaign review access.", permissions: seniorPerms },
  { name: "Video Producer",          level: "Standard",        description: "Produces video deliverables — creates and updates video content and campaigns.", permissions: contributorPerms },
  { name: "Graphic Designer",        level: "Standard",        description: "Designs static deliverables — creates and updates graphic content.", permissions: contributorPerms },
  { name: "Content Writer",          level: "Standard",        description: "Writes copy and content for campaigns and deliverables.", permissions: contributorPerms },
];

export const SYSTEM_ROLES: RoleRecord[] = SYSTEM_ROLE_SEED.map((r, i) => ({
  ...r,
  id: `sys-${r.name.toLowerCase().replace(/\s+/g, "-")}`,
  type: "system",
  createdAt: days(365 - i * 12),
  assignedIds: [],
}));

// distribute employees among system roles loosely
SYSTEM_ROLES.find((r) => r.name === "Production Head")!.assignedIds = ["e1"];
SYSTEM_ROLES.find((r) => r.name === "Senior Graphic Designer")!.assignedIds = ["e2", "e3"];
SYSTEM_ROLES.find((r) => r.name === "Video Producer")!.assignedIds = ["e4", "e5"];
SYSTEM_ROLES.find((r) => r.name === "Graphic Designer")!.assignedIds = ["e6", "e7"];
SYSTEM_ROLES.find((r) => r.name === "Content Writer")!.assignedIds = ["e8", "e9"];

export const CUSTOM_ROLES_SEED: RoleRecord[] = [];

export const INITIAL_ROLES: RoleRecord[] = [...SYSTEM_ROLES, ...CUSTOM_ROLES_SEED];
