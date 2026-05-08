<template>
  <div class="border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
    <div class="flex items-center space-x-3 p-4">
      <!-- Status Toggle -->
      <button
        @click="emit('toggle', task.id!)"
        class="flex-shrink-0"
      >
        <div
          class="w-5 h-5 rounded-full border-2 transition-colors"
          :class="task.status === 'completed'
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-green-400'"
        >
          <svg
            v-if="task.status === 'completed'"
            class="w-3 h-3 text-white m-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>
      </button>

      <!-- Task Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <h4
            class="text-sm font-medium text-gray-900 truncate flex items-center gap-2"
            :class="{ 'line-through text-gray-500': task.status === 'completed' }"
          >
            <span
              v-if="project"
              class="w-2 h-2 rounded-full flex-shrink-0"
              :class="projectColorClasses[project.color]"
              :title="project.name"
            />
            <span class="truncate">{{ task.title }}</span>
          </h4>
          <div class="flex items-center space-x-2 flex-shrink-0">
            <button
              v-if="hasSubtasks"
              type="button"
              class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
              :aria-expanded="expanded"
              :title="expanded ? 'Hide checklist' : 'Show checklist'"
              @click="expanded = !expanded"
            >
              <span>{{ subtaskDoneCount }}/{{ subtaskCount }}</span>
              <ChevronDownIcon
                class="w-3 h-3 transition-transform"
                :class="{ 'rotate-180': expanded }"
              />
            </button>
            <span
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              :class="dueDateStyle"
            >
              {{ formatDate(task.due_date) }}
            </span>
            <ReminderBadge v-if="isUpcoming" />
          </div>
        </div>
        <p
          v-if="task.description"
          class="mt-1 text-sm text-gray-500"
          :class="{ 'line-through': task.status === 'completed' }"
        >
          {{ task.description }}
        </p>
        <div v-if="task.tags && task.tags.length > 0" class="mt-2 flex flex-wrap gap-1">
          <span
            v-for="tag in task.tags"
            :key="tag"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-700/30 dark:text-primary-50"
          >
            #{{ tag }}
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center space-x-2">
        <button
          @click="emit('edit', task)"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          @click="emit('delete', task.id!)"
          class="text-gray-400 hover:text-red-500 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Inline subtask checklist -->
    <div v-if="expanded && hasSubtasks" class="px-4 pb-4 pl-12 space-y-1.5">
      <div
        v-for="sub in task.subtasks"
        :key="sub.id"
        class="flex items-center gap-2"
      >
        <button
          type="button"
          class="flex-shrink-0"
          :aria-label="sub.done ? 'Mark subtask incomplete' : 'Mark subtask complete'"
          @click="emit('toggleSubtask', task.id!, sub.id)"
        >
          <div
            class="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
            :class="sub.done
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-green-400 dark:border-gray-500 dark:hover:border-green-400'"
          >
            <svg
              v-if="sub.done"
              class="w-2.5 h-2.5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </button>
        <span
          class="text-sm"
          :class="sub.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'"
        >
          {{ sub.text || '(empty)' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import { ChevronDownIcon } from '@heroicons/vue/20/solid'
import type { Task } from '@/types'
import ReminderBadge from '@/components/ReminderBadge.vue'
import { useProjectStore } from '@/stores/projects'
import { projectColorClasses } from '@/utils/projectColors'

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  edit: [task: Task]
  delete: [id: string]
  toggle: [id: string]
  toggleSubtask: [taskId: string, subtaskId: string]
}>()

const projectStore = useProjectStore()
const project = computed(() =>
  props.task.projectId ? projectStore.projectsById[props.task.projectId] ?? null : null,
)

const expanded = ref(false)

const subtaskCount = computed(() => props.task.subtasks?.length ?? 0)
const subtaskDoneCount = computed(() =>
  (props.task.subtasks ?? []).filter((s) => s.done).length,
)
const hasSubtasks = computed(() => subtaskCount.value > 0)

const formatDate = (timestamp: any) => {
  const date = timestamp.toDate()

  if (isToday(date)) {
    return 'Today'
  } else if (isTomorrow(date)) {
    return 'Tomorrow'
  } else {
    return format(date, 'MMM d, yyyy')
  }
}

const dueDateStyle = computed(() => {
  const date = props.task.due_date.toDate()

  if (props.task.status === 'completed') {
    return 'bg-green-100 text-green-800'
  } else if (isPast(date)) {
    return 'bg-red-100 text-red-800'
  } else if (isToday(date) || isTomorrow(date)) {
    return 'bg-yellow-100 text-yellow-800'
  } else {
    return 'bg-gray-100 text-gray-800'
  }
})

const isUpcoming = computed(() => {
  const date = props.task.due_date.toDate()
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  return props.task.status === 'pending' && date <= tomorrow
})
</script>
