// Global types for the application

// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

// Common component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

// Data types (based on actual usage in the app)
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

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface KPI {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
}