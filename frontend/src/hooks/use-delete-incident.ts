import { useMutation, useQueryClient } from "@tanstack/react-query";

interface DeleteIncidentParams {
  id: string;
}

export function useDeleteIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: DeleteIncidentParams): Promise<void> => {
      const response = await fetch(`/api/incidents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete incident');
      }
    },
    onSuccess: () => {
      // Invalidate and refetch incidents query
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}
