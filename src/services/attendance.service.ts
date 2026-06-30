import {
  fetchLatestTodayAttendance,
  fetchRecentSecurityEvents,
  fetchOpenTodayAttendance,
  insertAttendance,
  updateAttendanceClockOut,
  type AttendanceRow,
} from "@/repositories/attendance.repository";

export interface AttendanceSummary {
  id: string;
  employeeId: string;
  clockIn: string;
  clockOut: string | null;
  createdAt: string;
  isWorking: boolean;
  workedMinutes: number | null;
}

function todayRange(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function minutesBetween(startIso: string, endIso: string) {
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(0, Math.floor(diff / 60000));
}

function mapAttendance(row: AttendanceRow | null): AttendanceSummary | null {
  if (!row) return null;

  return {
    id: row.id,
    employeeId: row.employee_id,
    clockIn: row.login_time,
    clockOut: row.logout_time,
    createdAt: row.created_at,
    isWorking: row.logout_time === null,
    workedMinutes: row.logout_time ? minutesBetween(row.login_time, row.logout_time) : null,
  };
}

export async function getTodayAttendance(employeeId: string): Promise<AttendanceSummary | null> {
  const { startIso, endIso } = todayRange();
  const row = await fetchLatestTodayAttendance(employeeId, startIso, endIso);

  return mapAttendance(row);
}

export async function ensureClockedInForToday(employeeId: string): Promise<AttendanceSummary> {
  const { startIso, endIso } = todayRange();
  const openAttendance = await fetchOpenTodayAttendance(employeeId, startIso, endIso);
  if (openAttendance) return mapAttendance(openAttendance)!;

  const row = await insertAttendance({
    employee_id: employeeId,
    login_time: new Date().toISOString(),
    logout_time: null,
  });

  return mapAttendance(row)!;
}

export async function ensureClockedInForTodaySafely(employeeId: string): Promise<void> {
  try {
    await ensureClockedInForToday(employeeId);
  } catch (error) {
    console.warn("Attendance clock-in failed.", error);
  }
}

export async function clockOutToday(employeeId: string): Promise<AttendanceSummary> {
  const { startIso, endIso } = todayRange();
  const openAttendance = await fetchOpenTodayAttendance(employeeId, startIso, endIso);

  if (!openAttendance) {
    const latestAttendance = await fetchLatestTodayAttendance(employeeId, startIso, endIso);
    const mapped = mapAttendance(latestAttendance);
    if (mapped) return mapped;

    throw new Error("No active attendance record found for today.");
  }

  const row = await updateAttendanceClockOut(openAttendance.id, new Date().toISOString());

  return mapAttendance(row)!;
}

export function calculateLiveWorkedMinutes(attendance: AttendanceSummary | null, now = new Date()) {
  if (!attendance) return 0;

  const end = attendance.clockOut ?? now.toISOString();
  return minutesBetween(attendance.clockIn, end);
}

export async function getRecentSecurityEvents(limit = 10) {
  try {
    return await fetchRecentSecurityEvents(limit);
  } catch (error) {
    console.error("Recent attendance security events failed.", error);
    return [];
  }
}

export const attendanceService = {
  getTodayAttendance,
  ensureClockedInForToday,
  ensureClockedInForTodaySafely,
  clockOutToday,
  calculateLiveWorkedMinutes,
  getRecentSecurityEvents,
};
