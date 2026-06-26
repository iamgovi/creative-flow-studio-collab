import { useQuery } from "@tanstack/react-query";
import { clientService } from "@/services/client.service";

export function useClientsPageData() {
  return useQuery({
    queryKey: ["admin", "clients"],
    queryFn: () => clientService.getClientsPageData(),
  });
}
