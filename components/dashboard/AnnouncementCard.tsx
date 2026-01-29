import { AlertCircle, Info, Bell, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Announcement } from '@/types/dashboard';

/* ----------------------------------
 * TIPAGENS
 * ---------------------------------- */

type PriorityLabel = 'Alta' | 'Normal' | 'Baixa';

interface AnnouncementCardProps {
  announcements: Announcement[];
}

type PriorityConfig = {
  icon: LucideIcon;
  bg: string;
  border: string;
  text: string;
};

const priorityConfig: Record<PriorityLabel, PriorityConfig> = {
  Alta: {
    icon: AlertCircle,
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-600',
  },
  Normal: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-600',
  },
  Baixa: {
    icon: Bell,
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-600',
  },
};

/* ----------------------------------
 * COMPONENTE
 * ---------------------------------- */

export default function AnnouncementCard({
  announcements,
}: AnnouncementCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <h3 className="font-semibold text-slate-800 mb-4">
        Avisos Importantes
      </h3>

      {announcements.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>Nenhum aviso no momento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.slice(0, 3).map((announcement: Announcement) => {
            const config =
              priorityConfig[
                announcement.priority as PriorityLabel
              ] ?? priorityConfig.Normal;

            const Icon = config.icon;

            return (
              <div
                key={announcement.id}
                className={cn(
                  'p-4 rounded-xl border transition-all hover:scale-[1.01]',
                  config.bg,
                  config.border,
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn('w-5 h-5 mt-0.5', config.text)} />

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-800 truncate">
                      {announcement.title}
                    </h4>

                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                      {announcement.content}
                    </p>

                    <p className="text-xs text-slate-400 mt-2">
                      {(() => {
                        const rawDate = announcement.date;

                        if (!rawDate || typeof rawDate !== 'string') {
                          return 'Data não informada';
                        }

                        const date = parseISO(rawDate);

                        return isValid(date)
                          ? format(date, "dd 'de' MMMM", {
                              locale: ptBR,
                            })
                          : 'Data inválida';
                      })()}
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
