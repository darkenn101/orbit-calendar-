<template>
  <div class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
    <div class="bg-elevated rounded-lg shadow-xl max-w-md w-full">
      <div class="px-6 py-4 border-b border-line">
        <h3 class="text-lg font-medium text-ink">
          {{ reminder ? 'Edit Reminder' : 'Add New Reminder' }}
        </h3>
      </div>

      <form @submit.prevent="handleSubmit" class="px-6 py-4 space-y-4">
        <div>
          <label for="title" class="block text-sm font-medium text-ink-muted mb-1">
            Title
          </label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            required
            class="input"
            placeholder="Enter reminder title"
          />
        </div>

        <div>
          <label for="description" class="block text-sm font-medium text-ink-muted mb-1">
            Description
          </label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            class="input"
            placeholder="Enter reminder description"
          ></textarea>
        </div>

        <div>
          <label for="start_date" class="block text-sm font-medium text-ink-muted mb-1">
            Start Date (Optional)
          </label>
          <input
            id="start_date"
            v-model="form.start_date"
            type="datetime-local"
            class="input"
          />
          <p class="text-xs text-ink-subtle mt-1">
            When this reminder should become active
          </p>
        </div>

        <div>
          <label for="end_date" class="block text-sm font-medium text-ink-muted mb-1">
            End Date (Optional)
          </label>
          <input
            id="end_date"
            v-model="form.end_date"
            type="datetime-local"
            class="input"
          />
          <p class="text-xs text-ink-subtle mt-1">
            When this reminder should stop being shown
          </p>
        </div>

        <div v-if="reminder">
          <label for="status" class="block text-sm font-medium text-ink-muted mb-1">
            Status
          </label>
          <select
            id="status"
            v-model="form.status"
            class="input"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        <div v-if="error" class="text-red-600 dark:text-red-400 text-sm">
          {{ error }}
        </div>
      </form>

      <div class="px-6 py-4 border-t border-line flex justify-end space-x-3">
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
            {{ reminder ? 'Update' : 'Create' }} Reminder
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
import type { Reminder } from '@/types'

const props = defineProps<{
  reminder?: Reminder | null
  defaultDate?: Date | null
}>()

const emit = defineEmits<{
  close: []
  save: [reminderData: any]
}>()

const loading = ref(false)
const error = ref('')

const form = reactive({
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  status: 'active' as 'active' | 'completed' | 'dismissed'
})

onMounted(() => {
  if (props.reminder) {
    form.title = props.reminder.title
    form.description = props.reminder.description
    form.start_date = props.reminder.start_date 
      ? format(props.reminder.start_date.toDate(), "yyyy-MM-dd'T'HH:mm")
      : ''
    form.end_date = props.reminder.end_date 
      ? format(props.reminder.end_date.toDate(), "yyyy-MM-dd'T'HH:mm")
      : ''
    form.status = props.reminder.status
  } else {
    // Set default start date to selected date or now
    if (props.defaultDate) {
      form.start_date = format(props.defaultDate, "yyyy-MM-dd'T'HH:mm")
    }
  }
})

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    const reminderData: any = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status
    }

    // Only add dates if they are provided
    if (form.start_date) {
      reminderData.start_date = Timestamp.fromDate(new Date(form.start_date))
    }

    if (form.end_date) {
      reminderData.end_date = Timestamp.fromDate(new Date(form.end_date))
    }

    // Validate that end date is after start date if both are provided
    if (form.start_date && form.end_date) {
      const startDate = new Date(form.start_date)
      const endDate = new Date(form.end_date)
      
      if (endDate <= startDate) {
        throw new Error('End date must be after start date')
      }
    }

    emit('save', reminderData)
  } catch (err: any) {
    error.value = err.message || 'Failed to save reminder'
    loading.value = false
  }
}
</script>