// Master permissions catalog. Drives the matrix and the permission summary.

export type ActionKey = "create" | "read" | "update" | "delete" | "approve" | "export";

export const ACTIONS: ActionKey[] = ["create", "read", "update", "delete", "approve", "export"];

export const ACTION_LABEL: Record<ActionKey, string> = {
  create: "Create",
  read: "Read",
  update: "Update",
  delete: "Delete",
  approve: "Approve",
  export: "Export",
};

export type ModuleKey =
  | "campaigns"
  | "analytics"
  | "customers"
  | "content"
  | "settings"
  | "billing"
  | "employees"
  | "integrations"
  | "audit";

export interface ModuleDef {
  key: ModuleKey;
  name: string;
  icon:
    | "Megaphone"
    | "BarChart3"
    | "Users"
    | "FolderOpen"
    | "Settings"
    | "CreditCard"
    | "UserCog"
    | "Plug"
    | "ScrollText";
  supports: ActionKey[];
  verbModule: string; // for plain-english summary
}

export const MODULES: ModuleDef[] = [
  { key: "campaigns",    name: "Campaigns",              icon: "Megaphone",   supports: ["create","read","update","delete","approve"], verbModule: "campaigns" },
  { key: "analytics",    name: "Analytics & Reports",    icon: "BarChart3",   supports: ["create","read","update","delete","export"],  verbModule: "analytics and reports" },
  { key: "customers",    name: "Customers / Contacts",   icon: "Users",       supports: ["create","read","update","delete","export"],  verbModule: "customers" },
  { key: "content",      name: "Content Library",        icon: "FolderOpen",  supports: ["create","read","update","delete"],           verbModule: "the content library" },
  { key: "settings",     name: "Settings",               icon: "Settings",    supports: ["read","update"],                              verbModule: "settings" },
  { key: "billing",      name: "Billing & Subscriptions",icon: "CreditCard",  supports: ["create","read","update","delete","approve"], verbModule: "billing & subscriptions" },
  { key: "employees",    name: "Employees & Roles",      icon: "UserCog",     supports: ["create","read","update","delete"],           verbModule: "employees & roles" },
  { key: "integrations", name: "Integrations",           icon: "Plug",        supports: ["create","read","update","delete"],           verbModule: "integrations" },
  { key: "audit",        name: "Audit Logs",             icon: "ScrollText",  supports: ["read","export"],                              verbModule: "audit logs" },
];

export type PermissionMap = Partial<Record<ModuleKey, Partial<Record<ActionKey, boolean>>>>;

export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  "campaigns.create": "Create new campaigns and save them as drafts.",
  "campaigns.read": "View existing campaigns and their details.",
  "campaigns.update": "Edit campaign content, schedule, and audience.",
  "campaigns.delete": "Permanently remove campaigns from the system. This cannot be undone.",
  "campaigns.approve": "Approve campaigns for publishing and sending.",
  "analytics.create": "Create custom reports and dashboards.",
  "analytics.read": "View dashboards, reports, and insights.",
  "analytics.update": "Edit existing reports and dashboards.",
  "analytics.delete": "Delete reports and dashboards.",
  "analytics.export": "Export reports as CSV, PDF, or Excel.",
  "customers.create": "Add new customers and contacts.",
  "customers.read": "View customer profiles and contact details.",
  "customers.update": "Edit customer information and segmentation.",
  "customers.delete": "Remove customers from the system.",
  "customers.export": "Export customer lists and contact data.",
  "content.create": "Upload and create new content assets.",
  "content.read": "Browse and download content from the library.",
  "content.update": "Edit content metadata and replace assets.",
  "content.delete": "Permanently delete content from the library.",
  "settings.read": "View organization settings.",
  "settings.update": "Change organization settings.",
  "billing.create": "Add new billing methods or plans.",
  "billing.read": "View invoices, plan details, and payment history.",
  "billing.update": "Update payment methods and billing info.",
  "billing.delete": "Remove billing methods.",
  "billing.approve": "Approve plan upgrades, downgrades, and payment method changes.",
  "employees.create": "Invite new employees to the organization.",
  "employees.read": "View employee directory and profiles.",
  "employees.update": "Edit employee profiles, contact info, and role assignments.",
  "employees.delete": "Remove employees from the organization.",
  "integrations.create": "Connect new third-party integrations.",
  "integrations.read": "View configured integrations.",
  "integrations.update": "Reconfigure existing integrations.",
  "integrations.delete": "Disconnect integrations.",
  "audit.read": "View the audit log.",
  "audit.export": "Export the audit log.",
};

// Build a permission map from a compact spec.
export function buildPerms(spec: Partial<Record<ModuleKey, ActionKey[]>>): PermissionMap {
  const out: PermissionMap = {};
  for (const [m, actions] of Object.entries(spec) as [ModuleKey, ActionKey[]][]) {
    out[m] = {};
    for (const a of actions) out[m]![a] = true;
  }
  return out;
}

export function allPermissions(): PermissionMap {
  const out: PermissionMap = {};
  for (const m of MODULES) {
    out[m.key] = {};
    for (const a of m.supports) out[m.key]![a] = true;
  }
  return out;
}

export function countPermissions(perms: PermissionMap) {
  let granted = 0;
  let total = 0;
  for (const m of MODULES) {
    for (const a of m.supports) {
      total += 1;
      if (perms[m.key]?.[a]) granted += 1;
    }
  }
  return { granted, total };
}

// Returns the locked-on actions implied by other selected actions.
// rules: update => read; delete => read+update; approve => read; export => read
export function lockedFor(modulePerms: Partial<Record<ActionKey, boolean>> | undefined): Set<ActionKey> {
  const locked = new Set<ActionKey>();
  if (!modulePerms) return locked;
  if (modulePerms.update || modulePerms.delete || modulePerms.approve || modulePerms.export) locked.add("read");
  if (modulePerms.delete) locked.add("update");
  return locked;
}

export function applyDependencies(perms: PermissionMap): PermissionMap {
  const next: PermissionMap = {};
  for (const m of MODULES) {
    const cur = { ...(perms[m.key] || {}) };
    if (cur.update || cur.delete || cur.approve || cur.export) cur.read = true;
    if (cur.delete) cur.update = true;
    next[m.key] = cur;
  }
  return next;
}
