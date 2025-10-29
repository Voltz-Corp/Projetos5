import { Link } from "react-router-dom";

export default function Placeholder({ title = "Em breve" }: { title?: string }) {
  return (
    <main className="min-h-[60vh] container py-12">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground mb-6">
          Esta página é um espaço reservado. Diga-me o que você quer ver aqui e eu implemento.
        </p>
        <Link to="/" className="text-blue-600 hover:underline">Voltar ao painel</Link>
      </div>
    </main>
  );
}
