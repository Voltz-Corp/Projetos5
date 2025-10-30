import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdditionalChartsPanel from "@/components/AdditionalChartsPanel";
import { fetchIncidents, Incident, kpis, seriesChamadosPorDia, resolucaoHistogram, statusPorTipo } from "@/lib/data";
import { exportCSV, exportJSON, exportPDF } from "@/lib/export";
import { Button } from "@/components/ui/button";

export default function Relatorios() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents()
      .then(setIncidents)
      .finally(() => setLoading(false));
  }, []);

  const k = useMemo(() => kpis(incidents), [incidents]);
  const series = useMemo(() => seriesChamadosPorDia(incidents, 14), [incidents]);
  const sla = useMemo(() => resolucaoHistogram(incidents), [incidents]);
  const statusTipo = useMemo(() => statusPorTipo(incidents), [incidents]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container py-8 text-center">
          <p>Carregando relatórios...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container py-8 space-y-8">
        <header className="flex flex-col gap-2 print:hidden">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Relatórios e Exportação</h1>
          <p className="text-muted-foreground max-w-3xl">Prototipo de relatório consolidado com gráficos adicionais e opções de exportação (CSV, JSON, PDF).</p>
          <div className="flex flex-wrap gap-3 mt-2">
            <Button onClick={() => exportCSV(incidents)}>Exportar CSV</Button>
            <Button variant="secondary" onClick={() => exportJSON(incidents)}>Exportar JSON</Button>
            <Button variant="outline" onClick={() => exportPDF()}>Exportar PDF</Button>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>Resumo</CardTitle></CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li><b>Chamados abertos:</b> {k.abertos.toLocaleString("pt-BR")}</li>
                <li><b>Ocorrências de risco:</b> {k.risco.toLocaleString("pt-BR")}</li>
                <li><b>Tempo médio de resolução:</b> {k.avgHoras.toLocaleString("pt-BR")} h</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Notas</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Este relatório é um protótipo. Integrações futuras podem conectar dados reais e gerar PDFs oficiais.</p>
            </CardContent>
          </Card>
        </section>

        <AdditionalChartsPanel series={series} sla={sla} statusTipo={statusTipo} />

        <Card className="print:block hidden">
          <CardHeader><CardTitle>Rodapé do Relatório</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Gerado por Recife Inteligente · {new Date().toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
