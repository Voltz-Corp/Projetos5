/**
 * Data types for the incidents management system.
 * All calculations are now performed in the backend via the /api/analytics endpoint.
 * This file only contains type definitions for the Incident entity.
 */

export type IncidentType = "poda" | "risco" | "queda";
export type IncidentStatus = "aberto" | "concluido" | "em_analise";

export interface Incident {
  id: string;
  type: IncidentType;
  status: IncidentStatus;
  bairro: string;
  lat: number;
  lng: number;
  createdAt: number | string;
  resolvedAt?: number | string;
  image: string;
}

