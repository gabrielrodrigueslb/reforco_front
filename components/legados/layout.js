import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus,
  CalendarCheck,
  BookOpen,
  GraduationCap,
  Calendar,
  FileText,
  Upload,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Bell
} from 'lucide-react';
import { cn } from "@/lib/utils";

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Alunos', icon: Users, page: 'Students' },
  { name: 'Novo Aluno', icon: UserPlus, page: 'StudentForm' },
  { name: 'Frequência', icon: CalendarCheck, page: 'Attendance' },
  { name: 'Boletins', icon: BookOpen, page: 'Grades' },
  { name: 'Turmas', icon: GraduationCap, page: 'Classes' },
  { name: 'Calendário', icon: Calendar, page: 'CalendarPage' },
  { name: 'Documentos', icon: FileText, page: 'Documents' },
  { name: 'Importar', icon: Upload, page: 'ImportStudents' },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        // User not logged in
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --primary: 234 89% 74%;
          --primary-foreground: 0 0% 100%;
        }
        
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .sidebar-animate {
          animation: slideIn 0.3s ease-out;
        }
        
        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 px-4 flex items-center justify-between">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Menu className="w-6 h-6 text-slate-700" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-slate-800">EduReforço</span>
        </div>
        <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors relative">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
        </button>
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-200 z-50 flex flex-col",
        "lg:translate-x-0 transition-transform duration-300",
        sidebarOpen ? "translate-x-0 sidebar-animate" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800">EduReforço</h1>
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
              const isActive = currentPageName === item.page;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive 
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200" 
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-slate-500"
                  )} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        {user && (
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{user.full_name || 'Usuário'}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        "lg:ml-72",
        "pt-16 lg:pt-0"
      )}>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}