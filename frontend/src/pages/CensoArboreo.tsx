import { useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PageLoader } from "@/components";
import { useBairros, useBairroStats, useTreeStats } from "@/hooks/use-geo-data";
import {
  Diameter,
  ListOrdered,
  Map,
  MessageSquare,
  PieChartIcon,
  Ruler,
  TreeDeciduous,
  TreePine,
  Trees,
  BarChart2,
} from "lucide-react";

const normalizeString = (str: string) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
};

const DENSITY_COLORS = {
  veryHigh: "#0d5016",
  high: "#1a7a2a",
  mediumHigh: "#4a9a5b",
  medium: "#7db88d",
  mediumLow: "#9fcba8",
  low: "#c1ddc6",
  veryLow: "#e3f2e6",
};

const getDensityColor = (densidade: number) => {
  if (densidade > 3000000000) return DENSITY_COLORS.veryHigh;
  if (densidade > 2000000000) return DENSITY_COLORS.high;
  if (densidade > 1500000000) return DENSITY_COLORS.mediumHigh;
  if (densidade > 1000000000) return DENSITY_COLORS.medium;
  if (densidade > 500000000) return DENSITY_COLORS.mediumLow;
  if (densidade > 100000000) return DENSITY_COLORS.low;
  return DENSITY_COLORS.veryLow;
};

