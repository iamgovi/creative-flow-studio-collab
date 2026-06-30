import { useQuery } from "@tanstack/react-query";
import { auditService } from "@/services/audit.service";
import { attendanceService } from "@/services/attendance.service";

export function useAuditLogs() {
  return useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => auditService.getAuditLogEntries(),
  });
}

export function useRecentSecurityEvents() {
  return useQuery({
    queryKey: ["admin", "attendance", "recent-security-events"],
    queryFn: () => attendanceService.getRecentSecurityEvents(),
  });
}
