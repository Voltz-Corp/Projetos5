import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

export type ChartsPanelProps = {
  demand: { name: string; value: number }[];
  efficiency: { bairro: string; eficiencia: number }[];
};

const COLORS = ["#2563eb", "#f59e0b", "#06b6d4", "#3b82f6", "#60a5fa"];

export default function ChartsPanel({ demand, efficiency }: ChartsPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Principais Tipos de Demanda</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={demand} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {demand.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => v.toLocaleString("pt-BR")} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Eficiência Operacional por Bairro</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={efficiency} margin={{ left: -20 }}>
              <XAxis dataKey="bairro" tick={{ fontSize: 12 }} />
              <YAxis unit="%" tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => `${v}%`} />
              <Bar dataKey="eficiencia" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
