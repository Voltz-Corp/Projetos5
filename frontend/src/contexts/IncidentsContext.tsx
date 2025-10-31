import React, { createContext, useContext, ReactNode } from 'react';
import { Incident } from '@/types';
import { useIncidents as useIncidentsQuery } from '@/hooks/use-incidents';

interface IncidentsContextType {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const IncidentsContext = createContext<IncidentsContextType | undefined>(undefined);

interface IncidentsProviderProps {
  children: ReactNode;
}

export const IncidentsProvider: React.FC<IncidentsProviderProps> = ({ children }) => {
  const {
    data: incidents = [],
    isLoading: loading,
    error,
    refetch
  } = useIncidentsQuery();

  const value: IncidentsContextType = {
    incidents,
    loading,
    error: error?.message || null,
    refetch,
  };

  return (
    <IncidentsContext.Provider value={value}>
      {children}
    </IncidentsContext.Provider>
  );
};

export const useIncidents = (): IncidentsContextType => {
  const context = useContext(IncidentsContext);
  if (context === undefined) {
    throw new Error('useIncidents must be used within an IncidentsProvider');
  }
  return context;
};