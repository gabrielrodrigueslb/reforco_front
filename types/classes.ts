export type ClassItem = {
  id: string
  name: string
  shift: string
  days_of_week: string[]
  start_time?: string
  end_time?: string
  status: 'Ativa' | 'Inativa'
  max_students: number
  created_at: string
}

export const classesMock: ClassItem[] = [
  {
    id: '1',
    name: 'Turma A - Reforço',
    shift: 'Manhã',
    days_of_week: ['Segunda', 'Quarta'],
    start_time: '08:00',
    end_time: '10:00',
    status: 'Ativa',
    max_students: 15,
    created_at: new Date().toISOString(),
  },
]
