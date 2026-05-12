<template>
  <div
    class="group border border-line rounded-lg transition-colors flex items-stretch"
    :class="[
      active ? 'bg-primary-50 dark:bg-primary-700/20 border-primary-300 dark:border-primary-500/40' : 'hover:bg-overlay',
      selected ? 'ring-1 ring-primary-400' : '',
    ]"
  >
    <label
      v-if="task.id"
      class="flex items-center justify-center px-3 cursor-pointer select-none"
      @click.stop="onCheckboxClick($event)"
    >
      <input
        type="checkbox"
        :checked="selected"
        class="h-4 w-4 rounded border-line-strong text-primary-600 focus:ring-primary-500"
        @click.stop="onCheckboxClick($event)"
      />
    </label>

    <button
      type="button"
      class="flex-1 min-w-0 flex items-center gap-3 p-4 text-left"
      @click="emit('select', task.id!)"
      @dblclick="emit('edit', task)"
    >
      <span
        class="flex-shrink-0"
        @click.stop="task.id && emit('toggle', task.id)"
      >
        <span
          class="block w-5 h-5 rounded-full border-2 transition-colors"
          :class="task.status === 'completed'
            ? 'bg-green-500 border-green-500'
            : 'border-line-strong group-hover:border-green-400'"
        >
          <svg
            v-if="task.status === 'completed'"
            class="w-3 h-3 text-white m-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </span>
      </span>

      <span class="flex-1 min-w-0">
        <span class="flex items-center justify-between gap-2">
          <span
            class="text-sm font-medium text-ink truncate flex items-center gap-2 min-w-0"
            :class="{ 'line-through text-ink-subtle': task.status === 'completed' }"
          >
            <span
              v-if="project"
              class="w-2 h-2 rounded-full flex-shrink-0"
              :class="projectColorClasses[project.color]"
              :title="project.name"
            />
            <ArrowPathIcon
              v-if="task.recurrence"
              class="w-3.5 h-3.5 text-ink-subtle flex-shrink-0"
              :title="recurrenceLabel"
            />
            <span class="truncate">{{ task.title || '(untitled)' }}</span>
          </span>
          <span class="flex items-center space-x-2 flex-shrink-0">
            <span
              v-if="hasSubtasks"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-overlay text-ink-muted"
            >
              {{ subtaskDoneCount }}/{{ subtaskCount }}
            </span>
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="dueDateStyle"
            >
              {{ formatDate(task.due_date) }}
            </span>
          </span>
        </span>
        <span
          v-if="task.tags && task.tags.length > 0"
          class="mt-1.5 flex flex-wrap gap-1"
        >
          <span
            v-for="tag in task.tags"
            :key="tag"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary-50 text-primary-700 dark:bg-primary-700/30 dark:text-primary-50"
          >
            #{{ tag }}
          </span>
        </span>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import { ArrowPathIcon } from '@heroicons/vue/20/solid'
import type { Task } from '@/types'
import { useProjectStore } from '@/stores/projects'
import { projectColorClasses } from '@/utils/projectColors'
import { describeRule } from '@/utils/recurrence'

const props = defineProps<{
  task: Task
  selected?: boolean
  active?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  edit: [task: Task]
  toggle: [id: string]
  toggleSelect: [id: string, shiftKey: boolean]
}>()

const projectStore = useProjectStore()
const project = computed(() =>
  props.task.projectId ? projectStore.projectsById[props.task.projectId] ?? null : null,
)
const recurrenceLabel = computed(() =>
  props.task.recurrence ? describeRule(props.task.recurrence) : '',
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
