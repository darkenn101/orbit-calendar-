<template>
  <div class="p-4 space-y-4">
    <div class="flex justify-end -mt-1">
      <label class="inline-flex items-center gap-2 text-xs text-ink-subtle">
        <input
          type="checkbox"
          :checked="showCompleted"
          class="h-3.5 w-3.5 rounded border-line-strong text-primary-600 focus:ring-primary-500"
          @change="emit('toggleShowCompleted')"
        />
        Show completed
      </label>
    </div>

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
            class="text-sm font-semibold"
            :class="section.key === 'overdue' ? 'text-red-600 dark:text-red-300' : 'text-ink'"
          >{{ section.label }}</span>
          <span class="text-xs text-ink-subtle">{{ section.tasks.length }}</span>
        </span>
        <ChevronDownIcon
          class="w-4 h-4 text-ink-subtle transition-transform"
          :class="{ 'rotate-180': !collapsed[section.key] }"
        />
      </button>
      <div v-if="!collapsed[section.key]" class="px-4 pb-4">
        <div v-if="!section.tasks.length" class="text-xs text-ink-subtle py-2">Nothing here.</div>
        <VueDraggable
          v-else
          v-model="localSections[section.key]"
          :animation="150"
          :delay="100"
          :delay-on-touch-only="true"
          group="agenda-tasks"
          class="space-y-2"
          :data-section="section.key"
          @end="(evt: any) => onDrop(evt, section.key)"
        >
          <div
            v-for="t in localSections[section.key]"
            :key="t.id"
          >
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
import { Timestamp } from 'firebase/firestore'
import { ChevronDownIcon } from '@heroicons/vue/20/solid'
import { VueDraggable } from 'vue-draggable-plus'
import TaskRow from '@/components/tasks/TaskRow.vue'
import type { Task } from '@/types'
import { groupTasksByDueBucket, anchorDateForBucket, type DueAnchor } from '@/utils/taskGroups'
import { useTaskStore } from '@/stores/tasks'

const props = defineProps<{
  tasks: Task[]
  selectedIds: Set<string>
  activeTaskId: string | null
  showCompleted: boolean
}>()

const emit = defineEmits<{
  selectTask: [id: string]
  edit: [task: Task]
  toggleTask: [id: string]
  toggleSelect: [id: string, shiftKey: boolean]
  toggleShowCompleted: []
}>()

const taskStore = useTaskStore()

type SectionKey = 'overdue' | 'today' | 'tomorrow' | 'thisWeek' | 'later' | 'noDate'

const buckets = computed(() =>
  groupTasksByDueBucket(props.tasks, { includeCompleted: props.showCompleted }),
)

const sections = computed<{ key: SectionKey; label: string; tasks: Task[] }[]>(() => [
  { key: 'overdue', label: 'Overdue', tasks: buckets.value.overdue },
  { key: 'today', label: 'Today', tasks: buckets.value.today },
  { key: 'tomorrow', label: 'Tomorrow', tasks: buckets.value.tomorrow },
  { key: 'thisWeek', label: 'This Week', tasks: buckets.value.thisWeek },
  { key: 'later', label: 'Later', tasks: buckets.value.later },
  { key: 'noDate', label: 'No Date', tasks: buckets.value.noDate },
])

const localSections = ref<Record<SectionKey, Task[]>>({
  overdue: [], today: [], tomorrow: [], thisWeek: [], later: [], noDate: [],
})

watch(buckets, b => {
  localSections.value = {
    overdue: [...b.overdue],
    today: [...b.today],
    tomorrow: [...b.tomorrow],
    thisWeek: [...b.thisWeek],
    later: [...b.later],
    noDate: [...b.noDate],
  }
}, { immediate: true })

const collapsed = ref<Record<SectionKey, boolean>>({
  overdue: false, today: false, tomorrow: false, thisWeek: false, later: true, noDate: true,
})
const toggle = (k: SectionKey) => { collapsed.value[k] = !collapsed.value[k] }

const ANCHOR_BY_SECTION: Record<SectionKey, DueAnchor | null> = {
  overdue: null,
  today: 'today',
  tomorrow: 'tomorrow',
  thisWeek: 'thisWeek',
  later: 'later',
  noDate: null,
}

const onDrop = async (evt: any, targetKey: SectionKey) => {
  const fromKey = evt.from?.dataset?.section as SectionKey | undefined
  if (!fromKey || fromKey === targetKey) return
  const item = localSections.value[targetKey][evt.newIndex]
  if (!item?.id) return
  const anchor = ANCHOR_BY_SECTION[targetKey]
  if (!anchor) return
  const newDate = anchorDateForBucket(anchor)
  await taskStore.updateTask(item.id, { due_date: Timestamp.fromDate(newDate) })
}
</script>
