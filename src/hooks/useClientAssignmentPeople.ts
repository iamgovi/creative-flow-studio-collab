import { useQuery } from "@tanstack/react-query";
import { employeesService } from "@/services/employees.service";

export function useClientAssignmentPeople() {
  return useQuery({
    queryKey: ["employees", "client-assignment-people"],
    queryFn: () => employeesService.getClientAssignmentPeople(),
  });
}
