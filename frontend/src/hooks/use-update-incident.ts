import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Incident, IncidentStatus } from "@/types";

interface UpdateIncidentParams {
  id: string;
  status: IncidentStatus;
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: UpdateIncidentParams): Promise<Incident> => {
      const response = await fetch(`/api/incidents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update incident');
      }

      return data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch incidents query
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}
