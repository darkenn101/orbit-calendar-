<template>
  <!-- Task Notifications -->
  <div
    v-if="taskStore.upcomingTasks.length > 0 && !dismissedTasks"
    class="fixed top-4 right-4 bg-elevated border border-yellow-200 dark:border-yellow-500/40 rounded-lg shadow-lg p-4 max-w-sm z-40"
  >
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <ExclamationTriangleIcon class="h-5 w-5 text-yellow-400" />
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          {{ taskStore.upcomingTasks.length }} Task{{ taskStore.upcomingTasks.length > 1 ? 's' : '' }} Due Soon
        </h3>
        <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
          <ul class="list-disc pl-5 space-y-1">
            <li
              v-for="task in taskStore.upcomingTasks.slice(0, 3)"
              :key="task.id"
              class="truncate"
            >
              {{ task.title }}
            </li>
            <li v-if="taskStore.upcomingTasks.length > 3" class="text-xs">
              ...and {{ taskStore.upcomingTasks.length - 3 }} more
            </li>
          </ul>
        </div>
        <div class="mt-4 flex">
          <RouterLink
            to="/"
            class="text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-200 dark:hover:bg-yellow-500/30 px-2 py-1 rounded transition-colors"
          >
            View Tasks
          </RouterLink>
          <button
            @click="dismissedTasks = true"
            class="ml-3 text-sm text-yellow-700 hover:text-yellow-600 dark:text-yellow-300 dark:hover:text-yellow-200"
          >
            Dismiss
          </button>
        </div>
      </div>
      <div class="ml-auto flex-shrink-0">
        <button
          @click="dismissedTasks = true"
          class="bg-transparent rounded-md inline-flex text-yellow-400 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        >
          <span class="sr-only">Close</span>
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>

  <!-- Reminder Notifications -->
  <div
    v-if="reminderStore.currentReminders.length > 0 && !dismissedReminders"
    :class="{
      'top-4': taskStore.upcomingTasks.length === 0 || dismissedTasks,
      'top-44': taskStore.upcomingTasks.length > 0 && !dismissedTasks
    }"
    class="fixed right-4 bg-elevated border border-blue-200 dark:border-blue-500/40 rounded-lg shadow-lg p-4 max-w-sm z-40"
  >
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <InformationCircleIcon class="h-5 w-5 text-blue-400" />
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
          {{ reminderStore.currentReminders.length }} Active Reminder{{ reminderStore.currentReminders.length > 1 ? 's' : '' }}
        </h3>
        <div class="mt-2 text-sm text-blue-700 dark:text-blue-200">
          <ul class="list-disc pl-5 space-y-1">
            <li
              v-for="reminder in reminderStore.currentReminders.slice(0, 3)"
              :key="reminder.id"
              class="truncate"
            >
              {{ reminder.title }}
            </li>
            <li v-if="reminderStore.currentReminders.length > 3" class="text-xs">
              ...and {{ reminderStore.currentReminders.length - 3 }} more
            </li>
          </ul>
        </div>
        <div class="mt-4 flex">
          <RouterLink
            to="/reminders"
            class="text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-200 dark:hover:bg-blue-500/30 px-2 py-1 rounded transition-colors"
          >
            View Reminders
          </RouterLink>
          <button
            @click="dismissedReminders = true"
            class="ml-3 text-sm text-blue-700 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-200"
          >
            Dismiss
          </button>
        </div>
      </div>
      <div class="ml-auto flex-shrink-0">
        <button
          @click="dismissedReminders = true"
          class="bg-transparent rounded-md inline-flex text-blue-400 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <span class="sr-only">Close</span>
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useTaskStore } from '@/stores/tasks'
import { useReminderStore } from '@/stores/reminders'
import { ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/vue/20/solid'

const taskStore = useTaskStore()
const reminderStore = useReminderStore()

const dismissedTasks = ref(false)
const dismissedReminders = ref(false)

let reminderUnsubscribe: (() => void) | undefined = undefined

onMounted(() => {
  // Load reminders when component mounts
  reminderUnsubscribe = reminderStore.loadReminders()
})

onUnmounted(() => {
  if (reminderUnsubscribe) {
    reminderUnsubscribe()
  }
})

// Reset dismissed state when new tasks become upcoming
watch(() => taskStore.upcomingTasks.length, (newCount, oldCount) => {
  if (newCount > oldCount) {
    dismissedTasks.value = false
  }
})

// Reset dismissed state when new reminders become current
watch(() => reminderStore.currentReminders.length, (newCount, oldCount) => {
  if (newCount > oldCount) {
    dismissedReminders.value = false
  }
})
</script>