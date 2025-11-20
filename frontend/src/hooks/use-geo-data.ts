import { useQuery } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Types
export interface TreePoint {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    nome_popul: string;
    nome_sp: string;
    altura: number;
    dap: number;
    copa: number;
    porte_esp: string;
    bairro: string;
    bairro_nome: string;
    rpa: string;
  };
}

export interface TreePointsResponse {
  type: "FeatureCollection";
  features: TreePoint[];
  metadata: {
    total: number;
    limit: number;
    offset: number;
    returned: number;
  };
}

export interface BairroStats {
  bairro: string;
  sigla: string;
  rpa: string;
  quantidade: number;
  densidade: number;
  mediaAltura: number;
  mediaDap: number;
  mediaCopa: number;
  portes: Record<string, number>;
  topEspecies: Array<{ nome: string; quantidade: number }>;
}

export interface TreeStats {
  totalArvores: number;
  distribuicao: {
    porPorte: Record<string, number>;
    porRpa: Record<string, number>;
    porTipologia: Record<string, number>;
  };
  topEspecies: Array<{ nome: string; quantidade: number }>;
  totalEspecies: number;
  caracteristicas: {
    altura: { media: number; min: number; max: number; mediana: number };
    dap: { media: number; min: number; max: number; mediana: number };
    copa: { media: number; min: number; max: number; mediana: number };
  };
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
}

// Hooks
export function useTreePoints(params?: {
  limit?: number;
  offset?: number;
  bairro?: string;
}) {
  return useQuery({
    queryKey: ["tree-points", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.offset) searchParams.set("offset", params.offset.toString());
      if (params?.bairro) searchParams.set("bairro", params.bairro);

      const response = await fetch(
        `${API_URL}/api/geo/trees/points?${searchParams}`,
      );
      if (!response.ok) throw new Error("Failed to fetch tree points");
      const data = await response.json();
      return data.data as TreePointsResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBairros() {
  return useQuery({
    queryKey: ["bairros"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/geo/bairros`);
      if (!response.ok) throw new Error("Failed to fetch bairros");
      const data = await response.json();
      return data.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useBairroStats() {
  return useQuery({
    queryKey: ["bairro-stats"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/geo/trees/by-bairro`);
      if (!response.ok) throw new Error("Failed to fetch bairro stats");
      const data = await response.json();
      return {
        data: data.data as BairroStats[],
        metadata: data.metadata,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTreeStats() {
  return useQuery({
    queryKey: ["tree-stats"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/geo/trees/stats`);
      if (!response.ok) throw new Error("Failed to fetch tree stats");
      const data = await response.json();
      return data.data as TreeStats;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useHeatmapData(sample: number = 10000) {
  return useQuery({
    queryKey: ["heatmap-data", sample],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/api/geo/trees/heatmap?sample=${sample}`,
      );
      if (!response.ok) throw new Error("Failed to fetch heatmap data");
      const data = await response.json();
      return {
        data: data.data as HeatmapPoint[],
        metadata: data.metadata,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
