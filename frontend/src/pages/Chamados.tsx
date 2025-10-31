import { useEffect, useMemo, useState } from "react";
import { Incident } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { download } from "@/lib/export";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useSearchParams } from "react-router-dom";
import { useIncidents } from "@/contexts/IncidentsContext";
import { useUpdateIncident } from "@/hooks/use-update-incident";
import { useDeleteIncident } from "@/hooks/use-delete-incident";
import { useToast } from "@/hooks/use-toast";
import { IncidentStatus } from "@/types";
import { MessageSquare, Filter, FileDown } from "lucide-react";
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
  const { incidents, loading, error } = useIncidents();
  const { mutate: updateIncident, isPending: isUpdating } = useUpdateIncident();
  const { mutate: deleteIncident, isPending: isDeleting } = useDeleteIncident();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const rowsAll = useMemo(() => buildRows(incidents), [incidents]);

  // Detect URL parameter for auto-opening modal
  useEffect(() => {
    const id = searchParams.get('id');

    if (id && !loading && incidents.length > 0) {
      const incident = incidents.find(i => String(i.id) === id);

      if (incident) {
        const row = buildRows([incident])[0];
        setSelected(row);
        setOpen(true);
      } else {
      }
    }
  }, [searchParams, incidents, loading]);

  const [query, setQuery] = useState("");
  const [tipo, setTipo] = useState<string>("todos");
  const [status, setStatus] = useState<string>("todos");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
      <Badge className="capitalize bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
        {emoji} {t}
      </Badge>
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

  const rowTint = (s: Row["status"], index: number) =>
    cn(
      "cursor-pointer transition-colors",
      index % 2 === 0 ? "bg-background" : "bg-slate-50 dark:bg-slate-900/20",
      s === "aberto" && "hover:bg-rose-50 dark:hover:bg-rose-900/10",
      s === "em_analise" && "hover:bg-blue-50 dark:hover:bg-blue-900/10",
      s === "concluido" && "hover:bg-emerald-50 dark:hover:bg-emerald-900/10",
    );

  const handleDelete = () => {
    if (!selected) return;
    
    deleteIncident(
      { id: selected.id },
      {
        onSuccess: () => {
          toast({
            title: "✅ Chamado excluído com sucesso",
            description: "O chamado foi removido do sistema.",
          });
          setDeleteDialogOpen(false);
          setOpen(false);
          setSelected(null);
        },
        onError: (error) => {
          toast({
            title: "❌ Erro ao excluir chamado",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  function LocationMap({ lat, lng, type, status }: { lat: number; lng: number; type: string; status: string }) {
    return (
      <div className="w-full h-80 rounded-md overflow-hidden border">
        {/* @ts-ignore */}
        <MapContainer key={`${lat},${lng}`} center={[lat, lng]} zoom={16} scrollWheelZoom={false} className="w-full h-full">
          <TileLayer
            // @ts-expect-error - Leaflet TileLayer attribution prop typing issue
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={[lat, lng]}
            // @ts-expect-error - Leaflet Marker icon prop typing issue
            icon={iconFor({ type, status })}
          />
        </MapContainer>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container py-8 space-y-8">
        <header className="space-y-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              Chamados dos Moradores
            </h1>
            <p className="text-muted-foreground max-w-3xl mt-2">
              Acompanhe as reclamações com descrição, local, data/hora, telefone (opcional) e tipo.
            </p>
          </div>
        </header>

        <Card className="bg-gradient-to-br from-blue-50/60 to-cyan-50/60 dark:from-blue-900/10 dark:to-cyan-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros e Ações
            </CardTitle>
            <CardDescription>
              Refine a visualização dos chamados e exporte os dados filtrados.
            </CardDescription>
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
              <Button onClick={() => exportChamadosCSV(rows)} className="gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar CSV
              </Button>
              <Button variant="secondary" onClick={() => exportChamadosJSON(rows)} className="gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Exportar JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-muted backdrop-blur-sm z-10">
                  <TableRow className="hover:bg-transparent">
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
                    rows.map((r, index) => (
                      <TableRow key={r.id} className={rowTint(r.status, index)} onClick={() => { setSelected(r); setOpen(true); }} role="button">
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
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-3 pb-4 border-b">
              <DialogTitle className="text-2xl font-bold">Detalhes do Chamado</DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                {selected && (
                  <>
                    {tipoPill(selected.tipo)}
                    {statusPill(selected.status)}
                    <span className="text-sm text-muted-foreground">ID: #{selected.id}</span>
                  </>
                )}
              </div>
            </DialogHeader>
            
            {selected && (
              <div className="space-y-6 pt-2">
                {/* Status Update Section - Destacado */}
                <div className={cn(
                  "p-5 rounded-xl border-2 shadow-sm bg-gradient-to-br",
                  selected.status === "aberto" && "from-rose-50/60 to-red-50/60 dark:from-rose-900/10 dark:to-red-900/10 border-rose-200/50 dark:border-rose-800/50",
                  selected.status === "em_analise" && "from-blue-50/60 to-cyan-50/60 dark:from-blue-900/10 dark:to-cyan-900/10 border-blue-200/50 dark:border-blue-800/50",
                  selected.status === "concluido" && "from-emerald-50/60 to-green-50/60 dark:from-emerald-900/10 dark:to-green-900/10 border-emerald-200/50 dark:border-emerald-800/50"
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      selected.status === "aberto" && "bg-rose-500",
                      selected.status === "em_analise" && "bg-blue-500",
                      selected.status === "concluido" && "bg-emerald-500"
                    )}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div className="text-base font-semibold text-foreground">Gerenciar Status</div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Select
                      value={selected.status}
                      onValueChange={(newStatus) => {
                        updateIncident(
                          { id: selected.id, status: newStatus as IncidentStatus },
                          {
                            onSuccess: () => {
                              toast({
                                title: "✅ Status atualizado com sucesso",
                                description: `O chamado foi alterado para ${
                                  newStatus === "aberto"
                                    ? "Aberto"
                                    : newStatus === "em_analise"
                                    ? "Em Análise"
                                    : "Concluído"
                                }`,
                              });
                              setSelected({ ...selected, status: newStatus as IncidentStatus });
                            },
                            onError: (error) => {
                              toast({
                                title: "❌ Erro ao atualizar status",
                                description: error.message,
                                variant: "destructive",
                              });
                            },
                          }
                        );
                      }}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-56 h-11 font-medium">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aberto" className="cursor-pointer">🔴 Aberto</SelectItem>
                        <SelectItem value="em_analise" className="cursor-pointer">🔵 Em Análise</SelectItem>
                        <SelectItem value="concluido" className="cursor-pointer">🟢 Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                    {isUpdating && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                        Atualizando...
                      </div>
                    )}
                  </div>
                </div>

                {/* Informações principais */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Coluna Esquerda - Informações */}
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Descrição
                      </div>
                      <p className="text-sm leading-relaxed bg-muted/30 p-4 rounded-lg border">
                        {selected.descricao}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Local
                        </div>
                        <p className="text-sm font-medium bg-muted/30 p-3 rounded-lg border">
                          {selected.local}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Telefone
                        </div>
                        <p className="text-sm font-medium bg-muted/30 p-3 rounded-lg border">
                          {selected.telefone ?? "Não informado"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Data / Hora
                      </div>
                      <p className="text-sm font-medium bg-muted/30 p-3 rounded-lg border">
                        {selected.dataHora}
                      </p>
                    </div>
                  </div>

                  {/* Coluna Direita - Imagem */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Foto do Chamado
                    </div>
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-muted shadow-lg group">
                      <img
                        src={selected.image}
                        alt={`${selected.tipo} - ${selected.descricao}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Mapa - Full Width */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Localização no Mapa
                  </div>
                  <div className="rounded-xl overflow-hidden border-2 border-muted shadow-lg">
                    <LocationMap lat={selected.lat} lng={selected.lng} type={selected.tipo} status={selected.status} />
                  </div>
                </div>

                {/* Botão de Excluir */}
                <div className="pt-4 border-t flex justify-end">
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={isDeleting}
                    className="gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Excluir Chamado
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Alert Dialog de Confirmação de Exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O chamado será permanentemente excluído do sistema.
                {selected && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium text-foreground">Chamado #{selected.id}</div>
                    <div className="text-sm text-muted-foreground">{selected.descricao}</div>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Excluindo...
                  </div>
                ) : (
                  "Excluir"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  );
}
