export type IncidentType = "poda" | "risco" | "queda";
export type IncidentStatus = "aberto" | "concluido" | "em_analise";

export interface Incident {
  id: string;
  type: IncidentType;
  status: IncidentStatus;
  bairro: string;
  lat: number;
  lng: number;
  createdAt: number; // ms
  resolvedAt?: number; // ms when concluded
}

// Approx Recife bounding box
const LAT_MIN = -8.20;
const LAT_MAX = -7.90;
const LNG_MIN = -35.05;
const LNG_MAX = -34.80;

const BAIRROS = [
  "Boa Viagem",
  "Casa Forte",
  "Espinheiro",
  "Graças",
  "Santo Amaro",
  "Tamarineira",
  "Casa Amarela",
  "Várzea",
  "Imbiribeira",
  "Pina",
  "Afogados",
  "Madalena",
  "Derby",
  "Hip��dromo",
  "Aflitos",
];

function seededRand(seed: number) {
  // simple LCG for deterministic data
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) % 0xffffffff;
    return s / 0xffffffff;
  };
}

export function generateIncidents(count = 350, seed = 42): Incident[] {
  const rnd = seededRand(seed);
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  const incidents: Incident[] = [];
  for (let i = 0; i < count; i++) {
    const lat = LAT_MIN + (LAT_MAX - LAT_MIN) * rnd();
    const lng = LNG_MIN + (LNG_MAX - LNG_MIN) * rnd();
    const bairro = BAIRROS[Math.floor(rnd() * BAIRROS.length)];
    const typeRand = rnd();
    const type: IncidentType =
      typeRand < 0.5 ? "poda" : typeRand < 0.8 ? "risco" : "queda";
    const createdAt = now - Math.floor(rnd() * weekMs * 2); // last 14 days

    // 40% open, 35% in analysis, 25% closed with resolution 1-72h
    const statusRand = rnd();
    let status: IncidentStatus;
    let resolvedAt: number | undefined;
    if (statusRand < 0.4) {
      status = "aberto";
      resolvedAt = undefined;
    } else if (statusRand < 0.75) {
      status = "em_analise";
      resolvedAt = undefined;
    } else {
      status = "concluido";
      resolvedAt = createdAt + Math.floor((1 + rnd() * 72) * 60 * 60 * 1000);
    }

    incidents.push({
      id: `${i}`,
      type,
      status,
      bairro,
      lat,
      lng,
      createdAt,
      resolvedAt,
    });
  }
  return incidents;
}

export function kpis(incidents: Incident[]) {
  const abertos = incidents.filter((i) => i.status === "aberto").length;
  const risco = incidents.filter((i) => i.type === "risco").length;
  const resolved = incidents.filter((i) => i.status === "concluido");
  const avgMs =
    resolved.reduce((acc, i) => acc + ((i.resolvedAt ?? i.createdAt) - i.createdAt), 0) /
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
  const last48 = incidents.filter((i) => now - i.createdAt < 48 * 60 * 60 * 1000);
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
    const k = new Date(new Date(i.createdAt).toISOString().slice(0, 10)).toISOString().slice(0, 10);
    if (buckets[k]) {
      buckets[k].criados += 1;
      if (i.type === "risco") buckets[k].risco += 1;
    }
    if (i.status === "concluido" && i.resolvedAt) {
      const rk = new Date(new Date(i.resolvedAt).toISOString().slice(0, 10)).toISOString().slice(0, 10);
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
      const h = (i.resolvedAt! - i.createdAt) / (60 * 60 * 1000);
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
