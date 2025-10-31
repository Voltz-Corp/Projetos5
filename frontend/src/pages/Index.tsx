import KPIs from "@/components/KPIs";
import MapPanel from "@/components/MapPanel";
import ChartsPanel from "@/components/ChartsPanel";
import IAAlerts from "@/components/IAAlerts";
import AdditionalChartsPanel from "@/components/AdditionalChartsPanel";
import { useAnalytics } from "@/hooks/use-analytics";
import { LayoutDashboard } from "lucide-react";

export default function Index() {
  const { data: analytics, isLoading: loading, error } = useAnalytics('todos');

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-emerald-50/40 dark:to-emerald-950/10">
        <div className="container py-8 space-y-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !analytics) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-emerald-50/40 dark:to-emerald-950/10">
        <div className="container py-8 space-y-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-600 mb-4">Erro ao carregar dados: {error?.message || 'Erro desconhecido'}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-emerald-50/40 dark:to-emerald-950/10">
      <div className="container py-8 space-y-8">
        <header className="space-y-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-blue-600" />
              Painel de Inteligência 
            </h1>
            <p className="text-muted-foreground max-w-4xl mt-2">
              Gestão proativa com mapa geoespacial, indicadores em tempo real e alertas preditivos para priorizar onde agir primeiro.
            </p>
          </div>
        </header>

        <KPIs 
          abertos={analytics.kpis.abertos} 
          risco={analytics.kpis.risco} 
          avgHoras={analytics.kpis.avgHoras} 
        />

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
          <div className="xl:col-span-2">
            <MapPanel />
          </div>
          <div className="xl:col-span-1">
            <IAAlerts />
          </div>
        </section>

        <ChartsPanel 
          demand={analytics.charts.demandByType} 
          efficiency={analytics.charts.efficiencyByBairro} 
        />

        <AdditionalChartsPanel 
          series={analytics.charts.seriesChamadosPorDia} 
          sla={analytics.charts.resolucaoHistogram} 
          statusTipo={analytics.charts.statusPorTipo} 
        />
      </div>
    </main>
  );
}
