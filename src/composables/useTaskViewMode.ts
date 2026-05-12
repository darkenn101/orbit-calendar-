import { ref, watch } from 'vue'

export type TaskViewMode = 'list' | 'agenda' | 'kanban' | 'projects'
export type KanbanGroupBy = 'status' | 'project'

export interface ViewOptions {
  kanbanGroupBy: KanbanGroupBy
  agendaShowCompleted: boolean
  projectViewCollapsed: Record<string, boolean>
}

const STORAGE_KEY = 'orbit:tasks:view'

const defaultOptions = (): ViewOptions => ({
  kanbanGroupBy: 'status',
  agendaShowCompleted: false,
  projectViewCollapsed: {},
})

const loadState = () => {
  if (typeof window === 'undefined') return { mode: 'list' as TaskViewMode, options: defaultOptions() }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { mode: 'list' as TaskViewMode, options: defaultOptions() }
    const parsed = JSON.parse(raw)
    const mode: TaskViewMode = ['list', 'agenda', 'kanban', 'projects'].includes(parsed.mode)
      ? parsed.mode
      : 'list'
    return {
      mode,
      options: {
        ...defaultOptions(),
        ...(parsed.options ?? {}),
      } as ViewOptions,
    }
  } catch {
    return { mode: 'list' as TaskViewMode, options: defaultOptions() }
  }
}

const initial = loadState()
const mode = ref<TaskViewMode>(initial.mode)
const options = ref<ViewOptions>(initial.options)

let writePending = false
const persist = () => {
  if (typeof window === 'undefined') return
  if (writePending) return
  writePending = true
  queueMicrotask(() => {
    writePending = false
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: mode.value, options: options.value }))
    } catch {
      // ignore quota errors
    }
  })
}

watch(mode, persist)
watch(options, persist, { deep: true })

export const useTaskViewMode = () => {
  const setMode = (m: TaskViewMode) => {
    mode.value = m
  }
  const setOption = <K extends keyof ViewOptions>(k: K, v: ViewOptions[K]) => {
    options.value = { ...options.value, [k]: v }
  }
  const toggleProjectCollapse = (id: string) => {
    options.value = {
      ...options.value,
      projectViewCollapsed: {
        ...options.value.projectViewCollapsed,
        [id]: !options.value.projectViewCollapsed[id],
      },
    }
  }
  return {
    mode,
    options,
    setMode,
    setOption,
    toggleProjectCollapse,
  }
}
