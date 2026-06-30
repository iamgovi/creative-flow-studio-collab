import { getSupabaseClient } from "@/repositories/supabase/client";
import type { Database } from "@/types/database";

const ATTENDANCE_COLUMNS = "id,employee_id,login_time,logout_time,created_at";
const ATTENDANCE_SECURITY_COLUMNS = "id,employee_id,login_time,logout_time";
const USER_COLUMNS = "id,name,email";
const PROFILE_COLUMNS = "id,full_name,email";

export type AttendanceRow = Database["public"]["Tables"]["employee_attendance"]["Row"];
export type AttendanceInsert = Database["public"]["Tables"]["employee_attendance"]["Insert"];

export interface AttendanceSecurityEvent {
  id: string;
  employeeId: string;
  user: string;
  action: "EMPLOYEE_LOGIN" | "EMPLOYEE_LOGOUT";
  actionLabel: string;
  timestamp: string;
  ipAddress: null;
}

type AttendanceSecurityRow = Pick<
  AttendanceRow,
  "id" | "employee_id" | "login_time" | "logout_time"
>;

type AttendanceUserRow = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name" | "email">;
type AttendanceProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "email"
>;

function supabaseError(error: unknown, operation: string): Error {
  if (error instanceof Error) return error;

  const record = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
  const message =
    typeof record?.message === "string" && record.message.trim()
      ? record.message
      : "Supabase request failed.";
  const details =
    typeof record?.details === "string" && record.details.trim() ? ` Details: ${record.details}` : "";
  const hint = typeof record?.hint === "string" && record.hint.trim() ? ` Hint: ${record.hint}` : "";
  const code = typeof record?.code === "string" && record.code.trim() ? ` (${record.code})` : "";

  return new Error(`${operation} failed${code}: ${message}${details}${hint}`);
}

export async function fetchLatestTodayAttendance(
  employeeId: string,
  dayStartIso: string,
  dayEndIso: string,
): Promise<AttendanceRow | null> {
  const { data, error } = await getSupabaseClient()
    .from("employee_attendance")
    .select(ATTENDANCE_COLUMNS)
    .eq("employee_id", employeeId)
    .gte("login_time", dayStartIso)
    .lt("login_time", dayEndIso)
    .order("login_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw supabaseError(error, "Fetch today's attendance");

  return data;
}

export async function fetchOpenTodayAttendance(
  employeeId: string,
  dayStartIso: string,
  dayEndIso: string,
): Promise<AttendanceRow | null> {
  const { data, error } = await getSupabaseClient()
    .from("employee_attendance")
    .select(ATTENDANCE_COLUMNS)
    .eq("employee_id", employeeId)
    .gte("login_time", dayStartIso)
    .lt("login_time", dayEndIso)
    .is("logout_time", null)
    .order("login_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw supabaseError(error, "Fetch open attendance");

  return data;
}

export async function insertAttendance(input: AttendanceInsert): Promise<AttendanceRow> {
  const { data, error } = await getSupabaseClient()
    .from("employee_attendance")
    .insert(input)
    .select(ATTENDANCE_COLUMNS)
    .single();

  if (error) throw supabaseError(error, "Create attendance");

  return data;
}

export async function updateAttendanceClockOut(
  attendanceId: string,
  logoutTimeIso: string,
): Promise<AttendanceRow> {
  const { data, error } = await getSupabaseClient()
    .from("employee_attendance")
    .update({ logout_time: logoutTimeIso })
    .eq("id", attendanceId)
    .select(ATTENDANCE_COLUMNS)
    .single();

  if (error) throw supabaseError(error, "Clock out attendance");

  return data;
}

async function fetchAttendanceUsersByIds(ids: string[]): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return new Map();

  const [usersResult, profilesResult] = await Promise.all([
    getSupabaseClient().from("users").select(USER_COLUMNS).in("id", uniqueIds),
    getSupabaseClient().from("profiles").select(PROFILE_COLUMNS).in("id", uniqueIds),
  ]);

  if (usersResult.error) throw supabaseError(usersResult.error, "Fetch attendance users");
  if (profilesResult.error) throw supabaseError(profilesResult.error, "Fetch attendance profiles");

  const names = new Map<string, string>();

  for (const user of (usersResult.data ?? []) as AttendanceUserRow[]) {
    names.set(user.id, user.name ?? user.email ?? "Unknown employee");
  }

  for (const profile of (profilesResult.data ?? []) as AttendanceProfileRow[]) {
    if (!names.has(profile.id)) {
      names.set(profile.id, profile.full_name ?? profile.email ?? "Unknown employee");
    }
  }

  return names;
}

function attendanceRowToEvents(
  row: AttendanceSecurityRow,
  employeeNamesById: Map<string, string>,
): AttendanceSecurityEvent[] {
  const employeeName = employeeNamesById.get(row.employee_id) ?? "Unknown employee";
  const events: AttendanceSecurityEvent[] = [];

  if (row.login_time) {
    events.push({
      id: `${row.id}:login`,
      employeeId: row.employee_id,
      user: employeeName,
      action: "EMPLOYEE_LOGIN",
      actionLabel: "logged in",
      timestamp: row.login_time,
      ipAddress: null,
    });
  }

  if (row.logout_time) {
    events.push({
      id: `${row.id}:logout`,
      employeeId: row.employee_id,
      user: employeeName,
      action: "EMPLOYEE_LOGOUT",
      actionLabel: "logged out",
      timestamp: row.logout_time,
      ipAddress: null,
    });
  }

  return events;
}

export async function fetchRecentSecurityEvents(limit = 10): Promise<AttendanceSecurityEvent[]> {
  const { data, error } = await getSupabaseClient()
    .from("employee_attendance")
    .select(ATTENDANCE_SECURITY_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(Math.max(limit, 20));

  if (error) throw supabaseError(error, "Fetch recent attendance events");

  const rows = (data ?? []) as AttendanceSecurityRow[];
  const employeeNamesById = await fetchAttendanceUsersByIds(rows.map((row) => row.employee_id));

  return rows
    .flatMap((row) => attendanceRowToEvents(row, employeeNamesById))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export const attendanceRepository = {
  fetchLatestTodayAttendance,
  fetchOpenTodayAttendance,
  insertAttendance,
  updateAttendanceClockOut,
  fetchRecentSecurityEvents,
};
