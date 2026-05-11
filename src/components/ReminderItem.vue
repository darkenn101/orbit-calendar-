<template>
  <div class="bg-elevated rounded-lg shadow p-4 border-l-4 border-blue-500">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <h3 class="font-medium text-ink">{{ reminder.title }}</h3>
          <span
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
            :class="statusClasses[reminder.status]"
          >
            {{ reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1) }}
          </span>
        </div>

        <p v-if="reminder.description" class="text-ink-muted text-sm mb-3">
          {{ reminder.description }}
        </p>

        <div class="text-xs text-ink-subtle space-y-1">
          <div v-if="reminder.start_date" class="flex items-center gap-1">
            <ClockIcon class="w-3 h-3" />
            <span>Starts: {{ formatDate(reminder.start_date) }}</span>
          </div>

          <div v-if="reminder.end_date" class="flex items-center gap-1">
            <ClockIcon class="w-3 h-3" />
            <span>Ends: {{ formatDate(reminder.end_date) }}</span>
          </div>

          <div v-if="!reminder.start_date && !reminder.end_date" class="flex items-center gap-1">
            <InformationCircleIcon class="w-3 h-3" />
            <span>Always active</span>
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-2 ml-4">
        <button
          v-if="reminder.status === 'active'"
          @click="$emit('complete', reminder.id!)"
          class="text-green-600 hover:text-green-700 p-1"
          title="Mark as completed"
        >
          <CheckIcon class="w-4 h-4" />
        </button>

        <button
          v-if="reminder.status === 'active'"
          @click="$emit('dismiss', reminder.id!)"
          class="text-ink-subtle hover:text-ink p-1"
          title="Dismiss reminder"
        >
          <XMarkIcon class="w-4 h-4" />
        </button>

        <button
          v-if="reminder.status !== 'active'"
          @click="$emit('reactivate', reminder.id!)"
          class="text-blue-600 hover:text-blue-700 p-1"
          title="Reactivate reminder"
        >
          <ArrowPathIcon class="w-4 h-4" />
        </button>

        <button
          @click="$emit('edit', reminder)"
          class="text-blue-600 hover:text-blue-700 p-1"
          title="Edit reminder"
        >
          <PencilIcon class="w-4 h-4" />
        </button>

        <button
          @click="$emit('delete', reminder.id!)"
          class="text-red-600 hover:text-red-700 p-1"
          title="Delete reminder"
        >
          <TrashIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import type { Reminder } from '@/types'
import { ClockIcon, InformationCircleIcon, CheckIcon, XMarkIcon, ArrowPathIcon, PencilIcon, TrashIcon } from '@heroicons/vue/20/solid'

defineProps<{
  reminder: Reminder
}>()

defineEmits<{
  edit: [reminder: Reminder]
  delete: [id: string]
  complete: [id: string]
  dismiss: [id: string]
  reactivate: [id: string]
}>()

const statusClasses = {
  active: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200',
  dismissed: 'bg-overlay text-ink-muted',
}

const formatDate = (timestamp: any) => {
  return format(timestamp.toDate(), 'MMM d, yyyy h:mm a')
}
</script>