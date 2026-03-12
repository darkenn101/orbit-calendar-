<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">Task & Reminder Dashboard</h1>
      <p class="mt-1 text-sm text-gray-600">
        Manage your tasks and reminders efficiently
      </p>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      <div class="card p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <ClockIcon class="w-4 h-4 text-yellow-600" />
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Pending Tasks</dt>
              <dd class="text-lg font-medium text-gray-900">{{ taskStore.pendingTasks.length }}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckIcon class="w-4 h-4 text-green-600" />
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Completed</dt>
              <dd class="text-lg font-medium text-gray-900">{{ taskStore.completedTasks.length }}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <InformationCircleIcon class="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Active Reminders</dt>
              <dd class="text-lg font-medium text-gray-900">{{ reminderStore.activeReminders.length }}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon class="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Current Reminders</dt>
              <dd class="text-lg font-medium text-gray-900">{{ reminderStore.currentReminders.length }}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Buttons -->
    <div class="mb-6 flex gap-3">
      <button
        @click="showAddTask = true"
        class="btn-primary inline-flex items-center"
      >
        <PlusIcon class="w-4 h-4 mr-2" />
        Add New Task
      </button>

      <button
        @click="showAddReminder = true"
        class="btn-secondary inline-flex items-center"
      >
        <PlusIcon class="w-4 h-4 mr-2" />
        Add New Reminder
      </button>
    </div>

    <!-- Content Sections -->
    <div class="space-y-6">
      <!-- Current Reminders -->
      <div v-if="reminderStore.currentReminders.length > 0" class="card">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <InformationCircleIcon class="w-5 h-5 text-blue-600" />
            Current Reminders
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

      <!-- Pending Tasks -->
      <div class="card">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Pending Tasks</h3>
          
          <div v-if="taskStore.loading" class="text-center py-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
          </div>
          
          <div v-else-if="taskStore.pendingTasks.length === 0" class="text-gray-500 text-center py-8">
            No pending tasks. Great job! 🎉
          </div>
          
          <div v-else class="space-y-3">
            <TaskItem
              v-for="task in taskStore.pendingTasks"
              :key="task.id"
              :task="task"
              @edit="editTask"
              @delete="deleteTask"
              @toggle="toggleTask"
            />
          </div>
        </div>
      </div>

      <!-- Completed Tasks -->
      <div v-if="taskStore.completedTasks.length > 0" class="card">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Completed Tasks</h3>
          <div class="space-y-3">
            <TaskItem
              v-for="task in taskStore.completedTasks"
              :key="task.id"
              :task="task"
              @edit="editTask"
              @delete="deleteTask"
              @toggle="toggleTask"
            />
          </div>
        </div>
      </div>

      <!-- All Reminders -->
      <div v-if="reminderStore.activeReminders.length > 0" class="card">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">All Active Reminders</h3>
          
          <div v-if="reminderStore.loading" class="text-center py-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
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
    </div>

    <!-- Add/Edit Task Modal -->
    <TaskModal
      v-if="showAddTask || editingTask"
      :task="editingTask"
      @close="closeTaskModal"
      @save="saveTask"
    />
    
    <!-- Add/Edit Reminder Modal -->
    <ReminderModal
      v-if="showAddReminder || editingReminder"
      :reminder="editingReminder"
      @close="closeReminderModal"
      @save="saveReminder"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTaskStore } from '@/stores/tasks'
import { useReminderStore } from '@/stores/reminders'
import TaskItem from '@/components/TaskItem.vue'
import TaskModal from '@/components/TaskModal.vue'
import ReminderItem from '@/components/ReminderItem.vue'
import ReminderModal from '@/components/ReminderModal.vue'
import type { Task, Reminder } from '@/types'
import { ClockIcon, CheckIcon, InformationCircleIcon, ExclamationTriangleIcon, PlusIcon } from '@heroicons/vue/20/solid'

const taskStore = useTaskStore()
const reminderStore = useReminderStore()

const showAddTask = ref(false)
const editingTask = ref<Task | null>(null)
const showAddReminder = ref(false)
const editingReminder = ref<Reminder | null>(null)

let taskUnsubscribe: (() => void) | undefined = undefined
let reminderUnsubscribe: (() => void) | undefined = undefined

onMounted(() => {
  taskUnsubscribe = taskStore.loadTasks()
  reminderUnsubscribe = reminderStore.loadReminders()
})

onUnmounted(() => {
  if (taskUnsubscribe) {
    taskUnsubscribe()
  }
  if (reminderUnsubscribe) {
    reminderUnsubscribe()
  }
})

// Task methods
const editTask = (task: Task) => {
  editingTask.value = task
}

const deleteTask = async (taskId: string) => {
  if (confirm('Are you sure you want to delete this task?')) {
    await taskStore.deleteTask(taskId)
  }
}

const toggleTask = async (taskId: string) => {
  await taskStore.toggleTaskStatus(taskId)
}

const closeTaskModal = () => {
  showAddTask.value = false
  editingTask.value = null
}

const saveTask = async (taskData: any) => {
  if (editingTask.value) {
    await taskStore.updateTask(editingTask.value.id!, taskData)
  } else {
    await taskStore.addTask(taskData)
  }
  closeTaskModal()
}

// Reminder methods
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

const closeReminderModal = () => {
  showAddReminder.value = false
  editingReminder.value = null
}

const saveReminder = async (reminderData: any) => {
  if (editingReminder.value) {
    await reminderStore.updateReminder(editingReminder.value.id!, reminderData)
  } else {
    await reminderStore.addReminder(reminderData)
  }
  closeReminderModal()
}
</script>