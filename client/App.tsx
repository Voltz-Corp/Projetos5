import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Relatorios from "./pages/Relatorios";
import Chamados from "./pages/Chamados";
import Placeholder from "./pages/Placeholder";

const queryClient = new QueryClient();

function Header() {
  return (
    <div className="border-b bg-white/70 dark:bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="container h-14 flex items-center gap-6">
        <Link to="/" className="font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
          Recife Inteligente
        </Link>
        <nav className="ml-auto flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Painel</Link>
          <Link to="/relatorios" className="hover:text-foreground">Relatórios</Link>
          <Link to="/chamados" className="hover:text-foreground">Chamados</Link>
        </nav>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/chamados" element={<Chamados />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
