import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceService } from "@/services/attendance.service";

export function useTodayAttendance(employeeId: string | null | undefined) {
  return useQuery({
    queryKey: ["employee", "attendance", "today", employeeId],
    queryFn: () => attendanceService.getTodayAttendance(employeeId!),
    enabled: Boolean(employeeId),
  });
}

export function useClockOutAttendance(employeeId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => attendanceService.clockOutToday(employeeId!),
    onSuccess: (attendance) => {
      queryClient.setQueryData(["employee", "attendance", "today", employeeId], attendance);
      queryClient.invalidateQueries({ queryKey: ["employee", "attendance", "today", employeeId] });
    },
  });
}
