import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { EventItem } from '@/types/dashboard';

/* ----------------------------------
 * TIPAGENS
 * ---------------------------------- */

type EventType =
  | 'Aula Especial'
  | 'Reunião'
  | 'Prova'
  | 'Evento'
  | 'Feriado'
  | 'Outro';

interface UpcomingEventsProps {
  events: EventItem[];
}

const eventTypeColors: Record<EventType, string> = {
  'Aula Especial': 'bg-indigo-100 text-indigo-600',
  Reunião: 'bg-amber-100 text-amber-600',
  Prova: 'bg-rose-100 text-rose-600',
  Evento: 'bg-emerald-100 text-emerald-600',
  Feriado: 'bg-purple-100 text-purple-600',
  Outro: 'bg-slate-100 text-slate-600',
};

/* ----------------------------------
 * COMPONENTE
 * ---------------------------------- */

export default function UpcomingEvents({
  events,
}: UpcomingEventsProps) {
  const getDateLabel = (date: string): string => {
    const eventDate = parseISO(date);

    if (isToday(eventDate)) return 'Hoje';
    if (isTomorrow(eventDate)) return 'Amanhã';

    return format(eventDate, "dd 'de' MMM", { locale: ptBR });
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">
          Próximos Eventos
        </h3>
        <Calendar className="w-5 h-5 text-slate-400" />
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>Nenhum evento agendado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.slice(0, 5).map((event: EventItem) => {
            const type =
              (event.event_type as EventType) ?? 'Outro';

            return (
              <div
                key={event.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div
                  className="w-1 h-12 rounded-full"
                  style={{
                    backgroundColor:
                      event.color ?? '#6366f1',
                  }}
                />

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-800 truncate">
                    {event.title}
                  </h4>

                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        eventTypeColors[type],
                      )}
                    >
                      {type}
                    </span>

                    {event.start_time && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.start_time}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium text-indigo-600">
                    {getDateLabel(event.date)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
