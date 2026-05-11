<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-ink">Reminders</h1>
      <p class="mt-1 text-sm text-ink-muted">
        Manage your reminders and set time-based alerts
      </p>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="card p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center">
              <InformationCircleIcon class="w-4 h-4 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-ink-subtle truncate">Upcoming Reminders</dt>
              <dd class="text-lg font-medium text-ink">{{ reminderStore.activeReminders.length }}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckIcon class="w-4 h-4 text-green-600 dark:text-green-300" />
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-ink-subtle truncate">Completed</dt>
              <dd class="text-lg font-medium text-ink">{{ reminderStore.completedReminders.length }}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon class="w-4 h-4 text-red-600 dark:text-red-300" />
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-ink-subtle truncate">Active</dt>
              <dd class="text-lg font-medium text-ink">{{ reminderStore.currentReminders.length }}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Reminder Button -->
    <div class="mb-6">
      <button
        @click="showAddReminder = true"
        class="btn-primary inline-flex items-center"
      >
        <PlusIcon class="w-4 h-4 mr-2" />
        Add New Reminder
      </button>
    </div>

    <!-- Reminders List -->
    <div class="space-y-6">
      <!-- Current Reminders -->
      <div v-if="reminderStore.currentReminders.length > 0" class="card">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-ink mb-4 flex items-center gap-2">
            <div class="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full animate-pulse"></div>
            Active Reminders
          </h3>
          <div class="space-y-3">
            <ReminderItem
              v-for="reminder in reminderStore.currentReminders"
              :key="reminder.id"
              :reminder="reminder"
              @edit="editReminder"
              @delete="deleteReminder"
              @complete="completeReminder"
              @dismiss="dismissReminder"
              @reactivate="reactivateReminder"
            />
          </div>
        </div>
      </div>

      <!-- All Active Reminders -->
      <div class="card">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-ink mb-4">All Upcoming Reminders</h3>
          
          <div v-if="reminderStore.loading" class="text-center py-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
          </div>
          
          <div v-else-if="reminderStore.activeReminders.length === 0" class="text-ink-subtle text-center py-8">
            No upcoming reminders. Create one to get started! 📝
          </div>
          
          <div v-else class="space-y-3">
            <ReminderItem
              v-for="reminder in reminderStore.activeReminders"
              :key="reminder.id"
              :reminder="reminder"
              @edit="editReminder"
              @delete="deleteReminder"
              @complete="completeReminder"
              @dismiss="dismissReminder"
              @reactivate="reactivateReminder"
            />
          </div>
        </div>
      </div>

      <!-- Completed Reminders -->
      <div v-if="reminderStore.completedReminders.length > 0" class="card">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-ink mb-4">Completed Reminders</h3>
          <div class="space-y-3">
            <ReminderItem
              v-for="reminder in reminderStore.completedReminders"
              :key="reminder.id"
              :reminder="reminder"
              @edit="editReminder"
              @delete="deleteReminder"
              @complete="completeReminder"
              @dismiss="dismissReminder"
              @reactivate="reactivateReminder"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Reminder Modal -->
    <ReminderModal
      v-if="showAddReminder || editingReminder"
      :reminder="editingReminder"
      @close="closeModal"
      @save="saveReminder"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useReminderStore } from '@/stores/reminders'
import ReminderItem from '@/components/ReminderItem.vue'
import ReminderModal from '@/components/ReminderModal.vue'
import type { Reminder } from '@/types'
import { InformationCircleIcon, CheckIcon, ExclamationTriangleIcon, PlusIcon } from '@heroicons/vue/20/solid'

const reminderStore = useReminderStore()

const showAddReminder = ref(false)
const editingReminder = ref<Reminder | null>(null)

let unsubscribe: (() => void) | undefined = undefined

onMounted(() => {
  unsubscribe = reminderStore.loadReminders()
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

const editReminder = (reminder: Reminder) => {
  editingReminder.value = reminder
}

const deleteReminder = async (reminderId: string) => {
  if (confirm('Are you sure you want to delete this reminder?')) {
    await reminderStore.deleteReminder(reminderId)
  }
}

const completeReminder = async (reminderId: string) => {
  await reminderStore.completeReminder(reminderId)
}

const dismissReminder = async (reminderId: string) => {
  await reminderStore.dismissReminder(reminderId)
}

const reactivateReminder = async (reminderId: string) => {
  await reminderStore.reactivateReminder(reminderId)
}

const closeModal = () => {
  showAddReminder.value = false
  editingReminder.value = null
}

const saveReminder = async (reminderData: any) => {
  if (editingReminder.value) {
    await reminderStore.updateReminder(editingReminder.value.id!, reminderData)
  } else {
    await reminderStore.addReminder(reminderData)
  }
  closeModal()
}
</script>