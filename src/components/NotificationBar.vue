<template>
  <div
    v-if="taskStore.upcomingTasks.length > 0 && !dismissed"
    class="fixed top-4 right-4 bg-white border border-yellow-200 rounded-lg shadow-lg p-4 max-w-sm z-40"
  >
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-yellow-800">
          {{ taskStore.upcomingTasks.length }} Task{{ taskStore.upcomingTasks.length > 1 ? 's' : '' }} Due Soon
        </h3>
        <div class="mt-2 text-sm text-yellow-700">
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
            class="text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-2 py-1 rounded transition-colors"
          >
            View Tasks
          </RouterLink>
          <button
            @click="dismissed = true"
            class="ml-3 text-sm text-yellow-700 hover:text-yellow-600"
          >
            Dismiss
          </button>
        </div>
      </div>
      <div class="ml-auto flex-shrink-0">
        <button
          @click="dismissed = true"
          class="bg-white rounded-md inline-flex text-yellow-400 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        >
          <span class="sr-only">Close</span>
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useTaskStore } from '@/stores/tasks'

const taskStore = useTaskStore()
const dismissed = ref(false)

// Reset dismissed state when new tasks become upcoming
watch(() => taskStore.upcomingTasks.length, (newCount, oldCount) => {
  if (newCount > oldCount) {
    dismissed.value = false
  }
})
</script>