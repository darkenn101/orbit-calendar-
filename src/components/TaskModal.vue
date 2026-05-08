<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
      <div class="px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <h3 class="text-lg font-medium text-gray-900">
          {{ task ? 'Edit Task' : 'Add New Task' }}
        </h3>
      </div>

      <form @submit.prevent="handleSubmit" class="flex-1 overflow-y-auto">
        <!-- Title — always visible above the accordion -->
        <div class="px-6 pt-4 pb-2">
          <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            required
            class="input"
            placeholder="Enter task title"
          />
        </div>

        <!-- Details section -->
        <details class="task-modal-section" :open="sections.details">
          <summary class="task-modal-summary">
            <span class="font-medium">Details</span>
            <ChevronDownIcon class="w-4 h-4 text-gray-400 task-modal-chevron" />
          </summary>
          <div class="px-6 pb-4 space-y-4">
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                v-model="form.description"
                rows="3"
                class="input"
                placeholder="Optional details"
              ></textarea>
            </div>
            <div>
              <label for="due_date" class="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                id="due_date"
                v-model="form.due_date"
                type="datetime-local"
                required
                class="input"
              />
            </div>
          </div>
        </details>

        <!-- Organize section -->
        <details class="task-modal-section" :open="sections.organize">
          <summary class="task-modal-summary">
            <span class="font-medium flex items-center gap-2">
              Organize
              <span v-if="organizeBadge" class="text-xs text-gray-500 font-normal">{{ organizeBadge }}</span>
            </span>
            <ChevronDownIcon class="w-4 h-4 text-gray-400 task-modal-chevron" />
          </summary>
          <div class="px-6 pb-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Project
              </label>
              <ProjectPicker v-model="form.projectId" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <TagInput v-model="form.tags" placeholder="Type a tag and press Enter" />
            </div>
          </div>
        </details>

        <!-- Checklist section -->
        <details class="task-modal-section" :open="sections.checklist">
          <summary class="task-modal-summary">
            <span class="font-medium flex items-center gap-2">
              Checklist
              <span v-if="checklistBadge" class="text-xs text-gray-500 font-normal">{{ checklistBadge }}</span>
            </span>
            <ChevronDownIcon class="w-4 h-4 text-gray-400 task-modal-chevron" />
          </summary>
          <div class="px-6 pb-4">
            <SubtaskList v-model="form.subtasks" />
          </div>
        </details>

        <!-- Status section (only when editing) -->
        <details v-if="task" class="task-modal-section" :open="sections.status">
          <summary class="task-modal-summary">
            <span class="font-medium flex items-center gap-2">
              Status
              <span class="text-xs text-gray-500 font-normal capitalize">{{ form.status }}</span>
            </span>
            <ChevronDownIcon class="w-4 h-4 text-gray-400 task-modal-chevron" />
          </summary>
          <div class="px-6 pb-4">
            <select
              id="status"
              v-model="form.status"
              class="input"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </details>

        <div v-if="error" class="px-6 pb-4 text-red-600 text-sm">
          {{ error }}
        </div>
      </form>

      <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0">
        <button
          type="button"
          @click="$emit('close')"
          class="btn-secondary"
        >
          Cancel
        </button>
        <button
          @click="handleSubmit"
          :disabled="loading"
          class="btn-primary"
        >
          <span v-if="loading" class="inline-flex items-center">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Saving...
          </span>
          <span v-else>
            {{ task ? 'Update' : 'Create' }} Task
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Timestamp } from 'firebase/firestore'
import { format } from 'date-fns'
import { ChevronDownIcon } from '@heroicons/vue/20/solid'
import type { Task, Subtask } from '@/types'
import ProjectPicker from '@/components/ProjectPicker.vue'
import TagInput from '@/components/TagInput.vue'
import SubtaskList from '@/components/SubtaskList.vue'

const props = defineProps<{
  task?: Task | null
  defaultDate?: Date | null
  defaultProjectId?: string | null
}>()

const emit = defineEmits<{
  close: []
  save: [taskData: any]
}>()

const loading = ref(false)
const error = ref('')

const form = reactive({
  title: '',
  description: '',
  due_date: '',
  status: 'pending' as 'pending' | 'completed',
  projectId: null as string | null,
  tags: [] as string[],
  subtasks: [] as Subtask[],
})

const sections = reactive({
  details: true,
  organize: false,
  checklist: false,
  status: false,
})

const organizeBadge = computed(() => {
  const parts: string[] = []
  if (form.projectId) parts.push('project')
  if (form.tags.length > 0) parts.push(`${form.tags.length} tag${form.tags.length === 1 ? '' : 's'}`)
  return parts.join(' • ')
})

const checklistBadge = computed(() => {
  if (form.subtasks.length === 0) return ''
  const done = form.subtasks.filter((s) => s.done).length
  return `${done}/${form.subtasks.length}`
})

onMounted(() => {
  if (props.task) {
    form.title = props.task.title
    form.description = props.task.description
    form.due_date = format(props.task.due_date.toDate(), "yyyy-MM-dd'T'HH:mm")
    form.status = props.task.status
    form.projectId = props.task.projectId ?? null
    form.tags = [...(props.task.tags ?? [])]
    form.subtasks = (props.task.subtasks ?? []).map((s) => ({ ...s }))

    sections.organize = !!form.projectId || form.tags.length > 0
    sections.checklist = form.subtasks.length > 0
  } else {
    const defaultDate = props.defaultDate || new Date()
    if (!props.defaultDate) {
      defaultDate.setDate(defaultDate.getDate() + 1)
    }
    defaultDate.setHours(9, 0, 0, 0)
    form.due_date = format(defaultDate, "yyyy-MM-dd'T'HH:mm")
    form.projectId = props.defaultProjectId ?? null
    sections.organize = !!form.projectId
  }
})

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    const dueDate = new Date(form.due_date)
    const taskData = {
      title: form.title.trim(),
      description: form.description.trim(),
      due_date: Timestamp.fromDate(dueDate),
      status: form.status,
      projectId: form.projectId,
      tags: form.tags,
      subtasks: form.subtasks.filter((s) => s.text.trim() !== ''),
    }

    emit('save', taskData)
  } catch (err: any) {
    error.value = err.message || 'Failed to save task'
    loading.value = false
  }
}
</script>

<style scoped>
.task-modal-section {
  border-top: 1px solid rgb(var(--color-line));
}

.task-modal-summary {
  list-style: none;
  cursor: pointer;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
}

.task-modal-summary::-webkit-details-marker {
  display: none;
}

.task-modal-summary:hover {
  background: rgb(var(--color-surface));
}

details[open] .task-modal-chevron {
  transform: rotate(180deg);
}

.task-modal-chevron {
  transition: transform 0.15s ease;
}
</style>