export default function CensoArboreo() {
  const [selectedBairro, setSelectedBairro] = useState<string | null>(null);
  const { data: bairrosData, isLoading: isLoadingBairros } = useBairros();
  const { data: statsResponse, isLoading: isLoadingStats } = useBairroStats();
  const { data: globalStats, isLoading: isLoadingGlobal } = useTreeStats();

  if (isLoadingBairros || isLoadingStats || isLoadingGlobal) {
    return <PageLoader />;
  }

  const statsData = statsResponse?.data || [];

  const styleFeature = (feature: any) => {
    const bairroNome = feature.properties.EBAIRRNOME;
    const bairroData = statsData?.find(
      (s) => normalizeString(s.bairro) === bairroNome,
    );
    const densidade = bairroData?.densidade || 0;

    return {
      fillColor: getDensityColor(densidade),
      weight: selectedBairro === bairroNome ? 3 : 1,
      opacity: 1,
      color: selectedBairro === bairroNome ? "#000" : "#666",
      fillOpacity: 0.7,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const bairroNome = feature.properties.EBAIRRNOME;
    const bairroData = statsData?.find(
      (s) => normalizeString(s.bairro) === normalizeString(bairroNome),
    );

    layer.bindTooltip(bairroNome, {
      permanent: true,
      direction: "center",
      className: "bairro-label",
    });

    layer.on({
      mouseover: (e: L.LeafletEvent) => {
        const target = e.target as L.Path;
        target.setStyle({
          weight: 3,
          color: "#000",
          fillOpacity: 0.85,
        });
      },
      mouseout: (e: L.LeafletEvent) => {
        const target = e.target as L.Path;
        if (selectedBairro !== bairroNome) {
          target.setStyle({
            weight: 1,
            color: "#666",
            fillOpacity: 0.7,
          });
        }
      },
      click: () => {
        setSelectedBairro(selectedBairro === bairroNome ? null : bairroNome);
      },
    });

    if (bairroData) {
      layer.bindPopup(`
        <div class="p-2">
          <strong>${bairroNome}</strong><br/>
          🌳 ${bairroData.quantidade} árvores<br/>
          📏 Altura média: ${bairroData.mediaAltura.toFixed(1)}m<br/>
          📊 DAP médio: ${bairroData.mediaDap.toFixed(1)}cm<br/>
          🌿 Principal: ${bairroData.topEspecies[0]?.nome || "N/A"}
        </div>
      `);
    }
  };

  const selectedBairroData = selectedBairro
    ? statsData?.find(
        (s) => normalizeString(s.bairro) === normalizeString(selectedBairro),
      )
    : null;

  const top10Bairros = [...statsData]
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 10);

  const chartData = top10Bairros.map((b) => ({
    bairro: b.bairro.length > 15 ? b.bairro.substring(0, 15) + "..." : b.bairro,
    quantidade: b.quantidade,
  }));

  const porteData = globalStats?.distribuicao?.porPorte
    ? Object.entries(globalStats.distribuicao.porPorte).map(
        ([porte, quantidade]) => ({ porte, quantidade }),
      )
    : [];
  const especiesData = (globalStats?.topEspecies || [])
    .slice(0, 10)
    .map((e) => ({
      especie: e.nome.length > 30 ? e.nome.substring(0, 30) + "..." : e.nome,
      quantidade: e.quantidade,
    }));

  const COLORS = ["#0d5016", "#1a7a2a", "#4a9a5b", "#7db88d", "#9fcba8"];
  const PLOT_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"];

  return (
    <main className="min-h-screen bg-background">
      <div className="container py-8 space-y-8">
        <header className="space-y-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
              <TreeDeciduous className="w-8 h-8 text-blue-600" />
              Censo Arbóreo
            </h1>
            <p className="text-muted-foreground max-w-3xl mt-2">
              Análise do GeoJSON referente ao censo arbóreo do estado de
              Pernambuco.
            </p>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50/60 to-cyan-50/60 dark:from-blue-900/10 dark:to-cyan-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Árvores
              </CardTitle>
              <TreePine className="text-blue-600" size={20} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {globalStats?.totalArvores.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50/60 to-cyan-50/60 dark:from-blue-900/10 dark:to-cyan-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Espécies
              </CardTitle>
              <Trees className="text-amber-600" size={20} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {globalStats?.totalEspecies.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50/60 to-cyan-50/60 dark:from-blue-900/10 dark:to-cyan-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Altura Média
              </CardTitle>
              <Ruler className="text-sky-600" size={20} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {globalStats?.caracteristicas.altura.media.toFixed(1)}m
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50/60 to-cyan-50/60 dark:from-blue-900/10 dark:to-cyan-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                DAP Médio
              </CardTitle>
              <Diameter className="text-purple-600" size={20} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {globalStats?.caracteristicas.dap.media.toFixed(1)}cm
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="mapa" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mapa">Mapa Interativo</TabsTrigger>
            <TabsTrigger value="ranking">Ranking de Bairros</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="mapa" className="space-y-4">
            <Card className="bg-gradient-to-br from-blue-50/60 to-cyan-50/60 dark:from-blue-900/10 dark:to-cyan-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="text-blue-600" />
                  Densidade de Árvores por Bairro
                </CardTitle>
                <p className="text-sm text-muted-foreground pt-2">
                  Mapa interativo mostrando a densidade de árvores em cada
                  bairro.
                </p>
              </CardHeader>
              <CardContent>
                <div style={{ height: "600px", width: "100%" }}>
                  <MapContainer
                    {...{
                      center: [-8.05, -34.9] as [number, number],
                      zoom: 12,
                      style: { height: "100%", width: "100%" },
                    }}
                  >
                    <TileLayer
                      {...{
                        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                      }}
                    />
                    {bairrosData && (
                      <GeoJSON
                        data={bairrosData as any}
                        {...{ style: styleFeature, onEachFeature }}
                      />
                    )}
                  </MapContainer>
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-4 justify-center">
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        backgroundColor: DENSITY_COLORS.veryHigh,
                      }}
                    />
                    <span className="text-sm">Muito Alta (&gt;3000/km²)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        backgroundColor: DENSITY_COLORS.high,
                      }}
                    />
                    <span className="text-sm">Alta (2000-3000/km²)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        backgroundColor: DENSITY_COLORS.mediumHigh,
                      }}
                    />
                    <span className="text-sm">Média-Alta (1500-2000/km²)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        backgroundColor: DENSITY_COLORS.medium,
                      }}
                    />
                    <span className="text-sm">Média (1000-1500/km²)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        backgroundColor: DENSITY_COLORS.mediumLow,
                      }}
                    />
                    <span className="text-sm">Média-Baixa (500-1000/km²)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        backgroundColor: DENSITY_COLORS.low,
                      }}
                    />
                    <span className="text-sm">Baixa (100-500/km²)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        backgroundColor: DENSITY_COLORS.veryLow,
                      }}
                    />
                    <span className="text-sm">Muito Baixa (&lt;100/km²)</span>
                  </div>
                </div>

                {/* Selected Bairro Details */}
                {selectedBairroData && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>{selectedBairroData.bairro}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-xl font-bold">
                            {selectedBairroData.quantidade}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Altura Média
                          </p>
                          <p className="text-xl font-bold">
                            {selectedBairroData.mediaAltura.toFixed(1)}m
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            DAP Médio
                          </p>
                          <p className="text-xl font-bold">
                            {selectedBairroData.mediaDap.toFixed(1)}cm
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Espécies
                          </p>
                          <p className="text-xl font-bold">
                            {selectedBairroData.topEspecies.length}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Top 5 Espécies</h4>
                        <ul className="space-y-1">
                          {selectedBairroData.topEspecies
                            .slice(0, 5)
                            .map((esp, idx) => (
                              <li
                                key={idx}
                                className="text-sm flex justify-between"
                              >
                                <span>{esp.nome}</span>
                                <span className="font-medium">
                                  {esp.quantidade}
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>

                      {selectedBairroData.portes &&
                        Object.keys(selectedBairroData.portes).length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">
                              Distribuição por Porte
                            </h4>
                            <div className="space-y-1">
                              {Object.entries(selectedBairroData.portes).map(
                                ([porte, quantidade], idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between text-sm"
                                  >
                                    <span>{porte}</span>
                                    <span className="font-medium">
                                      {quantidade}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ranking">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListOrdered className="text-blue-600" />
                  Top 10 Bairros com Maior Densidade
                </CardTitle>
                <p className="text-sm text-muted-foreground pt-2">
                  Lista dos 10 bairros com a maior quantidade de árvores.
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Bairro</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Altura Média</TableHead>
                      <TableHead className="text-right">DAP Médio</TableHead>
                      <TableHead>Espécie Principal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {top10Bairros.map((bairro, idx) => (
                      <TableRow
                        key={bairro.bairro}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() =>
                          setSelectedBairro(
                            selectedBairro === bairro.bairro
                              ? null
                              : bairro.bairro,
                          )
                        }
                      >
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell>{bairro.bairro}</TableCell>
                        <TableCell className="text-right">
                          {bairro.quantidade.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {bairro.mediaAltura.toFixed(1)}m
                        </TableCell>
                        <TableCell className="text-right">
                          {bairro.mediaDap.toFixed(1)}cm
                        </TableCell>
                        <TableCell>
                          {bairro.topEspecies[0]?.nome || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="text-blue-600" />
                    Quantidade por Bairro (Top 10)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground pt-2">
                    Visualização dos 10 bairros com maior número de árvores
                    registradas.
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="bairro"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="quantidade" fill="#10b981" name="Árvores" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="text-amber-600" />
                    Distribuição por Porte
                  </CardTitle>
                  <p className="text-sm text-muted-foreground pt-2">
                    Classificação das árvores com base em seu porte (tamanho).
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={porteData}
                        dataKey="quantidade"
                        nameKey="porte"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {porteData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PLOT_COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trees className="text-sky-600" />
                    Top 10 Espécies Mais Comuns
                  </CardTitle>
                  <p className="text-sm text-muted-foreground pt-2">
                    Ranking das 10 espécies de árvores mais encontradas na
                    cidade.
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={especiesData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="especie" type="category" width={250} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="quantidade"
                        fill="#10b981"
                        name="Quantidade"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
