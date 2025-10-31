import { Link } from "react-router-dom";

export function Header() {
  return (
    <div className="border-b bg-white/70 dark:bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="container h-14 flex items-center gap-6">
        <Link to="/" className="font-bold tracking-tight text-blue-600 dark:text-blue-400">
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