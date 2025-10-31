import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Info, Zap, Loader2, BellRing } from "lucide-react";
import { useAIInsights } from "@/hooks/use-ai-insights";

interface AIInsight {
  id: string;
  type: 'warning' | 'alert' | 'info';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  bairros?: string[];
  recommendations?: string[];
  confidence: number;
  timestamp: number;
}

interface IAAlertsProps {
  alerts?: string[]; // Keep for backward compatibility
}

export default function IAAlerts({ alerts }: IAAlertsProps) {
  const {
    data: insights = [],
    isLoading: loading,
    error,
    refetch
  } = useAIInsights();

  const [loadingMessage, setLoadingMessage] = useState("Analisando...");
  const [messageOpacity, setMessageOpacity] = useState(1);
  const [loadingTime, setLoadingTime] = useState(0);

  const loadingMessages = [
    "Analisando dados...",
    "Processando informações...",
    "Gerando insights...",
    "Calculando riscos...",
    "Otimizando alertas..."
  ];

  useEffect(() => {
    if (loading) {
      let messageIndex = 0;
      const messageInterval = setInterval(() => {
        setMessageOpacity(0);
        
        setTimeout(() => {
          messageIndex = (messageIndex + 1) % loadingMessages.length;
          setLoadingMessage(loadingMessages[messageIndex]);
          setMessageOpacity(1);
        }, 200);
      }, 2500);

      const timeInterval = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);

      return () => {
        clearInterval(messageInterval);
        clearInterval(timeInterval);
      };
    } else {
      setLoadingTime(0);
    }
  }, [loading]);

  const getIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'alert':
        return <Zap className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Render loading skeletons
  const renderLoadingSkeletons = () => (
    <>
      {[1, 2].map((i) => (
        <div key={i} className="p-4 border rounded-lg bg-gradient-to-r from-white to-gray-50/50">
          <div className="flex items-start gap-3">
            <Skeleton className="h-4 w-4 mt-0.5 rounded-full" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4 mb-3" />
              <Skeleton className="h-5 w-20 mb-2" />
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );

  // Fallback to old alerts if no AI insights available
  const displayAlerts = insights.length > 0 ? insights : alerts?.map((alert, index) => ({
    id: `fallback-${index}`,
    type: 'info' as const,
    title: 'Alerta de Risco',
    description: alert,
    priority: 'medium' as const,
    confidence: 0.7,
    timestamp: Date.now(),
  })) || [];

  console.log(insights)

  return (
    <Card className="h-[586px] flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3 bg-gradient-to-br from-blue-50/60 to-cyan-50/60 dark:from-blue-900/10 dark:to-cyan-900/10 shadow-sm mb-6">
        <div>
          <CardTitle className="flex items-center gap-2 mb-2">
            <BellRing className="text-blue-600" size={20} />
            Motor de IA · Alertas Preditivos
          </CardTitle>
          <CardDescription className="mb-2">
            Insights inteligentes baseados em análise de dados
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {loading && (
          <div className="flex items-center justify-between text-gray-500 mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Loader2 key="spinner" className="h-5 w-5 animate-spin flex-shrink-0 text-emerald-600" />
              <span 
                className="text-sm font-medium transition-opacity duration-300 ease-in-out w-48 text-left"
                style={{ opacity: messageOpacity }}
              >
                {loadingMessage}
              </span>
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {loadingTime}s
            </div>
          </div>
        )}

        {loading && renderLoadingSkeletons()}

        {!loading && error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              Erro ao carregar insights de IA
              <button
                onClick={() => refetch()}
                className="ml-2 text-xs underline hover:no-underline"
              >
                Tentar novamente
              </button>
            </p>
          </div>
        )}

        {!loading && displayAlerts.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum insight disponível no momento</p>
          </div>
        )}

        {!loading && displayAlerts.map((insight) => (
          <div
            key={insight.id}
            className="p-4 border rounded-lg bg-gradient-to-r from-white to-gray-50/50 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getIcon(insight.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-sm leading-tight">
                    {insight.title}
                  </h4>
                  <Badge
                    variant="outline"
                    className={`text-xs px-2 py-0.5 ${getPriorityColor(insight.priority)}`}
                  >
                    {insight.priority === 'high' ? 'Alta' :
                     insight.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {insight.description}
                </p>

                {insight.bairros && insight.bairros.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {insight.bairros.map((bairro, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {bairro}
                      </Badge>
                    ))}
                  </div>
                )}

                {insight.recommendations && insight.recommendations.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Recomendações:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {insight.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-emerald-600 mt-1.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                  <div className="text-xs text-muted-foreground">
                    Confiança: {Math.round(insight.confidence * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(insight.timestamp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {!loading && insights.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-muted-foreground text-center">
              Insights atualizados automaticamente a cada 10 minutos
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
