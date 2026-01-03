import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    // CORREÇÃO: bg-gradient-to-br -> bg-linear-to-br (conforme sugestão do seu linter/Tailwind v4)
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-background dark:to-muted p-5">
      <Image
        src="/404.png"
        width={440} // Adjust width as needed
        height={330} // Adjust height as needed
        className="w-80 sm:w-110 mb-6"
        alt="Erro 404"
        priority
      />

      <h2 className="text-xl font-semibold text-slate-700 dark:text-muted-foreground mb-4">
        Página não encontrada
      </h2>

      <p className="text-slate-600 dark:text-muted-foreground mb-8 leading-relaxed text-center">
        {/* CORREÇÃO: Aspas escapadas */}A página que você está procurando não
        existe ou foi movida. Verifique o URL ou retorne à página inicial.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors w-full sm:w-auto">
            <Home className="w-4 h-4 mr-2" />
            Retornar para a página inicial
          </Button>
        </Link>
      </div>
    </div>
  );
}
