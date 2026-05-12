<template>
  <div class="h-screen flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3 px-6 py-3 border-b border-line bg-elevated flex-wrap">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold text-ink">Tasks</h1>
        <p class="mt-0.5 text-sm text-ink-subtle">
          {{ filters.filteredTasks.value.length }} of {{ taskStore.tasks.length }}
        </p>
      </div>

      <div class="flex items-center gap-2 flex-1 min-w-0 justify-end flex-wrap">
        <div class="relative max-w-xs w-full sm:w-64">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
          <input
            v-model="filters.searchQuery.value"
            type="text"
            placeholder="Search tasks…"
            class="w-full pl-9 pr-3 py-2 text-sm bg-surface text-ink border border-line rounded-lg placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          />
        </div>
        <TasksViewSwitcher v-model="mode" />
        <button
          type="button"
          class="btn-primary inline-flex items-center"
          @click="showAddTask = true"
        >
          <PlusIcon class="w-4 h-4 mr-1.5" />
          New Task
        </button>
      </div>
    </div>

    <QuickAddBar class="mx-12 my-5" :default-project-id="defaultProjectId" />

    <TasksFilterBar :filters="filters" :show-manual-sort="mode === 'list' || mode === 'projects'" />

    <!-- Body -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left list/board panel -->
      <div class="flex-1 min-w-0 overflow-y-auto">
        <TasksListView
          v-if="mode === 'list'"
          :tasks="filters.sortedTasks.value"
          :selected-ids="selection.selected.value"
          :active-task-id="activeTaskId"
          :manual-sort="filters.sortBy.value === 'manual'"
          @select-task="onSelectTask"
          @edit="onEdit"
          @toggle-task="onToggle"
          @toggle-select="onToggleSelect"
        />
        <TasksAgendaView
          v-else-if="mode === 'agenda'"
          :tasks="filters.filteredTasks.value"
          :selected-ids="selection.selected.value"
          :active-task-id="activeTaskId"
          :show-completed="options.agendaShowCompleted"
          @select-task="onSelectTask"
          @edit="onEdit"
          @toggle-task="onToggle"
          @toggle-select="onToggleSelect"
          @toggle-show-completed="setOption('agendaShowCompleted', !options.agendaShowCompleted)"
        />
        <TasksKanbanView
          v-else-if="mode === 'kanban'"
          :tasks="filters.filteredTasks.value"
          :selected-ids="selection.selected.value"
          :active-task-id="activeTaskId"
          :group-by="options.kanbanGroupBy"
          @select-task="onSelectTask"
          @edit="onEdit"
          @toggle-select="onToggleSelect"
          @set-group-by="(g) => setOption('kanbanGroupBy', g)"
        />
        <TasksProjectView
          v-else
          :tasks="filters.filteredTasks.value"
          :selected-ids="selection.selected.value"
          :active-task-id="activeTaskId"
          @select-task="onSelectTask"
          @edit="onEdit"
          @toggle-task="onToggle"
          @toggle-select="onToggleSelect"
        />
      </div>

      <!-- Right detail pane (hidden on small screens — modal used instead) -->
      <div class="hidden lg:flex w-96 flex-shrink-0 border-l border-line">
        <TaskDetailPane
          :task="activeTask"
          class="flex-1"
          @close="activeTaskId = null"
          @deleted="onTaskDeleted"
        />
      </div>
    </div>

    <BulkActionBar
      v-if="selection.count.value > 0"
      :count="selection.count.value"
      :busy="bulkBusy"
      @complete="onBulkComplete"
      @uncomplete="onBulkUncomplete"
      @delete="onBulkDelete"
      @move="onBulkMove"
      @tag="onBulkTag"
      @clear="selection.clear"
    />

    <!-- Modal fallback for small screens / new task creation -->
    <TaskModal
      v-if="showAddTask || (mobileEditTask && !isLargeScreen)"
      :task="mobileEditTask"
      :default-project-id="defaultProjectId"
      @close="closeTaskModal"
      @save="saveTask"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { useTaskStore } from '@/stores/tasks'
import { useProjectStore } from '@/stores/projects'
import { useTaskFilters } from '@/composables/useTaskFilters'
import { useTaskSelection } from '@/composables/useTaskSelection'
import { useTaskViewMode } from '@/composables/useTaskViewMode'
import TasksViewSwitcher from '@/components/tasks/TasksViewSwitcher.vue'
import TasksFilterBar from '@/components/tasks/TasksFilterBar.vue'
import TaskDetailPane from '@/components/tasks/TaskDetailPane.vue'
import BulkActionBar from '@/components/tasks/BulkActionBar.vue'
import TasksListView from '@/views/tasks/TasksListView.vue'
import TasksAgendaView from '@/views/tasks/TasksAgendaView.vue'
import TasksKanbanView from '@/views/tasks/TasksKanbanView.vue'
import TasksProjectView from '@/views/tasks/TasksProjectView.vue'
import TaskModal from '@/components/TaskModal.vue'
import QuickAddBar from '@/components/QuickAddBar.vue'
import type { Task } from '@/types'

const taskStore = useTaskStore()
const projectStore = useProjectStore()
const route = useRoute()
const router = useRouter()

const { mode, options, setMode, setOption } = useTaskViewMode()

const persistKey = computed(() => `view:${mode.value}`)
const tasksSource = computed(() => taskStore.tasks)

const filters = useTaskFilters({
  source: tasksSource,
  persistKey: 'all',
})

