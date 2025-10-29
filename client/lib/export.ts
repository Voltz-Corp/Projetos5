import { Incident } from "@/lib/data";

export function toCSV(incidents: Incident[]) {
  const headers = [
    "id",
    "tipo",
    "status",
    "bairro",
    "lat",
    "lng",
    "createdAt",
    "resolvedAt",
  ];
  const rows = incidents.map((i) => [
    i.id,
    i.type,
    i.status,
    i.bairro,
    i.lat,
    i.lng,
    new Date(i.createdAt).toISOString(),
    i.resolvedAt ? new Date(i.resolvedAt).toISOString() : "",
  ]);
  return [headers, ...rows]
    .map((r) => r.map((v) => (typeof v === "string" && v.includes(",") ? `"${v.replace(/"/g, '""')}"` : String(v))).join(","))
    .join("\n");
}

export function download(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportCSV(incidents: Incident[], filename = "incidentes.csv") {
  download(filename, toCSV(incidents), "text/csv");
}

export function exportJSON(incidents: Incident[], filename = "incidentes.json") {
  download(filename, JSON.stringify(incidents, null, 2), "application/json");
}

export function exportPDF() {
  window.print(); // Use dialog to save as PDF with print styles
}
