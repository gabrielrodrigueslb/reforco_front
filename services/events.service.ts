import { api } from '@/lib/api';
import { EventItem } from '@/types/dashboard';

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  date: string;
  start_time?: string;
  end_time?: string;
  color?: string;
};

export const EventsService = {
  list: async (params?: { from?: string; to?: string }) => {
    const { data } = await api.get<CalendarEvent[]>('/eventos', { params });
    return data;
  },
  create: async (payload: Omit<CalendarEvent, 'id'>) => {
    const { data } = await api.post<CalendarEvent>('/eventos', payload);
    return data;
  },
  update: async (id: string, payload: Partial<CalendarEvent>) => {
    const { data } = await api.put<CalendarEvent>(`/eventos/${id}`, payload);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/eventos/${id}`);
  },
  toDashboard: (event: CalendarEvent): EventItem => ({
    id: event.id,
    title: event.title,
    date: event.date,
    event_type: event.event_type as EventItem['event_type'],
    start_time: event.start_time,
    color: event.color,
  }),
};
