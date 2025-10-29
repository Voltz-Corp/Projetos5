import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, BellRing } from "lucide-react";

export default function IAAlerts({ alerts }: { alerts: string[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BellRing className="text-blue-600" size={20} />
          Motor de IA · Alertas Preditivos
        </CardTitle>
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 flex items-center gap-1">
          <AlertTriangle size={14} />
          Monitorando
        </Badge>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem alertas no momento.</p>
        ) : (
          <ul className="space-y-3">
            {alerts.map((a, i) => (
              <li key={i} className="p-3 rounded-md bg-blue-50/60 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/40">
                <span className="text-sm">{a}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
