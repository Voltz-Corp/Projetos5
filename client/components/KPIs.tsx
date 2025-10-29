import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, Timer } from "lucide-react";

export type KPIsProps = {
  abertos: number;
  risco: number;
  avgHoras: number;
};

export default function KPIs({ abertos, risco, avgHoras }: KPIsProps) {
  const items = [
    {
      label: "Chamados Abertos",
      value: abertos.toLocaleString("pt-BR"),
      Icon: Activity,
      color: "text-blue-600",
    },
    {
      label: "Ocorrências de Risco",
      value: risco.toLocaleString("pt-BR"),
      Icon: AlertTriangle,
      color: "text-amber-600",
    },
    {
      label: "Tempo Médio de Resolução",
      value: `${avgHoras.toLocaleString("pt-BR")} h`,
      Icon: Timer,
      color: "text-sky-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(({ label, value, Icon, color }) => (
        <Card key={label} className="bg-gradient-to-br from-blue-50/60 to-cyan-50/60 dark:from-blue-900/10 dark:to-cyan-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            <Icon className={color} size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
