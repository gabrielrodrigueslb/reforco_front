import React from 'react';
import { AlertCircle, Info, Bell } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AnnouncementCard({ announcements }) {
  const priorityConfig = {
    Alta: { icon: AlertCircle, bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600' },
    Normal: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
    Baixa: { icon: Bell, bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600' },
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <h3 className="font-semibold text-slate-800 mb-4">Avisos Importantes</h3>
      
      {announcements.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>Nenhum aviso no momento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.slice(0, 3).map((announcement) => {
            const config = priorityConfig[announcement.priority] || priorityConfig.Normal;
            const Icon = config.icon;
            
            return (
              <div 
                key={announcement.id}
                className={cn(
                  "p-4 rounded-xl border transition-all hover:scale-[1.01]",
                  config.bg,
                  config.border
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn("w-5 h-5 mt-0.5", config.text)} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-800 truncate">{announcement.title}</h4>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{announcement.content}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {format(new Date(announcement.created_date), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}