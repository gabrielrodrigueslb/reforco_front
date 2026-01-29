import { classesMock, ClassItem } from '@/types/classes'

let classes = [...classesMock]

export const ClassesService = {
  list: async (): Promise<ClassItem[]> => {
    await delay()
    return classes.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  },

  create: async (data: Omit<ClassItem, 'id' | 'created_at'>) => {
    await delay()
    const newClass: ClassItem = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }
    classes.push(newClass)
    return newClass
  },

  update: async (id: string, data: Partial<ClassItem>) => {
    await delay()
    classes = classes.map((c) =>
      c.id === id ? { ...c, ...data } : c
    )
    return classes.find((c) => c.id === id)
  },

  delete: async (id: string) => {
    await delay()
    classes = classes.filter((c) => c.id !== id)
    return true
  },
}

function delay(ms = 400) {
  return new Promise((res) => setTimeout(res, ms))
}
