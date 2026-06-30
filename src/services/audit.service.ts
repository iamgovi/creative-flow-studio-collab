import {
  fetchAuditLogs,
  fetchAuditUsersByIds,
  insertAuditLog,
  resolveCurrentAuditUserId,
  type AuditLogRow,
} from "@/repositories/audit.repository";
import type { Json } from "@/types/database";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  actionLabel: string;
  entityType: string;
  entityName: string;
  description: string;
  ipAddress: string | null;
}

export interface RecordAuditEventInput {
  action: string;
  target?: string | null;
  entityType?: string;
  entityName?: string;
  description?: string;
  details?: Record<string, Json | undefined>;
}

function isRecord(value: Json | null): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringDetail(details: Record<string, Json>, key: string): string | null {
  const value = details[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function labelize(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseTarget(target: string | null) {
  if (!target) return { entityType: "System", entityName: "System" };

  const separator = target.indexOf(":");
  if (separator === -1) return { entityType: "Record", entityName: target };

  return {
    entityType: labelize(target.slice(0, separator)),
    entityName: target.slice(separator + 1) || target,
  };
}

function normalizeAuditLog(row: AuditLogRow, usersById: Map<string, string>): AuditLogEntry {
  const details = isRecord(row.details) ? row.details : {};
  const target = parseTarget(row.target);
  const user = row.user_id ? usersById.get(row.user_id) ?? row.user_id : "System";
  const actionLabel = labelize(row.action);
  const entityType = stringDetail(details, "entity_type") ?? target.entityType;
  const entityName = stringDetail(details, "entity_name") ?? target.entityName;
  const description =
    stringDetail(details, "description") ?? `${user} performed ${actionLabel.toLowerCase()} on ${entityName}.`;

  return {
    id: row.id,
    timestamp: row.created_at,
    user,
    action: row.action,
    actionLabel,
    entityType,
    entityName,
    description,
    ipAddress: row.ip_address,
  };
}

export async function getAuditLogEntries(limit = 100): Promise<AuditLogEntry[]> {
  const rows = await fetchAuditLogs(limit);
  const users = await fetchAuditUsersByIds(
    rows.map((row) => row.user_id).filter((id): id is string => Boolean(id)),
  );
  const usersById = new Map(
    users.map((user) => [user.id, user.name ?? user.email ?? "Unknown user"]),
  );

  return rows.map((row) => normalizeAuditLog(row, usersById));
}

export async function getRecentSecurityEvents(limit = 5): Promise<AuditLogEntry[]> {
  const entries = await getAuditLogEntries(50);

  return entries
    .filter((entry) => ["USER_LOGIN", "ROLE_CHANGED"].includes(entry.action))
    .slice(0, limit);
}

export async function recordAuditEvent(input: RecordAuditEventInput): Promise<void> {
  const userId = await resolveCurrentAuditUserId();
  const details: Record<string, Json> = {};

  for (const [key, value] of Object.entries(input.details ?? {})) {
    if (value !== undefined) details[key] = value;
  }
  if (input.entityType) details.entity_type = input.entityType;
  if (input.entityName) details.entity_name = input.entityName;
  if (input.description) details.description = input.description;

  await insertAuditLog({
    user_id: userId,
    action: input.action,
    target: input.target ?? null,
    details,
  });
}

export async function recordAuditEventSafely(input: RecordAuditEventInput): Promise<void> {
  try {
    await recordAuditEvent(input);
  } catch (error) {
    console.warn("Audit logging failed.", error);
  }
}

export const auditService = {
  getAuditLogEntries,
  getRecentSecurityEvents,
  recordAuditEvent,
  recordAuditEventSafely,
};
