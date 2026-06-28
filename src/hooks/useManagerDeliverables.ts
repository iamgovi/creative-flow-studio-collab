import { useQuery } from "@tanstack/react-query";
import { managerDeliverablesService } from "@/services/manager-deliverables.service";

export function useManagerDeliverables() {
  const query = useQuery({
    queryKey: ["manager", "deliverables"],
    queryFn: () => managerDeliverablesService.getManagerDeliverablesData(),
  });

  return {
    deliverables: query.data?.deliverables ?? [],
    clients: query.data?.clients ?? [],
    statuses: query.data?.statuses ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
  };
}
