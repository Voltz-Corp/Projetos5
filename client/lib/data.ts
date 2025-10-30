import { mockIncidents } from "./mock-incidents";

export type IncidentType = "poda" | "risco" | "queda";
export type IncidentStatus = "aberto" | "concluido" | "em_analise";

export interface Incident {
  id: string;
  type: IncidentType;
  status: IncidentStatus;
  bairro: string;
  lat: number;
  lng: number;
  createdAt: number | string;
  resolvedAt?: number | string;
  image: string;
}

export function kpis(incidents: Incident[]) {
  const abertos = incidents.filter((i) => i.status === "aberto").length;
  const risco = incidents.filter((i) => i.type === "risco").length;
  const resolved = incidents.filter((i) => i.status === "concluido");
  const avgMs =
    resolved.reduce((acc, i) => acc + (new Date(i.resolvedAt as any).getTime() - new Date(i.createdAt as any).getTime()), 0) /
      Math.max(1, resolved.length);
  return {
    abertos,
    risco,
    avgHoras: Math.round((avgMs / (60 * 60 * 1000)) * 10) / 10,
  };
}

export function demandByType(incidents: Incident[]) {
  const map: Record<IncidentType, number> = { poda: 0, risco: 0, queda: 0 };
  incidents.forEach((i) => (map[i.type] += 1));
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

export function efficiencyByBairro(incidents: Incident[]) {
  // % resolved per bairro
  const by: Record<string, { total: number; resolvidos: number }> = {};
  incidents.forEach((i) => {
    by[i.bairro] ??= { total: 0, resolvidos: 0 };
    by[i.bairro].total += 1;
    if (i.status === "concluido") by[i.bairro].resolvidos += 1;
  });
  return Object.entries(by)
    .map(([bairro, x]) => ({ bairro, eficiencia: Math.round((x.resolvidos / x.total) * 100) }))
    .sort((a, b) => b.eficiencia - a.eficiencia)
    .slice(0, 8);
}

export function recentRiskAlerts(incidents: Incident[]) {
  // Simple heuristic: find bairro with high share of risk in last 48h
  const now = Date.now();
  const last48 = incidents.filter((i) => now - new Date(i.createdAt as any).getTime() < 48 * 60 * 60 * 1000);
  const by: Record<string, { risco: number; total: number }> = {};
  last48.forEach((i) => {
    by[i.bairro] ??= { risco: 0, total: 0 };
    by[i.bairro].total += 1;
    if (i.type === "risco") by[i.bairro].risco += 1;
  });
  const items = Object.entries(by)
    .map(([bairro, v]) => ({ bairro, pct: v.total ? v.risco / v.total : 0 }))
    .filter((x) => x.pct > 0.5)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  return items.map((x) =>
    `Aumento de risco no bairro ${x.bairro} devido à previsão de ventos e histórico recente de chamados.`,
  );
}

export function seriesChamadosPorDia(incidents: Incident[], days = 14) {
  const dayMs = 24 * 60 * 60 * 1000;
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end.getTime() - (days - 1) * dayMs);
  const buckets: Record<string, { criados: number; concluidos: number; risco: number }> = {};
  for (let d = 0; d < days; d++) {
    const key = new Date(start.getTime() + d * dayMs).toISOString().slice(0, 10);
    buckets[key] = { criados: 0, concluidos: 0, risco: 0 };
  }
  incidents.forEach((i) => {
    const createdAtDate = new Date(i.createdAt as any);
    const k = `${createdAtDate.getFullYear()}-${String(createdAtDate.getMonth() + 1).padStart(2, '0')}-${String(createdAtDate.getDate()).padStart(2, '0')}`;
    if (buckets[k]) {
      buckets[k].criados += 1;
      if (i.type === "risco") buckets[k].risco += 1;
    }
    if (i.status === "concluido" && i.resolvedAt) {
      const resolvedAtDate = new Date(i.resolvedAt as any);
      const rk = `${resolvedAtDate.getFullYear()}-${String(resolvedAtDate.getMonth() + 1).padStart(2, '0')}-${String(resolvedAtDate.getDate()).padStart(2, '0')}`;
      if (buckets[rk]) buckets[rk].concluidos += 1;
    }
  });
  return Object.entries(buckets).map(([date, v]) => ({ date, ...v }));
}

export function resolucaoHistogram(incidents: Incident[]) {
  // bins in hours: 0-6, 6-12, 12-24, 24-48, 48-72, 72+
  const bins = [6, 12, 24, 48, 72];
  const map: Record<string, number> = { "0-6": 0, "6-12": 0, "12-24": 0, "24-48": 0, "48-72": 0, "72+": 0 };
  incidents
    .filter((i) => i.status === "concluido" && i.resolvedAt)
    .forEach((i) => {
      const h = (new Date(i.resolvedAt as any).getTime() - new Date(i.createdAt as any).getTime()) / (60 * 60 * 1000);
      if (h <= bins[0]) map["0-6"]++;
      else if (h <= bins[1]) map["6-12"]++;
      else if (h <= bins[2]) map["12-24"]++;
      else if (h <= bins[3]) map["24-48"]++;
      else if (h <= bins[4]) map["48-72"]++;
      else map["72+"]++;
    });
  return Object.entries(map).map(([range, value]) => ({ range, value }));
}

export function statusPorTipo(incidents: Incident[]) {
  const types: IncidentType[] = ["poda", "risco", "queda"];
  return types.map((t) => {
    const ofType = incidents.filter((i) => i.type === t);
    const aberto = ofType.filter((i) => i.status === "aberto").length;
    const concluido = ofType.filter((i) => i.status === "concluido").length;
    return { tipo: t, aberto, concluido };
  });
}

/**
 * Synchronous accessor kept for backward compatibility (used by charts / KPIs).
 */
export function getIncidents(): Incident[] {
  return mockIncidents;
}

/**
 * Async fetch-like accessor to return the mocked incidents.
 * MapPanel and other consumers that simulate network loading should use this.
 */
export async function fetchIncidents(): Promise<Incident[]> {
  // Simulate an async fetch — keep very small delay so UI shows loading when desired.
  return new Promise((resolve) => setTimeout(() => resolve(mockIncidents), 100));
}
