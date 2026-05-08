<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">
          {{ task ? 'Edit Task' : 'Add New Task' }}
        </h3>
      </div>
      
      <form @submit.prevent="handleSubmit" class="px-6 py-4 space-y-4">
        <div>
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
        
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            class="input"
            placeholder="Enter task description"
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

        <div v-if="task">
          <label for="status" class="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            v-model="form.status"
            class="input"
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div v-if="error" class="text-red-600 text-sm">
          {{ error }}
        </div>
      </form>
      
      <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
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
import { ref, reactive, onMounted } from 'vue'
import { Timestamp } from 'firebase/firestore'
import { format } from 'date-fns'
import type { Task } from '@/types'
import ProjectPicker from '@/components/ProjectPicker.vue'
import TagInput from '@/components/TagInput.vue'

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
})

onMounted(() => {
  if (props.task) {
    form.title = props.task.title
    form.description = props.task.description
    form.due_date = format(props.task.due_date.toDate(), "yyyy-MM-dd'T'HH:mm")
    form.status = props.task.status
    form.projectId = props.task.projectId ?? null
    form.tags = [...(props.task.tags ?? [])]
  } else {
    // Set default due date to selected date or tomorrow
    const defaultDate = props.defaultDate || new Date()
    if (!props.defaultDate) {
      defaultDate.setDate(defaultDate.getDate() + 1)
    }
    defaultDate.setHours(9, 0, 0, 0)
    form.due_date = format(defaultDate, "yyyy-MM-dd'T'HH:mm")
    form.projectId = props.defaultProjectId ?? null
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
    }

    emit('save', taskData)
  } catch (err: any) {
    error.value = err.message || 'Failed to save task'
    loading.value = false
  }
}
</script>