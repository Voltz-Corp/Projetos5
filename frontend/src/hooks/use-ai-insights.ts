import { useQuery } from "@tanstack/react-query";

interface AIInsight {
  id: string;
  type: 'warning' | 'alert' | 'info';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  bairro?: string;
  recommendations?: string[];
  confidence: number;
  timestamp: number;
}

const CACHE_KEY = 'recife-ai-insights-cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Helper function to get cached data
function getCachedData(): AIInsight[] {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return [];

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid (30 minutes)
    if (now - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return [];
    }

    return data;
  } catch (error) {
    console.warn('Error reading AI insights cache:', error);
    return [];
  }
}

// Helper function to set cached data
function setCachedData(data: AIInsight[]): void {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Error writing AI insights cache:', error);
  }
}

export function useAIInsights() {
  const cachedData = getCachedData();
  const hasValidCache = cachedData && cachedData.length > 0;

  return useQuery({
    queryKey: ['ai-insights'],
    queryFn: async (): Promise<AIInsight[]> => {
      const response = await fetch('/api/insights');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch insights');
      }

      // Cache the successful response
      setCachedData(result.data);
      return result.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh for 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache for 30 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes in background
    refetchIntervalInBackground: true,
    enabled: true, // Always enabled
    ...(hasValidCache && {
      initialData: cachedData,
      initialDataUpdatedAt: (() => {
        try {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            return timestamp;
          }
        } catch (error) {
          // Ignore errors
        }
        return 0;
      })(),
    }),
  });
}