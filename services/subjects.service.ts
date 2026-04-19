import { api } from '@/lib/api'
import { DEFAULT_SUBJECTS, mergeSubjects, sortSubjects } from '@/lib/subjects'

type SubjectResponse = {
  id: string
  name: string
}

export const SubjectsService = {
  list: async (): Promise<string[]> => {
    try {
      const { data } = await api.get<SubjectResponse[]>('/subjects')
      const names = data.map((subject) => subject.name).filter(Boolean)
      return sortSubjects(mergeSubjects(names))
    } catch {
      return [...DEFAULT_SUBJECTS]
    }
  },

  create: async (name: string): Promise<string> => {
    const trimmed = String(name || '').trim()
    if (!trimmed) throw new Error('Nome da materia e obrigatorio')
    const { data } = await api.post<SubjectResponse>('/subjects', {
      name: trimmed,
    })
    return data.name
  },
}
