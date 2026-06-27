import { useQuery } from "@tanstack/react-query";
import { adminDashboardService } from "@/services/admin-dashboard.service";

export function useAdminDashboardKpis() {
  const employees = useQuery({
    queryKey: ["admin", "dashboard", "kpis", "employees"],
    queryFn: () => adminDashboardService.getEmployeeCount(),
  });
  const managers = useQuery({
    queryKey: ["admin", "dashboard", "kpis", "managers"],
    queryFn: () => adminDashboardService.getManagerCount(),
  });
  const clients = useQuery({
    queryKey: ["admin", "dashboard", "kpis", "clients"],
    queryFn: () => adminDashboardService.getClientCount(),
  });
  const activeDeliverables = useQuery({
    queryKey: ["admin", "dashboard", "kpis", "active-deliverables"],
    queryFn: () => adminDashboardService.getActiveDeliverableCount(),
  });
  const incomingProjects = useQuery({
    queryKey: ["admin", "dashboard", "kpis", "incoming-projects"],
    queryFn: () => adminDashboardService.getIncomingProjectCount(),
  });

  return {
    employees,
    managers,
    clients,
    activeDeliverables,
    incomingProjects,
  };
}

export function useAdminDashboardTeamMates() {
  return useQuery({
    queryKey: ["admin", "dashboard", "team-mates"],
    queryFn: () => adminDashboardService.getDashboardTeamMates(),
  });
}

export function useAdminDashboardClients() {
  return useQuery({
    queryKey: ["admin", "dashboard", "clients"],
    queryFn: () => adminDashboardService.getDashboardClients(),
  });
}
