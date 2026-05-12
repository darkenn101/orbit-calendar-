<template>
  <div class="p-4 space-y-4">
    <div
      v-for="section in sections"
      :key="section.key"
      class="card"
    >
      <button
        type="button"
        class="w-full flex items-center justify-between px-4 py-3"
        @click="toggle(section.key)"
      >
        <span class="flex items-center gap-2">
          <span
            v-if="section.color"
            class="w-2.5 h-2.5 rounded-full"
            :class="projectColorClasses[section.color]"
          />
          <InboxIcon v-else class="w-4 h-4 text-ink-subtle" />
          <span class="text-sm font-semibold text-ink">{{ section.label }}</span>
          <span class="text-xs text-ink-subtle">{{ section.tasks.length }}</span>
        </span>
        <ChevronDownIcon
          class="w-4 h-4 text-ink-subtle transition-transform"
          :class="{ 'rotate-180': !collapsed[section.key] }"
        />
      </button>
      <div v-if="!collapsed[section.key]" class="px-4 pb-4">
        <div v-if="!section.tasks.length" class="text-xs text-ink-subtle py-2">No tasks.</div>
        <VueDraggable
          v-else
          v-model="localSections[section.key]"
          :animation="150"
          :delay="100"
          :delay-on-touch-only="true"
          group="project-tasks"
          class="space-y-2"
          :data-section="section.key"
          @end="(evt: any) => onDrop(evt, section.key)"
        >
          <div v-for="t in localSections[section.key]" :key="t.id">
            <TaskRow
              :task="t"
              :selected="t.id ? selectedIds.has(t.id) : false"
              :active="t.id === activeTaskId"
              @select="(id) => emit('selectTask', id)"
              @edit="(task) => emit('edit', task)"
              @toggle="(id) => emit('toggleTask', id)"
              @toggle-select="(id, shift) => emit('toggleSelect', id, shift)"
            />
          </div>
        </VueDraggable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/20/solid'
import { InboxIcon } from '@heroicons/vue/24/outline'
import { VueDraggable } from 'vue-draggable-plus'
import TaskRow from '@/components/tasks/TaskRow.vue'
import type { Task, ProjectColor } from '@/types'
import { useProjectStore } from '@/stores/projects'
import { useTaskStore } from '@/stores/tasks'
import { useTaskViewMode } from '@/composables/useTaskViewMode'
import { projectColorClasses } from '@/utils/projectColors'

const props = defineProps<{
  tasks: Task[]
  selectedIds: Set<string>
  activeTaskId: string | null
}>()

const emit = defineEmits<{
  selectTask: [id: string]
  edit: [task: Task]
  toggleTask: [id: string]
  toggleSelect: [id: string, shiftKey: boolean]
}>()

const projectStore = useProjectStore()
const taskStore = useTaskStore()
const { options, toggleProjectCollapse } = useTaskViewMode()

interface Section {
  key: string
  label: string
  color?: ProjectColor
  tasks: Task[]
}

const sections = computed<Section[]>(() => {
  const groups: Record<string, Task[]> = { inbox: [] }
  for (const p of projectStore.projects) if (p.id) groups[p.id] = []
  for (const t of props.tasks) {
    const key = t.projectId ?? 'inbox'
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  }
  const byKey = (a: Task, b: Task) => taskStore.sortKey(a) - taskStore.sortKey(b)
  const out: Section[] = [
    { key: 'inbox', label: 'Inbox', tasks: groups.inbox.sort(byKey) },
  ]
  for (const p of projectStore.projects) {
    if (!p.id) continue
    out.push({
      key: p.id,
      label: p.name,
      color: p.color,
      tasks: (groups[p.id] ?? []).sort(byKey),
    })
  }
  return out
})

const localSections = ref<Record<string, Task[]>>({})
watch(sections, list => {
  const next: Record<string, Task[]> = {}
  for (const s of list) next[s.key] = [...s.tasks]
  localSections.value = next
}, { immediate: true, deep: true })

const collapsed = computed(() => options.value.projectViewCollapsed)
const toggle = (key: string) => toggleProjectCollapse(key)

const onDrop = async (evt: any, targetKey: string) => {
  const fromKey = evt.from?.dataset?.section as string | undefined
  const newIndex: number = evt.newIndex
  const list = localSections.value[targetKey]
  if (!list) return
  const moved = list[newIndex]
  if (!moved?.id) return

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
