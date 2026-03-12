<template>
  <RouterLink 
    to="/reminders" 
    v-if="reminderStore.currentReminders.length > 0"
    class="inline-flex items-center px-3 py-2 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors animate-pulse cursor-pointer"
  >
    <InformationCircleIcon class="w-3 h-3 mr-1" />
    {{ reminderStore.currentReminders.length }} Active Reminder{{ reminderStore.currentReminders.length === 1 ? '' : 's' }}
  </RouterLink>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useReminderStore } from '@/stores/reminders'
import { InformationCircleIcon } from '@heroicons/vue/20/solid'

const reminderStore = useReminderStore()

let unsubscribe: (() => void) | undefined = undefined

onMounted(() => {
  // Load reminders when component mounts
  unsubscribe = reminderStore.loadReminders()
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>