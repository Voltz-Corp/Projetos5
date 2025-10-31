import "./styles/global.css";

import { Toaster, Toaster as Sonner } from "@/components/ui";
import { createRoot } from "react-dom/client";
import { Suspense, lazy } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { IncidentsProvider } from "@/contexts";
import { Header, PageLoader } from "@/components";

// Create a stable QueryClient instance with localStorage persistence
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Custom persistence logic will be handled in individual hooks
    },
  },
});

// Lazy load pages for better performance
const Index = lazy(() => import("@/pages/Index"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Relatorios = lazy(() => import("@/pages/Relatorios"));
const Chamados = lazy(() => import("@/pages/Chamados"));

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <IncidentsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Header />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/chamados" element={<Chamados />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </IncidentsProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
