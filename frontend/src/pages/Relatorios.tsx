import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AdditionalChartsPanel from "@/components/AdditionalChartsPanel";
import { exportPDF } from "@/lib/export";
import { exportRelatorioCSV, exportRelatorioJSON } from "@/lib/export-relatorios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useIncidents } from "@/contexts/IncidentsContext";
import { useAnalytics } from "@/hooks/use-analytics";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Download, FileText, Calendar, BarChart3, MapPin } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function Relatorios() {
  const { incidents } = useIncidents();
  const [periodo, setPeriodo] = useState<string>("30");
  
  // Use analytics hook with period filter
  const { data: analytics, isLoading: loading, error } = useAnalytics(periodo);

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container py-8 text-center">
          <p>Carregando relatórios...</p>
        </div>
      </main>
    );
  }

  if (error || !analytics) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container py-8 text-center">
          <p className="text-red-600">Erro ao carregar dados: {error?.message || 'Erro desconhecido'}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-blue-50/30 dark:to-blue-950/10">
      <div className="container py-8 space-y-8">
        {/* Cabeçalho */}
        <header className="space-y-4 print:hidden">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Relatórios e Análises
              </h1>
              <p className="text-muted-foreground max-w-3xl mt-2">
                Análise completa dos chamados com métricas, tendências e visualizações detalhadas.
              </p>
            </div>
            
            {/* Seletor de Período */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Período
              </label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="15">Últimos 15 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                  <SelectItem value="todos">Todo período</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botões de Exportação */}
          <Card className="bg-gradient-to-br from-blue-50/60 to-cyan-50/60 dark:from-blue-900/10 dark:to-cyan-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Exportar Relatório
              </CardTitle>
              <CardDescription>
                Baixe o relatório completo nos formatos disponíveis.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={() => analytics && exportRelatorioCSV(analytics, periodo)} className="gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar CSV
              </Button>
              <Button variant="secondary" onClick={() => analytics && exportRelatorioJSON(analytics, periodo)} className="gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Exportar JSON
              </Button>
              <Button variant="outline" onClick={() => exportPDF()} className="gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Exportar PDF
              </Button>
            </CardContent>
          </Card>
        </header>

        {/* KPIs Principais */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Indicadores-Chave de Performance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50/60 to-cyan-50/60 dark:from-blue-900/10 dark:to-cyan-900/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Chamados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.kpis.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  No período selecionado
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50/60 to-green-50/60 dark:from-emerald-900/10 dark:to-green-900/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Chamados Resolvidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">{analytics.kpis.concluidos}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.kpis.taxaResolucao}% de taxa de resolução
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50/60 to-orange-50/60 dark:from-amber-900/10 dark:to-orange-900/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Chamados Abertos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">{analytics.kpis.abertos}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Aguardando resolução
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50/60 to-pink-50/60 dark:from-purple-900/10 dark:to-pink-900/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{analytics.kpis.avgHoras.toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tempo de resolução
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Análise por Localização */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            Top 5 Bairros com Mais Chamados
          </h2>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Bairro</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Percentual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.analytics.topBairros.map((item, idx) => (
                    <TableRow key={item.bairro}>
                      <TableCell className="font-medium">
                        <Badge variant={idx === 0 ? "default" : "secondary"}>
                          {idx + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.bairro}</TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                      <TableCell className="text-right">
                        {((item.count / analytics.kpis.total) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
  
        {/* Eficiência Operacional */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            Eficiência Operacional por Bairro
          </h2>
          <Card className="bg-gradient-to-br from-blue-50/30 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Percentual de Resolução
              </CardTitle>
              <CardDescription>Taxa de eficiência por localidade</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.charts.efficiencyByBairro} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis 
                    dataKey="bairro" 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis 
                    unit="%" 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#d1d5db' }}
                  />
                  <Tooltip 
                    formatter={(v: any) => [`${v}%`, 'Eficiência']}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="eficiencia" 
                    name="Eficiência" 
                    fill="#10b981" 
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        {/* Distribuição por Tipo e Status */}
        <section className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Tipo</CardTitle>
              <CardDescription>Categorização dos chamados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(analytics.analytics.porTipo).map(([tipo, count]) => {
                const percentage = ((count / analytics.kpis.total) * 100).toFixed(1);
                const emoji = tipo === "poda" ? "✂️" : tipo === "risco" ? "⚠️" : "🌳";
                return (
                  <div key={tipo} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">
                        {emoji} {tipo}
                      </span>
                      <span className="text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all",
                          tipo === "poda" && "bg-emerald-500",
                          tipo === "risco" && "bg-amber-500",
                          tipo === "queda" && "bg-sky-500"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Situação dos chamados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(analytics.analytics.porStatus).map(([status, count]) => {
                const percentage = ((count / analytics.kpis.total) * 100).toFixed(1);
                const label = status === "em_analise" ? "Em Análise" : status === "aberto" ? "Aberto" : "Concluído";
                const emoji = status === "aberto" ? "🔴" : status === "em_analise" ? "🔵" : "🟢";
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {emoji} {label}
                      </span>
                      <span className="text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all",
                          status === "aberto" && "bg-rose-500",
                          status === "em_analise" && "bg-blue-500",
                          status === "concluido" && "bg-emerald-500"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>


        <section>

          <AdditionalChartsPanel 
            series={analytics.charts.seriesChamadosPorDia} 
            sla={analytics.charts.resolucaoHistogram} 
            statusTipo={analytics.charts.statusPorTipo}
          />
        </section>

        {/* Rodapé para Impressão */}
        <Card className="print:block hidden">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Relatório de Arborização Urbana - Prefeitura do Recife</p>
              <p className="text-xs text-muted-foreground">
                Gerado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}
              </p>
              <p className="text-xs text-muted-foreground">
                Período: {periodo === "todos" ? "Todo período" : `Últimos ${periodo} dias`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
