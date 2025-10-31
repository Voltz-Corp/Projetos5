import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generateInsights(incidents) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        console.warn('Gemini API key not configured, falling back to heuristic alerts');
        return this.generateFallbackInsights(incidents);
      }

      const prompt = this.buildAnalysisPrompt(incidents);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseAIResponse(text, incidents);
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return this.generateFallbackInsights(incidents);
    }
  }

  buildAnalysisPrompt(incidents) {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentIncidents = incidents.filter(i =>
      new Date(i.createdAt) >= last7Days
    );

    const stats = {
      total: incidents.length,
      recent: recentIncidents.length,
      byType: {
        poda: incidents.filter(i => i.type === 'poda').length,
        risco: incidents.filter(i => i.type === 'risco').length,
        queda: incidents.filter(i => i.type === 'queda').length,
      },
      byStatus: {
        aberto: incidents.filter(i => i.status === 'aberto').length,
        concluido: incidents.filter(i => i.status === 'concluido').length,
        em_analise: incidents.filter(i => i.status === 'em_analise').length,
      },
      byBairro: this.getTopBairros(incidents, 5),
    };

    return `
Você é um analista de inteligência artificial especializado em arborização urbana e gestão de riscos para a Prefeitura do Recife. Analise os dados dos incidentes de árvores e gere insights preditivos e recomendações acionáveis.

DADOS ATUAIS:
- Total de incidentes: ${stats.total}
- Incidentes nos últimos 7 dias: ${stats.recent}
- Por tipo: Poda (${stats.byType.poda}), Risco (${stats.byType.risco}), Queda (${stats.byType.queda})
- Por status: Abertos (${stats.byStatus.aberto}), Concluídos (${stats.byStatus.concluido}), Em análise (${stats.byStatus.em_analise})
- Top bairros por incidentes: ${stats.byBairro.map(b => `${b.bairro}: ${b.count}`).join(', ')}

TAREFA:
Gere 3-5 insights preditivos prioritários sobre:
1. Padrões de risco identificados
2. Áreas que precisam de atenção preventiva
3. Tendências sazonais ou climáticas
4. Recomendações para otimização de recursos

FORMATO DE RESPOSTA (JSON válido):
[
  {
    "type": "warning|alert|info",
    "title": "Título conciso do insight",
    "description": "Descrição detalhada do padrão identificado",
    "priority": "high|medium|low",
    "bairros": ["Bairro1", "Bairro2"] ou [],
    "recommendations": ["Recomendação 1", "Recomendação 2"],
    "confidence": 0.85
  }
]

IMPORTANTE SOBRE BAIRROS:
- Se o insight é específico de um ou mais bairros, retorne um array com os nomes dos bairros
- Se o insight é geral/não específico de bairro, retorne array vazio []
- Sempre retorne pelo menos 1 bairro ou nenhum (array vazio)
- Não retorne "bairro" (singular), apenas "bairros" (plural como array)

CRITÉRIOS:
- Foque em insights acionáveis que ajudem na tomada de decisão
- Considere fatores climáticos (ventos, chuvas) para Recife
- Priorize áreas com alta concentração de incidentes
- Sugira ações preventivas baseadas em padrões históricos
- Mantenha alta confiança (0.7+) apenas para padrões claros
`;
  }

  getTopBairros(incidents, limit) {
    const byBairro = {};
    incidents.forEach(i => {
      byBairro[i.bairro] = (byBairro[i.bairro] || 0) + 1;
    });

    return Object.entries(byBairro)
      .map(([bairro, count]) => ({ bairro, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  parseAIResponse(text, incidents) {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const insights = JSON.parse(jsonMatch[0]);

      // Validate and enhance insights
      return insights.map((insight, index) => ({
        id: `ai-${Date.now()}-${index}`,
        type: insight.type || 'info',
        title: insight.title || 'Insight gerado por IA',
        description: insight.description || '',
        priority: insight.priority || 'medium',
        bairros: Array.isArray(insight.bairros) ? insight.bairros : [],
        recommendations: insight.recommendations || [],
        confidence: insight.confidence || 0.8,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.generateFallbackInsights(incidents);
    }
  }

  generateFallbackInsights(incidents) {
    // Fallback to heuristic-based insights when AI fails
    const now = Date.now();
    const last48h = incidents.filter(i =>
      now - new Date(i.createdAt).getTime() < 48 * 60 * 60 * 1000
    );

    const riskIncidents = last48h.filter(i => i.type === 'risco');
    const openIncidents = incidents.filter(i => i.status === 'aberto');

    const insights = [];

    if (riskIncidents.length > 0) {
      const topRiskBairros = this.getTopBairros(riskIncidents, 3);
      insights.push({
        id: 'fallback-1',
        type: 'warning',
        title: 'Incidentes de risco recentes',
        description: `${riskIncidents.length} incidentes de risco foram reportados nas últimas 48 horas. Áreas críticas requerem atenção imediata.`,
        priority: 'high',
        bairros: topRiskBairros.map(b => b.bairro),
        recommendations: [
          'Priorizar inspeções em áreas com incidentes de risco',
          'Aumentar frequência de monitoramento preventivo',
          'Coordenar com equipes de resposta rápida'
        ],
        confidence: 0.9,
        timestamp: Date.now(),
      });
    }

    if (openIncidents.length > 10) {
      const topOpenBairros = this.getTopBairros(openIncidents, 2);
      insights.push({
        id: 'fallback-2',
        type: 'alert',
        title: 'Backlog de incidentes abertos',
        description: `${openIncidents.length} incidentes permanecem sem resolução. Considere redistribuição de recursos.`,
        priority: 'medium',
        bairros: topOpenBairros.map(b => b.bairro),
        recommendations: [
          'Avaliar capacidade atual da equipe',
          'Implementar sistema de priorização',
          'Considerar contratação temporária'
        ],
        confidence: 0.8,
        timestamp: Date.now(),
      });
    }

    // Add general insight if no specific issues
    if (insights.length === 0) {
      insights.push({
        id: 'fallback-3',
        type: 'info',
        title: 'Sistema operacional normal',
        description: 'Os indicadores de arborização urbana estão dentro dos parâmetros normais.',
        priority: 'low',
        bairros: [],
        recommendations: [
          'Manter monitoramento regular',
          'Continuar inspeções preventivas programadas'
        ],
        confidence: 0.7,
        timestamp: Date.now(),
      });
    }

    return insights;
  }
}

export default new GeminiService();