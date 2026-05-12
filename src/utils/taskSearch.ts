import type { Task } from '@/types'

export const normalizeQuery = (raw: string): string =>
  raw.trim().replace(/^#/, '').toLowerCase()

const includesCI = (haystack: string | undefined | null, q: string): boolean =>
  !!haystack && haystack.toLowerCase().includes(q)

export const matchTaskText = (task: Task, normalizedQuery: string): boolean => {
  if (!normalizedQuery) return true
  if (includesCI(task.title, normalizedQuery)) return true
  if (includesCI(task.description, normalizedQuery)) return true
  if ((task.tags ?? []).some(tag => tag.toLowerCase().includes(normalizedQuery))) return true
  if ((task.subtasks ?? []).some(s => includesCI(s.text, normalizedQuery))) return true
  return false
}
