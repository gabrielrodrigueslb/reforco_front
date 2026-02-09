'use client';
import {
  Users,
  LogOut,
  CalendarCheck,
  GraduationCap,
  Calendar,
  FileText,
  Bell,
  ChevronRight,
  X,
  LayoutDashboard,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import LogoutModal from './logoutModal';
import { cn } from '@/lib/utils';
import { getSession } from '@/lib/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


interface User {
    id: string;
    name: string;
    avatarUrl: string;
    role: string;
    email: string;
  }

export default function Sidebar({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [openModalLogout, setOpenModalLogout] = useState(false);

  const toggleModalLogout = () => {
    setOpenModalLogout(!openModalLogout);
  };

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

  const baseUrl =
    process.env.NEXT_PUBLIC_URLBASE_UPLOAD || 'http://localhost:4457';

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, page: '/main' },
    { name: 'Alunos', icon: Users, page: '/main/alunos' },
    { name: 'Frequência', icon: CalendarCheck, page: '/main/chamada' },
    // Boletim removido (agora integrado na ficha do aluno)
    { name: 'Turmas', icon: GraduationCap, page: '/main/turmas' },
    { name: 'Calendário', icon: Calendar, page: '/main/calendario' },
    { name: 'Documentos', icon: FileText, page: '/main/documentos' },
    { name: 'Avisos', icon: Bell, page: '/main/avisos' },
  ];
  return (
    <>
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => onOpenChange(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 h-screen w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-50 flex flex-col',
          'lg:static lg:h-dvh lg:translate-x-0 transition-transform duration-300',
          open ? 'translate-x-0 sidebar-animate' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-(--brand-gradient-from) to-(--brand-gradient-to) flex items-center justify-center shadow-lg shadow-[0_12px_25px_-10px_var(--sidebar-glow)] overflow-hidden border border-sidebar-border">
              <Image src="/logo.png" alt="logo dri" width={40} height={40} />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-primary-foreground">Adriana Oliveira</h1>
              <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="lg:hidden p-2 hover:bg-sidebar-accent rounded-lg"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.page;
              const Icon = item.icon;

              return (
                <Link
                  key={item.page}
                  href={item.page}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                    isActive
                      ? 'bg-linear-to-r from-(--brand-gradient-from) to-(--brand-gradient-to) text-sidebar-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-transform group-hover:scale-110',
                      isActive ? 'text-sidebar-primary-foreground' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground',
                    )}
                  />
                  <span className="font-medium">{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        {user && (
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex flex-1 items-center gap-3 p-3 rounded-xl bg-sidebar-accent text-left transition-colors hover:bg-sidebar-border">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-(--brand-gradient-from-light) to-(--brand-gradient-to-light) flex items-center justify-center text-white font-semibold overflow-hidden">
                      <img src={`${baseUrl}${user.avatarUrl}`|| "/globo.png"} alt="" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sidebar-foreground truncate">
                        {user.name || 'Usuário'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-54">
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      router.push('/main/profile');
                    }}
                  >
                    Editar perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={toggleModalLogout}>
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            </div>
          </div>
        )}
      </aside>

      <div className="fixed top-0 left-0 z-50">
              {openModalLogout && (
                <LogoutModal toggleModalLogout={toggleModalLogout} />
              )}
            </div>
    </>
  );
}



