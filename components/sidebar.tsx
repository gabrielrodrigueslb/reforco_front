'use client';
import {
  Users,
  LogOut,
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  GraduationCap,
  Calendar,
  FileText,
  ChevronRight,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import LogoutModal from './logoutModal';
import { cn } from '@/lib/utils';
import { getSession } from '@/lib/auth';


interface User {
    id: string;
    name: string;
    avatarUrl: string;
    role: string;
    email: string;
  }

export default function Sidebar() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    { name: 'Boletins', icon: BookOpen, page: 'Grades' },
    { name: 'Turmas', icon: GraduationCap, page: '/main/turmas' },
    { name: 'Calendário', icon: Calendar, page: '/main/calendario' },
    { name: 'Documentos', icon: FileText, page: '/main/documentos' },
  ];
  return (
    <>
      <aside
        className={cn(
          'h-screen max-h-screen w-72 bg-white border-r border-slate-200 z-50 flex flex-col',
          'lg:translate-x-0 transition-transform duration-300',
          sidebarOpen ? 'translate-x-0 sidebar-animate' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 overflow-hidden border-black border">
              <Image src="/logo.png" alt="logo dri" width={40} height={40} />
            </div>
            <div>
              <h1 className="font-bold text-slate-800">Adriana Oliveira</h1>
              <p className="text-xs text-slate-500">Sistema de Gestão</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5 text-slate-500" />
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
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                    isActive
                      ? 'bg-linear-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200'
                      : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-transform group-hover:scale-110',
                      isActive ? 'text-white' : 'text-slate-500',
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
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                <img src={`${baseUrl}${user.avatarUrl}`} alt="" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">
                  {user.name || 'Usuário'}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={toggleModalLogout}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Sair"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
              </button>
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
