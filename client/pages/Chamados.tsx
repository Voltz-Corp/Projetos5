import { useEffect, useMemo, useState } from "react";
import { fetchIncidents, Incident } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { download } from "@/lib/export";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useSearchParams } from "react-router-dom";
import "@/lib/leaflet";
import L from "leaflet";

function iconFor(inc: { type: string; status: string }) {
  // Intelligent icon using DivIcon: status color + emoji per type
  const emoji = inc.type === "poda" ? "✂️" : inc.type === "risco" ? "⚠️" : "🌳";
  let bg: string;
  if (inc.status === "aberto") bg = "#ef4444"; // red open
  else if (inc.status === "em_analise") bg = "#2563eb"; // blue in analysis
  else bg = "#10b981"; // green closed
  const html = `
    <div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:${bg};color:white;box-shadow:0 1px 4px rgba(0,0,0,.4);font-size:16px;">
      <span>${emoji}</span>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [28, 28], iconAnchor: [14, 14] });
}

function phoneFor(id: string) {
  // deterministic optional phone based on id
  const n = Number(id) % 10;
  if (n < 5) return undefined;
  const rand = (10000000 + (Number(id) * 7919) % 90000000).toString();
  const nine = rand.slice(0, 1);
  const rest = rand.slice(1, 8);
  return `(81) 9${nine}${rest.slice(0,4)}-${rest.slice(4,8)}`;
}

function descricao(inc: Incident) {
  const base = inc.type === "poda"
    ? "Poda solicitada: galhos próximos à fiação e fachada."
    : inc.type === "risco"
    ? "Risco de queda: tronco comprometido após ventos fortes."
    : "Árvore caída obstruindo via/ passeio, necessidade de remoção.";
  return `${base} Local: ${inc.bairro}.`;
}

function attachmentsFor(inc: Incident) {
  return [{ src: inc.image, alt: `${inc.type} incident` }];
}

type Row = {
  id: string;
  tipo: Incident["type"];
  status: Incident["status"];
  descricao: string;
  local: string;
  lat: number;
  lng: number;
  telefone?: string;
  dataHora: string;
  image: string;
};

function buildRows(incidents: Incident[]): Row[] {
  return incidents.map((i) => ({
    id: i.id,
    tipo: i.type,
    status: i.status,
    descricao: descricao(i),
    local: i.bairro,
    lat: i.lat,
    lng: i.lng,
    image: i.image,
    telefone: phoneFor(i.id),
    dataHora: new Date(i.createdAt as any).toLocaleString("pt-BR"),
  }));
}

function exportChamadosCSV(rows: Row[]) {
  const headers = ["id","tipo","status","descricao","local","telefone","dataHora"];
  const lines = [headers.join(","), ...rows.map(r => [r.id, r.tipo, r.status, r.descricao, r.local, r.telefone ?? "", r.dataHora].map((v)=>{
    const s = String(v);
    return s.includes(",") ? `"${s.replace(/"/g,'""')}"` : s;
  }).join(","))].join("\n");
  download("chamados.csv", lines, "text/csv");
}

function exportChamadosJSON(rows: Row[]) {
  download("chamados.json", JSON.stringify(rows, null, 2), "application/json");
}

