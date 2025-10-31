// Função para baixar arquivo
function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Tipo para os dados de analytics
type AnalyticsData = {
  kpis: {
    total: number;
    concluidos: number;
    taxaResolucao: number;
    abertos: number;
    avgHoras: number;
    risco?: number;
  };
  analytics: {
    topBairros: Array<{ bairro: string; count: number }>;
    porTipo: Record<string, number>;
    porStatus: Record<string, number>;
  };
  charts: {
    statusPorTipo?: Array<{ tipo: string; aberto: number; concluido: number }>;
    efficiencyByBairro?: Array<{ bairro: string; eficiencia: number }>;
    [key: string]: any;
  };
};

// Função para exportar dados do relatório em CSV
export function exportRelatorioCSV(analytics: AnalyticsData, periodo: string) {
  const periodoLabel = periodo === "todos" ? "Todo período" : `Últimos ${periodo} dias`;
  const dataHora = new Date().toLocaleString("pt-BR");
  
  let csv = `Relatório de Arborização Urbana - Prefeitura do Recife\n`;
  csv += `Gerado em: ${dataHora}\n`;
  csv += `Período: ${periodoLabel}\n\n`;
  
  // KPIs
  csv += `INDICADORES-CHAVE DE PERFORMANCE\n`;
  csv += `Métrica,Valor\n`;
  csv += `Total de Chamados,${analytics.kpis.total}\n`;
  csv += `Chamados Resolvidos,${analytics.kpis.concluidos}\n`;
  csv += `Taxa de Resolução,${analytics.kpis.taxaResolucao}%\n`;
  csv += `Chamados Abertos,${analytics.kpis.abertos}\n`;
  csv += `Tempo Médio de Resolução,${analytics.kpis.avgHoras.toFixed(1)}h\n\n`;
  
  // Top Bairros
  csv += `TOP 5 BAIRROS COM MAIS CHAMADOS\n`;
  csv += `Posição,Bairro,Quantidade,Percentual\n`;
  analytics.analytics.topBairros.forEach((item, idx) => {
    const percentual = ((item.count / analytics.kpis.total) * 100).toFixed(1);
    csv += `${idx + 1},${item.bairro},${item.count},${percentual}%\n`;
  });
  csv += `\n`;
  
  // Distribuição por Tipo
  csv += `DISTRIBUIÇÃO POR TIPO\n`;
  csv += `Tipo,Quantidade,Percentual\n`;
  Object.entries(analytics.analytics.porTipo).forEach(([tipo, count]) => {
    const percentual = ((count / analytics.kpis.total) * 100).toFixed(1);
    csv += `${tipo},${count},${percentual}%\n`;
  });
  csv += `\n`;
  
  // Distribuição por Status
  csv += `DISTRIBUIÇÃO POR STATUS\n`;
  csv += `Status,Quantidade,Percentual\n`;
  Object.entries(analytics.analytics.porStatus).forEach(([status, count]) => {
    const statusLabel = status === "em_analise" ? "Em Análise" : status === "aberto" ? "Aberto" : "Concluído";
    const percentual = ((count / analytics.kpis.total) * 100).toFixed(1);
    csv += `${statusLabel},${count},${percentual}%\n`;
  });
  csv += `\n`;
  
  // Eficiência Operacional por Bairro
  if (analytics.charts.efficiencyByBairro) {
    csv += `EFICIÊNCIA OPERACIONAL POR BAIRRO\n`;
    csv += `Bairro,Eficiência (%)\n`;
    analytics.charts.efficiencyByBairro.forEach((item) => {
      csv += `${item.bairro},${item.eficiencia}%\n`;
    });
    csv += `\n`;
  }
  
  // Status por Tipo
  if (analytics.charts.statusPorTipo) {
    csv += `STATUS POR TIPO\n`;
    csv += `Tipo,Abertos,Concluídos,Total\n`;
    analytics.charts.statusPorTipo.forEach((item) => {
      const total = item.aberto + item.concluido;
      csv += `${item.tipo},${item.aberto},${item.concluido},${total}\n`;
    });
  }
  
  downloadFile("relatorio-dashboard.csv", csv, "text/csv;charset=utf-8;");
}

// Função para exportar dados do relatório em JSON
export function exportRelatorioJSON(analytics: AnalyticsData, periodo: string) {
  const periodoLabel = periodo === "todos" ? "Todo período" : `Últimos ${periodo} dias`;
  const dataHora = new Date().toLocaleString("pt-BR");
  
  const relatorio = {
    metadata: {
      titulo: "Relatório de Arborização Urbana - Prefeitura do Recife",
      geradoEm: dataHora,
      periodo: periodoLabel,
      periodoValor: periodo
    },
    kpis: {
      totalChamados: analytics.kpis.total,
      chamadosResolvidos: analytics.kpis.concluidos,
      taxaResolucao: analytics.kpis.taxaResolucao,
      chamadosAbertos: analytics.kpis.abertos,
      tempoMedioResolucao: parseFloat(analytics.kpis.avgHoras.toFixed(1))
    },
    topBairros: analytics.analytics.topBairros.map((item, idx) => ({
      posicao: idx + 1,
      bairro: item.bairro,
      quantidade: item.count,
      percentual: parseFloat(((item.count / analytics.kpis.total) * 100).toFixed(1))
    })),
    distribuicaoPorTipo: Object.entries(analytics.analytics.porTipo).map(([tipo, count]) => ({
      tipo,
      quantidade: count,
      percentual: parseFloat(((count / analytics.kpis.total) * 100).toFixed(1))
    })),
    distribuicaoPorStatus: Object.entries(analytics.analytics.porStatus).map(([status, count]) => ({
      status,
      statusLabel: status === "em_analise" ? "Em Análise" : status === "aberto" ? "Aberto" : "Concluído",
      quantidade: count,
      percentual: parseFloat(((count / analytics.kpis.total) * 100).toFixed(1))
    })),
    eficienciaOperacional: analytics.charts.efficiencyByBairro || [],
    statusPorTipo: analytics.charts.statusPorTipo || [],
    charts: analytics.charts
  };
  
  downloadFile("relatorio-dashboard.json", JSON.stringify(relatorio, null, 2), "application/json");
}
