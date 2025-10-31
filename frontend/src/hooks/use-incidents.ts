import { useQuery } from "@tanstack/react-query";
import { Incident } from "@/types";

export function useIncidents() {
  return useQuery({
    queryKey: ['incidents'],
    queryFn: async (): Promise<Incident[]> => {
      const response = await fetch('/api/incidents');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch incidents');
      }
      return data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - incidents data stays fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
    refetchOnMount: false, // Don't refetch on component mount if data exists
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes in background
    refetchIntervalInBackground: true,
  });
}