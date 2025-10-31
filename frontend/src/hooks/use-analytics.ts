import { useQuery } from "@tanstack/react-query";

export interface KPIs {
  total: number;
  abertos: number;
  emAnalise: number;
  concluidos: number;
  risco: number;
  avgHoras: number;
  taxaResolucao: number;
}

export interface TopBairro {
  bairro: string;
  count: number;
  percentage: string;
}

export interface Analytics {
  topBairros: TopBairro[];
  porTipo: {
    poda: number;
    risco: number;
    queda: number;
  };
  porStatus: {
    aberto: number;
    em_analise: number;
    concluido: number;
  };
}

export interface SerieData {
  date: string;
  criados: number;
  concluidos: number;
  risco: number;
}

export interface DemandByType {
  name: string;
  value: number;
}

export interface EfficiencyByBairro {
  bairro: string;
  eficiencia: number;
}

export interface StatusPorTipo {
  tipo: string;
  aberto: number;
  concluido: number;
}

export interface ResolucaoHistogram {
  range: string;
  value: number;
}

export interface Charts {
  seriesChamadosPorDia: SerieData[];
  resolucaoHistogram: ResolucaoHistogram[];
  statusPorTipo: StatusPorTipo[];
  demandByType: DemandByType[];
  efficiencyByBairro: EfficiencyByBairro[];
}

export interface AnalyticsData {
  kpis: KPIs;
  analytics: Analytics;
  charts: Charts;
  metadata: {
    periodo: string;
    dataGeracao: string;
    totalIncidentes: number;
  };
}

export function useAnalytics(days: string = 'todos') {
  return useQuery({
    queryKey: ['analytics', days],
    queryFn: async (): Promise<AnalyticsData> => {
      const params = days !== 'todos' ? `?days=${days}` : '';
      const response = await fetch(`/api/analytics${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch analytics');
      }
      
      return data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchIntervalInBackground: true,
  });
}
