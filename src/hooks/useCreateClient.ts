import { useMutation } from "@tanstack/react-query";
import { clientService, type CreateClientInput } from "@/services/client.service";

export function useCreateClient() {
  return useMutation({
    mutationFn: (input: CreateClientInput) => clientService.createClient(input),
  });
}
