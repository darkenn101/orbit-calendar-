<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-ink">Task & Reminder Dashboard</h1>
      <p class="mt-1 text-sm text-ink-muted">
        Manage your tasks and reminders efficiently
      </p>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      <div class="card p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-yellow-100 dark:bg-yellow-500/20 rounded-full flex items-center justify-center">
              <ClockIcon class="w-4 h-4 text-yellow-600 dark:text-yellow-300" />
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-ink-subtle truncate">Pending Tasks</dt>
              <dd class="text-lg font-medium text-ink">{{ taskStore.pendingTasks.length }}</dd>
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
              <dd class="text-lg font-medium text-ink">{{ taskStore.completedTasks.length }}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center">
              <InformationCircleIcon class="w-4 h-4 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-ink-subtle truncate">Active Reminders</dt>
              <dd class="text-lg font-medium text-ink">{{ reminderStore.activeReminders.length }}</dd>
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
              <dt class="text-sm font-medium text-ink-subtle truncate">Current Reminders</dt>
              <dd class="text-lg font-medium text-ink">{{ reminderStore.currentReminders.length }}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick add bar -->
    <div class="mb-4">
      <QuickAddBar />
    </div>

    <!-- Add Buttons -->
    <div class="mb-6 flex gap-3">
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
          <h3 class="text-lg font-medium text-ink mb-4 flex items-center gap-2">
            <InformationCircleIcon class="w-5 h-5 text-blue-600 dark:text-blue-300" />
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

      <!-- Today & Overdue -->
      <div class="card">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-ink">Today &amp; Overdue</h3>
            <RouterLink
              to="/tasks"
              class="text-sm text-primary-600 dark:text-primary-300 hover:underline"
            >
              Manage all tasks →
            </RouterLink>
          </div>

          <div v-if="taskStore.loading" class="text-center py-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
          </div>

          <template v-else>
            <div v-if="overdueTasks.length" class="mb-4">
              <h4 class="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-300 mb-2">
                Overdue ({{ overdueTasks.length }})
              </h4>
              <div class="space-y-2">
                <TaskItem
                  v-for="task in overdueTasks"
                  :key="task.id"
                  :task="task"
                  @edit="editTask"
                  @delete="deleteTask"
                  @toggle="toggleTask"
                  @toggle-subtask="toggleSubtask"
                />
              </div>
            </div>

            <div v-if="todayTasks.length">
              <h4 class="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-2">
                Today ({{ todayTasks.length }})
              </h4>
              <div class="space-y-2">
                <TaskItem
                  v-for="task in todayTasks"
                  :key="task.id"
                  :task="task"
                  @edit="editTask"
                  @delete="deleteTask"
                  @toggle="toggleTask"
                  @toggle-subtask="toggleSubtask"
                />
              </div>
            </div>

            <div
              v-if="!overdueTasks.length && !todayTasks.length"
              class="text-ink-subtle text-center py-6"
            >
              Nothing due today. 🎉
              <RouterLink to="/tasks" class="text-primary-600 dark:text-primary-300 hover:underline">
                View all tasks
              </RouterLink>
            </div>
          </template>
        </div>
      </div>

      <!-- All Reminders -->
      <div v-if="reminderStore.activeReminders.length > 0" class="card">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-ink mb-4">All Active Reminders</h3>

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

    <!-- Edit Task Modal (QuickAddBar opens this for created tasks; editTask for inline edits) -->
    <TaskModal
      v-if="editingTask"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useTaskStore } from '@/stores/tasks'
import { useReminderStore } from '@/stores/reminders'
import { useProjectStore } from '@/stores/projects'
import TaskItem from '@/components/TaskItem.vue'
import TaskModal from '@/components/TaskModal.vue'
import ReminderItem from '@/components/ReminderItem.vue'
import ReminderModal from '@/components/ReminderModal.vue'
import QuickAddBar from '@/components/QuickAddBar.vue'
import { groupTasksByDueBucket } from '@/utils/taskGroups'
import type { Task, Reminder } from '@/types'
import { ClockIcon, CheckIcon, InformationCircleIcon, ExclamationTriangleIcon, PlusIcon } from '@heroicons/vue/20/solid'

const taskStore = useTaskStore()
const reminderStore = useReminderStore()
const projectStore = useProjectStore()

const editingTask = ref<Task | null>(null)
const showAddReminder = ref(false)
const editingReminder = ref<Reminder | null>(null)

const buckets = computed(() => groupTasksByDueBucket(taskStore.pendingTasks))
const overdueTasks = computed(() => buckets.value.overdue)
const todayTasks = computed(() => buckets.value.today)

let taskUnsubscribe: (() => void) | undefined = undefined
let reminderUnsubscribe: (() => void) | undefined = undefined
let projectUnsubscribe: (() => void) | undefined = undefined

onMounted(() => {
  taskUnsubscribe = taskStore.loadTasks()
  reminderUnsubscribe = reminderStore.loadReminders()
  projectUnsubscribe = projectStore.loadProjects()
})

onUnmounted(() => {
  if (taskUnsubscribe) taskUnsubscribe()
  if (reminderUnsubscribe) reminderUnsubscribe()
  if (projectUnsubscribe) projectUnsubscribe()
})

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

const toggleSubtask = async (taskId: string, subtaskId: string) => {
  await taskStore.toggleSubtask(taskId, subtaskId)
}

const closeTaskModal = () => {
  editingTask.value = null
}

const saveTask = async (taskData: any) => {
  if (editingTask.value) {
    await taskStore.updateTask(editingTask.value.id!, taskData)
  }
  closeTaskModal()
}

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
