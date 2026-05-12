<template>
  <div id="app">
    <div v-if="authStore.loading" class="min-h-screen flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>
    <template v-else>
      <AppNavigation v-if="authStore.user" />
      <main :class="{ 'ml-64': authStore.user }">
        <RouterView />
      </main>
      <NotificationBar />
      <CommandPalette v-if="authStore.user" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTaskStore } from '@/stores/tasks'
import { useNoteStore } from '@/stores/notes'
import { useReminderStore } from '@/stores/reminders'
import { useProjectStore } from '@/stores/projects'
import AppNavigation from '@/components/AppNavigation.vue'
import NotificationBar from '@/components/NotificationBar.vue'
import CommandPalette from '@/components/CommandPalette.vue'

const authStore = useAuthStore()
const taskStore = useTaskStore()
const noteStore = useNoteStore()
const reminderStore = useReminderStore()
const projectStore = useProjectStore()

// Centralised store subscriptions. View-level subscribes still exist for now
// (TODO: consolidate) — Firestore tolerates duplicate listeners.
let unsubs: Array<() => void> = []

const subscribeAll = () => {
  teardown()
  const out: Array<(() => void) | undefined> = [
    taskStore.loadTasks(),
    noteStore.loadNotes(),
    reminderStore.loadReminders(),
    projectStore.loadProjects(),
  ]
  unsubs = out.filter((u): u is () => void => typeof u === 'function')
}

const teardown = () => {
  for (const u of unsubs) u()
  unsubs = []
}

watch(
  () => authStore.user,
  (user) => {
    if (user) subscribeAll()
    else teardown()
  },
)

onMounted(async () => {
  await authStore.initAuth()
  if (authStore.user) subscribeAll()
})

onUnmounted(teardown)
</script>
