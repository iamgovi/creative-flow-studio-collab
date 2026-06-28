import { useQuery } from "@tanstack/react-query";
import { managerDashboardService } from "@/services/manager-dashboard.service";

export function useManagerDashboard() {
  return useQuery({
    queryKey: ["manager", "dashboard"],
    queryFn: () => managerDashboardService.getManagerDashboardData(),
  });
}
