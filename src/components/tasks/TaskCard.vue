<template>
  <div
    class="group rounded-lg border border-line bg-elevated p-3 cursor-pointer transition-colors"
    :class="[
      active ? 'border-primary-400 ring-1 ring-primary-400' : 'hover:bg-overlay',
      selected ? 'ring-1 ring-primary-400' : '',
    ]"
    @click="task.id && emit('select', task.id)"
    @dblclick="emit('edit', task)"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <span
          v-if="project"
          class="w-2 h-2 rounded-full flex-shrink-0"
          :class="projectColorClasses[project.color]"
          :title="project.name"
        />
        <ArrowPathIcon
          v-if="task.recurrence"
          class="w-3.5 h-3.5 text-ink-subtle flex-shrink-0"
        />
        <span
          class="text-sm font-medium text-ink truncate"
          :class="{ 'line-through text-ink-subtle': task.status === 'completed' }"
        >
          {{ task.title || '(untitled)' }}
        </span>
      </div>
      <label
        v-if="task.id"
        class="opacity-0 group-hover:opacity-100 transition-opacity"
        :class="{ 'opacity-100': selected }"
        @click.stop
      >
        <input
          type="checkbox"
          :checked="selected"
          class="h-4 w-4 rounded border-line-strong text-primary-600 focus:ring-primary-500"
          @click.stop="onCheckboxClick($event)"
        />
      </label>
    </div>
    <div class="mt-2 flex items-center justify-between gap-2 text-xs">
      <span
        v-if="hasSubtasks"
        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-overlay text-ink-muted"
      >
        ☑ {{ subtaskDoneCount }}/{{ subtaskCount }}
      </span>
      <span
        class="inline-flex items-center px-2 py-0.5 rounded-full font-medium ml-auto"
        :class="dueDateStyle"
      >
        {{ formatDate(task.due_date) }}
      </span>
    </div>
    <div v-if="task.tags && task.tags.length" class="mt-2 flex flex-wrap gap-1">
      <span
        v-for="tag in task.tags.slice(0, 3)"
        :key="tag"
        class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary-50 text-primary-700 dark:bg-primary-700/30 dark:text-primary-50"
      >
        #{{ tag }}
      </span>
      <span
        v-if="task.tags.length > 3"
        class="text-[10px] text-ink-subtle"
      >+{{ task.tags.length - 3 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import { ArrowPathIcon } from '@heroicons/vue/20/solid'
import type { Task } from '@/types'
import { useProjectStore } from '@/stores/projects'
import { projectColorClasses } from '@/utils/projectColors'

const props = defineProps<{
  task: Task
  selected?: boolean
  active?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  edit: [task: Task]
  toggleSelect: [id: string, shiftKey: boolean]
}>()

const projectStore = useProjectStore()
const project = computed(() =>
  props.task.projectId ? projectStore.projectsById[props.task.projectId] ?? null : null,
)

const subtaskCount = computed(() => props.task.subtasks?.length ?? 0)
const subtaskDoneCount = computed(() => (props.task.subtasks ?? []).filter(s => s.done).length)
const hasSubtasks = computed(() => subtaskCount.value > 0)

const formatDate = (timestamp: any) => {
  const d = timestamp.toDate()
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'MMM d')
}

const dueDateStyle = computed(() => {
  const d = props.task.due_date.toDate()
  if (props.task.status === 'completed') return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200'
  if (isPast(d) && !isToday(d)) return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200'
  if (isToday(d) || isTomorrow(d)) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200'
  return 'bg-overlay text-ink-muted'
})

const onCheckboxClick = (e: MouseEvent) => {
  if (!props.task.id) return
  e.preventDefault()
  e.stopPropagation()
  emit('toggleSelect', props.task.id, e.shiftKey)
}
</script>
