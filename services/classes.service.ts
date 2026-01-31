import { api } from '@/lib/api'
import { ClassItem } from '@/types/classes'

export const ClassesService = {
  list: async (): Promise<ClassItem[]> => {
    const { data } = await api.get<ClassItem[]>('/turmas')
    return data
  },

  create: async (data: Omit<ClassItem, 'id' | 'created_at'>) => {
    const { data: created } = await api.post<ClassItem>('/turmas', data)
    return created
  },

  update: async (id: string, data: Partial<ClassItem>) => {
    const { data: updated } = await api.put<ClassItem>(`/turmas/${id}`, data)
    return updated
  },

  delete: async (id: string) => {
    await api.delete(`/turmas/${id}`)
    return true
  },
}
