'use client';

import { getSession } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { FormatRole } from '@/lib/utils';
import { NavUser } from './nav-user';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton'; // Importe o Skeleton
import { usePathname } from 'next/navigation';
import { count } from 'console';

interface User {
  id: string;
  name: string;
  avatarUrl: string;
  role: string;
  email: string;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const pathname = usePathname();

  useEffect(() => {
    async function getMe() {
      try {
        const me = await getSession();

        if (!me) {
          console.log('Usuário não autenticado');
          return;
        }

        setUser(me);
      } catch {
        console.log('Erro ao buscar dados do usuário');
      } finally {
        setTimeout(() => {
          setLoadingAuth(false);
        }, 105);
      }
    }

    getMe();
  }, []);

  const pathnameFormatted = pathname.split('/').filter(Boolean).pop() || 'main';

  const getTitle = () => {
    const key = pathnameFormatted.toLowerCase();

    switch (key) {
      case 'main':
        return 'Início';
      case 'chamada':
        return 'Chamada';
      case 'alunos':
        return 'Alunos';
        case 'profile':
        return 'Meu Perfil';
      default:
        // Ex: "/main/financeiro" vira "Financeiro"
        return key.charAt(0).toUpperCase() + key.slice(1);
    }
  };

  const title = getTitle();

  return (
    <>
      <header className="pb-4 mb-4 border-b-2 flex justify-between items-center animate-in fade-in duration-100">
        <h1 className="text-3xl font-bold opacity-80">{title}</h1>

        {/* Envolvemos tudo no SidebarProvider para manter contexto se necessário */}
        <SidebarProvider className="w-auto min-h-0 min-w-0 flex items-center animate-in fade-in duration-100">
          {loadingAuth ? (
            /* --- INICIO DO SKELETON --- */
            <div className="flex items-center gap-1 px-2 py-1">
              {/* Esqueleto do Texto (Nome e Email) */}
              <div className="hidden md:flex flex-col gap-1.5">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-3 w-12 rounded-md self-end" />
              </div>

              {/* Esqueleto do Avatar (Bolinha) */}
              <Skeleton className="h-10 w-10 rounded-full" />

              {/* Esqueleto do ícone de seta (opcional) */}
              <Skeleton className="h-5 w-4 ml-1 rounded-sm" />
            </div>
          ) : (
            /* --- FIM DO SKELETON --- */
            user && <NavUser user={user} />
          )}
        </SidebarProvider>
      </header>

      <div className=""></div>
    </>
  );
}
