<template>
  <div class="h-full flex flex-col">
    <div class="px-4 pt-3 flex items-center gap-2">
      <span class="text-xs text-ink-subtle">Group by:</span>
      <div class="inline-flex items-center rounded-md border border-line p-0.5 text-xs">
        <button
          v-for="opt in groupByOptions"
          :key="opt.value"
          type="button"
          class="px-2.5 py-1 rounded transition-colors"
          :class="groupBy === opt.value
            ? 'bg-primary-500 text-white'
            : 'text-ink-muted hover:bg-overlay'"
          @click="emit('setGroupBy', opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-x-auto overflow-y-hidden">
      <div class="flex gap-3 p-4 h-full min-w-max">
        <div
          v-for="col in columns"
          :key="col.key"
          class="w-72 flex-shrink-0 flex flex-col rounded-lg border border-line bg-surface"
        >
          <div class="px-3 py-2 border-b border-line flex items-center justify-between">
            <span class="flex items-center gap-2 text-sm font-semibold text-ink">
              <span
                v-if="col.color"
                class="w-2 h-2 rounded-full"
                :class="projectColorClasses[col.color]"
              />
              {{ col.label }}
            </span>
            <span class="text-xs text-ink-subtle">{{ col.tasks.length }}</span>
          </div>
          <VueDraggable
            v-model="localCols[col.key]"
            :animation="150"
            :delay="100"
            :delay-on-touch-only="true"
            group="kanban-tasks"
            class="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]"
            :data-column="col.key"
            @end="(evt: any) => onDrop(evt, col.key)"
          >
            <div v-for="t in localCols[col.key]" :key="t.id">
              <TaskCard
                :task="t"
                :selected="t.id ? selectedIds.has(t.id) : false"
                :active="t.id === activeTaskId"
                @select="(id) => emit('selectTask', id)"
                @edit="(task) => emit('edit', task)"
                @toggle-select="(id, shift) => emit('toggleSelect', id, shift)"
              />
            </div>
          </VueDraggable>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import TaskCard from '@/components/tasks/TaskCard.vue'
import type { Task, ProjectColor } from '@/types'
import { useProjectStore } from '@/stores/projects'
import { useTaskStore } from '@/stores/tasks'
import { projectColorClasses } from '@/utils/projectColors'
import type { KanbanGroupBy } from '@/composables/useTaskViewMode'

const props = defineProps<{
  tasks: Task[]
  selectedIds: Set<string>
  activeTaskId: string | null
  groupBy: KanbanGroupBy
}>()

const emit = defineEmits<{
  selectTask: [id: string]
  edit: [task: Task]
  toggleSelect: [id: string, shiftKey: boolean]
  setGroupBy: [g: KanbanGroupBy]
}>()

const projectStore = useProjectStore()
const taskStore = useTaskStore()

const groupByOptions: { value: KanbanGroupBy; label: string }[] = [
  { value: 'status', label: 'Status' },
  { value: 'project', label: 'Project' },
]

interface Column {
  key: string
  label: string
  color?: ProjectColor
  tasks: Task[]
}

const columns = computed<Column[]>(() => {
  const byKey = (a: Task, b: Task) => taskStore.sortKey(a) - taskStore.sortKey(b)
  if (props.groupBy === 'status') {
    const pending: Task[] = []
    const completed: Task[] = []
    for (const t of props.tasks) {
      if (t.status === 'completed') completed.push(t)
      else pending.push(t)
    }
    return [
      { key: 'pending', label: 'Pending', tasks: pending.sort(byKey) },
      { key: 'completed', label: 'Completed', tasks: completed.sort(byKey) },
    ]
  }
  const groups: Record<string, Task[]> = { inbox: [] }
  for (const p of projectStore.projects) if (p.id) groups[p.id] = []
  for (const t of props.tasks) {
    const key = t.projectId ?? 'inbox'
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  }
  const out: Column[] = [{ key: 'inbox', label: 'Inbox', tasks: groups.inbox.sort(byKey) }]
  for (const p of projectStore.projects) {
    if (!p.id) continue
    out.push({ key: p.id, label: p.name, color: p.color, tasks: (groups[p.id] ?? []).sort(byKey) })
  }
  return out
})

const localCols = ref<Record<string, Task[]>>({})
watch(columns, list => {
  const next: Record<string, Task[]> = {}
  for (const c of list) next[c.key] = [...c.tasks]
  localCols.value = next
}, { immediate: true, deep: true })

const onDrop = async (evt: any, targetKey: string) => {
  const fromKey = evt.from?.dataset?.column as string | undefined
  const newIndex: number = evt.newIndex
  const list = localCols.value[targetKey]
  if (!list) return
  const moved = list[newIndex]
  if (!moved?.id) return

  if (props.groupBy === 'status') {
    if (fromKey && fromKey !== targetKey) {
      const targetStatus: 'pending' | 'completed' = targetKey === 'completed' ? 'completed' : 'pending'
      if (moved.recurrence && moved.status === 'pending' && targetStatus === 'completed') {
        await taskStore.bulkComplete([moved.id])
        return
      }
      await taskStore.updateTask(moved.id, { status: targetStatus })
      return
    }
    const prev = list[newIndex - 1]
    const nextT = list[newIndex + 1]
    if (prev || nextT) {
      await taskStore.updateTask(moved.id, { order: taskStore.computeDropOrder(prev, nextT) })
    }
    return
  }

  const updates: any = {}
  if (fromKey && fromKey !== targetKey) {
    updates.projectId = targetKey === 'inbox' ? null : targetKey
  }
  const prev = list[newIndex - 1]
  const nextT = list[newIndex + 1]
  if (prev || nextT) {
    updates.order = taskStore.computeDropOrder(prev, nextT)
  }
  if (Object.keys(updates).length) {
    await taskStore.updateTask(moved.id, updates)
  }
}
</script>
