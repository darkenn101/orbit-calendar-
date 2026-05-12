import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { addDays, endOfDay, isWithinInterval, startOfDay } from 'date-fns'
import { Timestamp } from 'firebase/firestore'
import type { Task } from '@/types'
import { matchTaskText, normalizeQuery } from '@/utils/taskSearch'
import { useTaskStore } from '@/stores/tasks'

export type StatusFilter = 'all' | 'pending' | 'completed'
export type DueDatePreset = 'all' | 'overdue' | 'today' | 'week' | 'custom'
export type SortBy = 'due' | 'created' | 'title' | 'manual'
export type SortDir = 'asc' | 'desc'

export interface DueDateFilter {
  preset: DueDatePreset
  from?: string | null
  to?: string | null
}

export interface PersistedFilters {
  statusFilter: StatusFilter
  projectFilters: (string | null)[]
  tagFilters: string[]
  dueDateFilter: DueDateFilter
  searchQuery: string
  sortBy: SortBy
  sortDir: SortDir
}

const STORAGE_PREFIX = 'orbit:tasks:filters:'

const defaults = (): PersistedFilters => ({
  statusFilter: 'all',
  projectFilters: [],
  tagFilters: [],
  dueDateFilter: { preset: 'all' },
  searchQuery: '',
  sortBy: 'due',
  sortDir: 'asc',
})

const load = (key?: string): PersistedFilters => {
  if (!key || typeof window === 'undefined') return defaults()
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key)
    if (!raw) return defaults()
    const parsed = JSON.parse(raw) as Partial<PersistedFilters>
    return { ...defaults(), ...parsed, dueDateFilter: { ...defaults().dueDateFilter, ...(parsed.dueDateFilter ?? {}) } }
  } catch {
    return defaults()
  }
}

