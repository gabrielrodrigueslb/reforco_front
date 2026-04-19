export const DEFAULT_SUBJECTS = [
  'Português',
  'Matemática',
  'Ciências',
  'História',
  'Geografia',
  'Inglês',
  'Artes',
  'Ed. Física',
]

export function normalizeSubject(value: string) {
  if (!value) return ''
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

export function mergeSubjects(...lists: string[][]) {
  const seen = new Set<string>()
  const result: string[] = []
  lists.flat().forEach((subject) => {
    const normalized = normalizeSubject(subject)
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    result.push(subject)
  })
  return result
}

export function sortSubjects(list: string[]) {
  return [...list].sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
  )
}

export function mapSubjectsToCanonical(
  values: string[] = [],
  subjects: string[] = [],
) {
  const map = new Map<string, string>()
  subjects.forEach((subject) => {
    map.set(normalizeSubject(subject), subject)
  })
  const mapped = values.map((value) => {
    const normalized = normalizeSubject(value)
    return map.get(normalized) || value
  })
  return mergeSubjects(mapped)
}

export function areSameSubjects(a: string[] = [], b: string[] = []) {
  if (a.length !== b.length) return false
  return a.every((value, index) => value === b[index])
}