export default function Chamados() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchIncidents()
      .then(setIncidents)
      .finally(() => setLoading(false));
  }, []);

  const rowsAll = useMemo(() => buildRows(incidents), [incidents]);

  // Detect URL parameter for auto-opening modal
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && rowsAll.length > 0) {
      const row = rowsAll.find(r => r.id === id);
      if (row) {
        setSelected(row);
        setOpen(true);
      }
    }
  }, [searchParams, rowsAll]);

  const [query, setQuery] = useState("");
  const [tipo, setTipo] = useState<string>("todos");
  const [status, setStatus] = useState<string>("todos");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);

  const rows = useMemo(() => {
    return rowsAll.filter((r) => {
      const matchesQuery = query
        ? (r.descricao + " " + r.local + " " + (r.telefone ?? "")).toLowerCase().includes(query.toLowerCase())
        : true;
      const matchesTipo = tipo === "todos" ? true : r.tipo === (tipo as any);
      const matchesStatus = status === "todos" ? true : r.status === (status as any);
      return matchesQuery && matchesTipo && matchesStatus;
    });
  }, [rowsAll, query, tipo, status]);

  const tipoPill = (t: Row["tipo"]) => {
    const emoji = t === "poda" ? "✂️" : t === "risco" ? "⚠️" : "🌳";
    return (
      <Badge className={cn(
        "capitalize",
        t === "poda" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
        t === "risco" && "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
        t === "queda" && "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200",
      )}>{emoji} {t}</Badge>
    );
  };

  const statusPill = (s: Row["status"]) => {
    const label = s === "em_analise" ? "Em Análise" : s === "aberto" ? "Aberto" : "Concluído";
    return (
      <Badge className={cn(
        s === "aberto" && "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200",
        s === "em_analise" && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
        s === "concluido" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
      )}>{label}</Badge>
    );
  };

  const rowTint = (t: Row["tipo"]) =>
    cn(
      "cursor-pointer hover:scale-[1.001] transition-colors",
      t === "poda" && "hover:bg-emerald-50 dark:hover:bg-emerald-900/10",
      t === "risco" && "hover:bg-amber-50 dark:hover:bg-amber-900/10",
      t === "queda" && "hover:bg-sky-50 dark:hover:bg-sky-900/10",
    );

  function LocationMap({ lat, lng, type, status }: { lat: number; lng: number; type: string; status: string }) {
    return (
      <div className="w-full h-56 rounded-md overflow-hidden border">
        {/* @ts-ignore */}
        <MapContainer key={`${lat},${lng}`} center={[lat, lng]} zoom={16} scrollWheelZoom={false} className="w-full h-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]} icon={iconFor({ type, status })} />
        </MapContainer>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container py-8 space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Chamados dos Moradores</h1>
          <p className="text-muted-foreground max-w-3xl">Acompanhe as reclamações com descrição, local, data/hora, telefone (opcional) e tipo.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Filtros e Ações</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3 items-center w-full md:w-auto">
              <Input placeholder="Buscar por texto, local ou telefone" value={query} onChange={(e)=>setQuery(e.target.value)} className="w-full md:w-80" />
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="poda">Poda</SelectItem>
                  <SelectItem value="risco">Risco</SelectItem>
                  <SelectItem value="queda">Queda</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => exportChamadosCSV(rows)}>Exportar CSV</Button>
              <Button variant="secondary" onClick={() => exportChamadosJSON(rows)}>Exportar JSON</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Data / Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={r.id} className={rowTint(r.tipo)} onClick={() => { setSelected(r); setOpen(true); }} role="button">
                        <TableCell className="whitespace-nowrap">{tipoPill(r.tipo)}</TableCell>
                        <TableCell className="whitespace-nowrap">{statusPill(r.status)}</TableCell>
                        <TableCell className="min-w-[360px]">{r.descricao}</TableCell>
                        <TableCell className="whitespace-nowrap">{r.local}</TableCell>
                        <TableCell className="whitespace-nowrap">{r.telefone ?? "—"}</TableCell>
                        <TableCell className="whitespace-nowrap">{r.dataHora}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Chamado</DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {tipoPill(selected.tipo)}
                  {statusPill(selected.status)}
                  <span className="text-sm text-muted-foreground">{selected.dataHora} · {selected.local}</span>
                </div>
                <p className="text-sm leading-relaxed">{selected.descricao}</p>
                <div className="text-sm">
                  <b>Telefone:</b> {selected.telefone ?? "Não informado"}
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Localização</div>
                  <LocationMap lat={selected.lat} lng={selected.lng} type={selected.tipo} status={selected.status} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <img key={selected.image} src={selected.image} alt={selected.alt} className="rounded-md w-full h-28 object-cover" />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