const visibleIds = computed(() =>
  filters.sortedTasks.value.map(t => t.id).filter((id): id is string => !!id),
)
const selection = useTaskSelection({ visibleIds })

const activeTaskId = ref<string | null>(null)
const activeTask = computed<Task | null>(() => {
  if (!activeTaskId.value) return null
  return taskStore.tasks.find(t => t.id === activeTaskId.value) ?? null
})

const isLargeScreen = ref(true)
const updateScreen = () => {
  if (typeof window !== 'undefined') {
    isLargeScreen.value = window.matchMedia('(min-width: 1024px)').matches
  }
}

const mobileEditTask = ref<Task | null>(null)
const showAddTask = ref(false)
const bulkBusy = ref(false)

const defaultProjectId = computed(() => {
  if (filters.projectFilters.value.size === 1) {
    const [first] = filters.projectFilters.value
    return first
  }
  return null
})

const onSelectTask = (id: string) => {
  activeTaskId.value = id
  if (!isLargeScreen.value) {
    const t = taskStore.tasks.find(x => x.id === id)
    if (t) mobileEditTask.value = t
  }
}

const onEdit = (task: Task) => {
  mobileEditTask.value = task
}

const onToggle = (id: string) => taskStore.toggleTaskStatus(id)

const onToggleSelect = (id: string, shiftKey: boolean) => {
  selection.toggle(id, { shiftKey })
}

const onTaskDeleted = (id: string) => {
  if (activeTaskId.value === id) activeTaskId.value = null
}

const closeTaskModal = () => {
  showAddTask.value = false
  mobileEditTask.value = null
}

const saveTask = async (taskData: any) => {
  if (mobileEditTask.value) {
    await taskStore.updateTask(mobileEditTask.value.id!, taskData)
  } else {
    await taskStore.addTask(taskData)
  }
  closeTaskModal()
}

const runBulk = async (action: () => Promise<any>) => {
  bulkBusy.value = true
  try { await action() } finally { bulkBusy.value = false }
}

const onBulkComplete = () => runBulk(async () => {
  const ids = Array.from(selection.selected.value)
  await taskStore.bulkComplete(ids)
  selection.clear()
})
const onBulkUncomplete = () => runBulk(async () => {
  const ids = Array.from(selection.selected.value)
  await taskStore.bulkUncomplete(ids)
  selection.clear()
})
const onBulkDelete = () => runBulk(async () => {
  const ids = Array.from(selection.selected.value)
  if (!ids.length) return
  if (!confirm(`Delete ${ids.length} task${ids.length === 1 ? '' : 's'}? This cannot be undone.`)) return
  await taskStore.bulkDelete(ids)
  selection.clear()
})
const onBulkMove = (projectId: string | null) => runBulk(async () => {
  const ids = Array.from(selection.selected.value)
  await taskStore.bulkMoveToProject(ids, projectId)
})
const onBulkTag = (tag: string) => runBulk(async () => {
  const ids = Array.from(selection.selected.value)
  await taskStore.bulkAddTag(ids, tag)
})

// Hydrate filters + view mode + active task from query params on mount,
// then keep filter state in sync with the URL (replace, not push).
let initializing = true
onMounted(() => {
  updateScreen()
  window.addEventListener('resize', updateScreen)

  const q = route.query
  filters.hydrateFromQuery(q as any)
  const viewQ = typeof q.view === 'string' ? q.view : null
  if (viewQ === 'list' || viewQ === 'agenda' || viewQ === 'kanban' || viewQ === 'projects') {
    setMode(viewQ)
  }
  const groupBy = typeof q.groupBy === 'string' ? q.groupBy : null
  if (groupBy === 'status' || groupBy === 'project') {
    setOption('kanbanGroupBy', groupBy)
  }
  const taskId = typeof q.taskId === 'string' ? q.taskId : null
  if (taskId) {
    const tryLoad = () => {
      const t = taskStore.tasks.find(x => x.id === taskId)
      if (t) {
        activeTaskId.value = taskId
      } else if (initializing) {
        setTimeout(tryLoad, 100)
      }
    }
    tryLoad()
  }

  setTimeout(() => { initializing = false }, 1000)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScreen)
})

watch(activeTask, (next, prev) => {
  if (prev && !next && activeTaskId.value) {
    activeTaskId.value = null
  }
})

watch(
  () => [
    filters.statusFilter.value,
    filters.projectFilters.value,
    filters.tagFilters.value,
    filters.dueDateFilter.value,
    filters.searchQuery.value,
    filters.sortBy.value,
    filters.sortDir.value,
    mode.value,
    options.value.kanbanGroupBy,
    activeTaskId.value,
  ],
  () => {
    if (initializing) return
    const q: Record<string, string> = filters.toRouteQuery()
    if (mode.value !== 'list') q.view = mode.value
    if (mode.value === 'kanban' && options.value.kanbanGroupBy !== 'status') {
      q.groupBy = options.value.kanbanGroupBy
    }
    if (activeTaskId.value) q.taskId = activeTaskId.value
    router.replace({ query: q }).catch(() => {})
  },
  { deep: true },
)

// Prune projects that have been deleted from the filter set.
watch(() => projectStore.projects.map(p => p.id), (ids) => {
  const known = new Set(ids.filter((id): id is string => !!id))
  let changed = false
  const next = new Set<string | null>()
  for (const id of filters.projectFilters.value) {
    if (id === null || known.has(id)) next.add(id)
    else changed = true
  }
  if (changed) filters.projectFilters.value = next
}, { deep: true })
</script>
