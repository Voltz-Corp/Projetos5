import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, AreaChart, Area, BarChart, Bar } from "recharts";

export type AdditionalChartsPanelProps = {
  series: { date: string; criados: number; concluidos: number; risco: number }[];
  sla: { range: string; value: number }[];
  statusTipo: { tipo: string; aberto: number; concluido: number }[];
};

export default function AdditionalChartsPanel({ series, sla, statusTipo }: AdditionalChartsPanelProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Tendência de Chamados (últimos 14 dias)</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ left: -20 }}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="criados" name="Criados" stroke="#2563eb" fill="#dbeafe" fillOpacity={0.3} />
              <Area type="monotone" dataKey="concluidos" name="Concluídos" stroke="#0981b2" fill="#cffafe" fillOpacity={0.3} />
              <Line type="monotone" dataKey="risco" name="Risco" stroke="#f59e0b" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição de SLA (fechados)</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sla}>
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" name="Chamados" fill="#2563eb" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle>Status por Tipo</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusTipo}>
              <XAxis dataKey="tipo" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="aberto" name="Aberto" stackId="s" fill="#ef4444" />
              <Bar dataKey="concluido" name="Concluído" stackId="s" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
