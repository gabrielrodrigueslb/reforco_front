import { api } from '@/lib/api';
import { Announcement } from '@/types/dashboard';

export const AnnouncementsService = {
  list: async (): Promise<Announcement[]> => {
    const { data } = await api.get<Announcement[]>('/avisos');
    return data;
  },
  create: async (payload: Omit<Announcement, 'id'>) => {
    const { data } = await api.post<Announcement>('/avisos', payload);
    return data;
  },
  update: async (id: string, payload: Partial<Announcement>) => {
    const { data } = await api.put<Announcement>(`/avisos/${id}`, payload);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/avisos/${id}`);
  },
};
