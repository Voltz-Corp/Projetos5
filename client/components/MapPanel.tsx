import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet.heat";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Incident } from "@/lib/data";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Fix default marker icons (Vite + Leaflet)
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

function HeatLayer({ points }: { points: Array<[number, number, number?]> }) {
  const map = useMap();
  useEffect(() => {
    const layer = (L as any).heatLayer(points, {
      radius: 18,
      blur: 16,
      maxZoom: 17,
      minOpacity: 0.35,
      gradient: {
        0.2: "#dbeafe",
        0.4: "#93c5fd",
        0.6: "#60a5fa",
        0.8: "#3b82f6",
        1.0: "#2563eb",
      },
    });
    layer.addTo(map);
    return () => {
      layer.remove();
    };
  }, [map, points]);
  return null;
}

function iconFor(inc: Incident) {
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

export type MapPanelProps = {
  incidents: Incident[];
};

export default function MapPanel({ incidents }: MapPanelProps) {
  const center: LatLngExpression = useMemo(() => [-8.05, -34.90], []);
  const heatPoints = useMemo(
    () => incidents.map((i) => [i.lat, i.lng, i.type === "risco" ? 0.9 : 0.6] as [number, number, number]),
    [incidents],
  );

  const [showHeat, setShowHeat] = useState(true);
  const [showClusters, setShowClusters] = useState(true);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border bg-card">
      <div className="flex items-center gap-4 p-3 border-b bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
        <h3 className="font-semibold text-foreground">Mapa de Inteligência</h3>
        <div className="ml-auto flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch id="heat" checked={showHeat} onCheckedChange={setShowHeat} />
            <Label htmlFor="heat" className="text-sm">Mapa de Calor</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="cluster" checked={showClusters} onCheckedChange={setShowClusters} />
            <Label htmlFor="cluster" className="text-sm">Clusterização</Label>
          </div>
        </div>
      </div>
      <div className={cn("w-full", "h-[520px]") }>
        <MapContainer center={center} zoom={12} scrollWheelZoom className="w-full h-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {showHeat && <HeatLayer points={heatPoints} />}
          {showClusters ? (
            <MarkerClusterGroup chunkedLoading disableClusteringAtZoom={16}>
              {incidents.map((inc) => (
                <Marker key={inc.id} position={[inc.lat, inc.lng]} icon={iconFor(inc)}>
                  <Tooltip direction="top" offset={[0, -12]} opacity={1} permanent={false}>
                    <div className="text-xs">
                      <div><b>{inc.type.toUpperCase()}</b> · {inc.status === "aberto" ? "Aberto" : "Concluído"}</div>
                      <div>{inc.bairro}</div>
                    </div>
                  </Tooltip>
                </Marker>
              ))}
            </MarkerClusterGroup>
          ) : (
            incidents.map((inc) => (
              <Marker key={inc.id} position={[inc.lat, inc.lng]} icon={iconFor(inc)} />
            ))
          )}
        </MapContainer>
      </div>
    </div>
  );
}