const parseDateInput = (s: string | null | undefined): Date | null => {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

export interface UseTaskFiltersOptions {
  source: ComputedRef<Task[]> | Ref<Task[]>
  persistKey?: string
}

export const useTaskFilters = (opts: UseTaskFiltersOptions) => {
  const taskStore = useTaskStore()
  const initial = load(opts.persistKey)

  const statusFilter = ref<StatusFilter>(initial.statusFilter)
  const projectFilters = ref<Set<string | null>>(new Set(initial.projectFilters))
  const tagFilters = ref<Set<string>>(new Set(initial.tagFilters))
  const dueDateFilter = ref<DueDateFilter>(initial.dueDateFilter)
  const searchQuery = ref<string>(initial.searchQuery)
  const sortBy = ref<SortBy>(initial.sortBy)
  const sortDir = ref<SortDir>(initial.sortDir)

  const filteredTasks = computed(() => {
    const q = normalizeQuery(searchQuery.value)
    const window = resolveDueWindow(dueDateFilter.value)
    const tags = tagFilters.value
    const projects = projectFilters.value
    const projectActive = projects.size > 0
    const tagsActive = tags.size > 0

    return opts.source.value.filter(t => {
      if (statusFilter.value !== 'all' && t.status !== statusFilter.value) return false
      if (projectActive) {
        const pid = t.projectId ?? null
        if (!projects.has(pid)) return false
      }
      if (tagsActive) {
        const taskTags = t.tags ?? []
        if (!taskTags.some(tag => tags.has(tag))) return false
      }
      if (!inDueWindow(t, window)) return false
      if (q && !matchTaskText(t, q)) return false
      return true
    })
  })

  const sortedTasks = computed(() => {
    const list = filteredTasks.value.slice()
    const dir = sortDir.value === 'asc' ? 1 : -1
    switch (sortBy.value) {
      case 'manual':
        list.sort((a, b) => taskStore.sortKey(a) - taskStore.sortKey(b))
        break
      case 'due':
        list.sort((a, b) => ((a.due_date?.toMillis() ?? 0) - (b.due_date?.toMillis() ?? 0)) * dir)
        break
      case 'created':
        list.sort((a, b) => ((a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0)) * dir)
        break
      case 'title':
        list.sort((a, b) => a.title.localeCompare(b.title) * dir)
        break
    }
    return list
  })

  const activeFilterCount = computed(() => {
    let n = 0
    if (statusFilter.value !== 'all') n++
    if (projectFilters.value.size) n++
    if (tagFilters.value.size) n++
    if (dueDateFilter.value.preset !== 'all') n++
    if (searchQuery.value.trim()) n++
    return n
  })

  const toggleProject = (id: string | null) => {
    const next = new Set(projectFilters.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    projectFilters.value = next
  }

  const toggleTag = (tag: string) => {
    const next = new Set(tagFilters.value)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    tagFilters.value = next
  }

  const setDuePreset = (preset: DueDatePreset, range?: { from?: Date; to?: Date }) => {
    dueDateFilter.value = {
      preset,
      from: range?.from ? range.from.toISOString() : null,
      to: range?.to ? range.to.toISOString() : null,
    }
  }

  const reset = () => {
    const d = defaults()
    statusFilter.value = d.statusFilter
    projectFilters.value = new Set()
    tagFilters.value = new Set()
    dueDateFilter.value = d.dueDateFilter
    searchQuery.value = d.searchQuery
    sortBy.value = d.sortBy
    sortDir.value = d.sortDir
  }

  const persist = () => {
    if (!opts.persistKey || typeof window === 'undefined') return
    const payload: PersistedFilters = {
      statusFilter: statusFilter.value,
      projectFilters: Array.from(projectFilters.value),
      tagFilters: Array.from(tagFilters.value),
      dueDateFilter: dueDateFilter.value,
      searchQuery: searchQuery.value,
      sortBy: sortBy.value,
      sortDir: sortDir.value,
    }
    try {
      window.localStorage.setItem(STORAGE_PREFIX + opts.persistKey, JSON.stringify(payload))
    } catch {
      // ignore
    }
  }

  watch(
    [statusFilter, projectFilters, tagFilters, dueDateFilter, searchQuery, sortBy, sortDir],
    persist,
    { deep: true },
  )

  const hydrateFromQuery = (q: Record<string, any>) => {
    const get = (k: string): string | null => {
      const v = q[k]
      if (Array.isArray(v)) return v[0] ?? null
      return v ?? null
    }
    const status = get('status')
    if (status === 'pending' || status === 'completed' || status === 'all') {
      statusFilter.value = status
    }
    const project = get('project')
    if (project !== null) {
      const ids: (string | null)[] = project.split(',').filter(Boolean).map(s => (s === 'inbox' ? null : s))
      projectFilters.value = new Set(ids)
    }
    const tag = get('tag')
    if (tag !== null) {
      tagFilters.value = new Set(tag.split(',').filter(Boolean))
    }
    const due = get('due')
    if (due === 'all' || due === 'overdue' || due === 'today' || due === 'week' || due === 'custom') {
      dueDateFilter.value = {
        preset: due,
        from: get('from'),
        to: get('to'),
      }
    }
    const searchVal = get('q')
    if (searchVal !== null) searchQuery.value = searchVal
    const sort = get('sort')
    if (sort === 'due' || sort === 'created' || sort === 'title' || sort === 'manual') sortBy.value = sort
    const dir = get('dir')
    if (dir === 'asc' || dir === 'desc') sortDir.value = dir
  }

  const toRouteQuery = (): Record<string, string> => {
    const out: Record<string, string> = {}
    if (statusFilter.value !== 'all') out.status = statusFilter.value
    if (projectFilters.value.size) {
      out.project = Array.from(projectFilters.value).map(id => id ?? 'inbox').join(',')
    }
    if (tagFilters.value.size) out.tag = Array.from(tagFilters.value).join(',')
    if (dueDateFilter.value.preset !== 'all') {
      out.due = dueDateFilter.value.preset
      if (dueDateFilter.value.preset === 'custom') {
        if (dueDateFilter.value.from) out.from = dueDateFilter.value.from
        if (dueDateFilter.value.to) out.to = dueDateFilter.value.to
      }
    }
    if (searchQuery.value.trim()) out.q = searchQuery.value.trim()
    if (sortBy.value !== 'due') out.sort = sortBy.value
    if (sortDir.value !== 'asc') out.dir = sortDir.value
    return out
  }

  return {
    statusFilter,
    projectFilters,
    tagFilters,
    dueDateFilter,
    searchQuery,
    sortBy,
    sortDir,
    filteredTasks,
    sortedTasks,
    activeFilterCount,
    toggleProject,
    toggleTag,
    setDuePreset,
    reset,
    hydrateFromQuery,
    toRouteQuery,
  }
}

interface DueWindow {
  from?: Date
  to?: Date
  pendingOnly?: boolean
}

const resolveDueWindow = (f: DueDateFilter): DueWindow => {
  const now = new Date()
  switch (f.preset) {
    case 'overdue':
      return { to: startOfDay(now), pendingOnly: true }
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) }
    case 'week':
      return { from: startOfDay(now), to: endOfDay(addDays(now, 6)) }
    case 'custom': {
      const from = parseDateInput(f.from)
      const to = parseDateInput(f.to)
      return {
        from: from ? startOfDay(from) : undefined,
        to: to ? endOfDay(to) : undefined,
      }
    }
    case 'all':
    default:
      return {}
  }
}

const taskDueDate = (t: Task): Date | null => {
  const dd: any = t.due_date
  if (!dd) return null
  if (typeof dd.toDate === 'function') return dd.toDate()
  if (dd instanceof Date) return dd
  if (dd instanceof Timestamp) return dd.toDate()
  return null
}

const inDueWindow = (t: Task, w: DueWindow): boolean => {
  if (!w.from && !w.to) return true
  const d = taskDueDate(t)
  if (!d) return false
  if (w.pendingOnly && t.status !== 'pending') return false
  if (w.from && d < w.from) return false
  if (w.to && d > w.to) return false
  // Overdue special case: strictly before the "to" (startOfDay) and pendingOnly
  if (w.pendingOnly && w.to && !w.from) {
    return d < w.to
  }
  if (w.from && w.to) {
    return isWithinInterval(d, { start: w.from, end: w.to })
  }
  return true
}
