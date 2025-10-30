import { useMemo } from "react";
import KPIs from "@/components/KPIs";
import MapPanel from "@/components/MapPanel";
import ChartsPanel from "@/components/ChartsPanel";
import IAAlerts from "@/components/IAAlerts";
import AdditionalChartsPanel from "@/components/AdditionalChartsPanel";
import { demandByType, efficiencyByBairro, getIncidents, kpis, recentRiskAlerts, seriesChamadosPorDia, resolucaoHistogram, statusPorTipo } from "@/lib/data";

export default function Index() {
  const incidents = useMemo(() => getIncidents(), []);
  const k = useMemo(() => kpis(incidents), [incidents]);
  const demand = useMemo(() => demandByType(incidents), [incidents]);
  const efficiency = useMemo(() => efficiencyByBairro(incidents), [incidents]);
  const alerts = useMemo(() => recentRiskAlerts(incidents), [incidents]);
  const series = useMemo(() => seriesChamadosPorDia(incidents, 14), [incidents]);
  const sla = useMemo(() => resolucaoHistogram(incidents), [incidents]);
  const statusTipo = useMemo(() => statusPorTipo(incidents), [incidents]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-emerald-50/40 dark:to-emerald-950/10">
      <div className="container py-8 space-y-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Painel de Inteligência · Arborização Urbana</h1>
          <p className="text-muted-foreground max-w-3xl">
            Prefeitura do Recife: gestão proativa com mapa geoespacial, indicadores em tempo real e alertas preditivos para priorizar onde agir primeiro.
          </p>
        </header>

        <KPIs abertos={k.abertos} risco={k.risco} avgHoras={k.avgHoras} />

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
          <div className="xl:col-span-2">
            <MapPanel />
          </div>
          <div className="xl:col-span-1">
            <IAAlerts alerts={alerts} />
          </div>
        </section>

        <ChartsPanel demand={demand} efficiency={efficiency} />

        <AdditionalChartsPanel series={series} sla={sla} statusTipo={statusTipo} />
      </div>
    </main>
  );
}
