<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-ink">Calendar View</h1>
      <p class="mt-1 text-sm text-ink-muted">
        View and manage tasks by their due dates
      </p>
    </div>

    <!-- Calendar Header -->
    <div class="card mb-6">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button
              @click="previousMonth"
              class="p-2 text-ink-muted hover:bg-overlay rounded-md transition-colors"
            >
              <ChevronLeftIcon class="w-5 h-5" />
            </button>
            <h2 class="text-xl font-semibold text-ink">
              {{ format(currentDate, 'MMMM yyyy') }}
            </h2>
            <button
              @click="nextMonth"
              class="p-2 text-ink-muted hover:bg-overlay rounded-md transition-colors"
            >
              <ChevronRightIcon class="w-5 h-5" />
            </button>
          </div>

          <button
            @click="goToToday"
            class="btn-primary text-sm"
          >
            Today
          </button>
        </div>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="card">
      <div class="p-6">
        <!-- Day Headers -->
        <div class="grid grid-cols-7 gap-1 mb-2">
          <div
            v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']"
            :key="day"
            class="py-2 text-center text-sm font-medium text-ink-subtle"
          >
            {{ day }}
          </div>
        </div>

        <!-- Calendar Days -->
        <div class="grid grid-cols-7 gap-1">
          <div
            v-for="day in calendarDays"
            :key="`${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`"
            class="min-h-[120px] border border-line rounded-lg p-2 hover:bg-overlay transition-colors cursor-pointer"
            :class="{
              'bg-surface': !day.isCurrentMonth,
              'bg-blue-50 dark:bg-blue-500/15 border-blue-200 dark:border-blue-500/40': isToday(day.date),
              'hover:bg-blue-100 dark:hover:bg-blue-500/25': isToday(day.date)
            }"
            @click="selectDate(day.date)"
          >
            <!-- Date Number -->
            <div
              class="text-sm font-medium mb-2"
              :class="{
                'text-ink-subtle': !day.isCurrentMonth,
                'text-blue-600 dark:text-blue-300': isToday(day.date),
                'text-ink': day.isCurrentMonth && !isToday(day.date)
              }"
            >
              {{ day.date.getDate() }}
            </div>

            <!-- Tasks for this day -->
            <VueDraggable
              v-model="localTasksByDay[dayKey(day.date)]"
              group="calendar-tasks"
              filter=".task-chip-locked"
              :animation="150"
              :delay="100"
              :delay-on-touch-only="true"
              :data-day="dayKey(day.date)"
              class="space-y-1 min-h-[24px]"
              @end="onTaskDrop"
            >
              <div
                v-for="(task, idx) in localTasksByDay[dayKey(day.date)] ?? []"
                :key="task.id ?? `${task.recurrenceParentId}-${task.due_date.toMillis()}-${idx}`"
                :data-task-id="task.id ?? ''"
                class="p-1 rounded text-xs truncate cursor-pointer flex items-center gap-1"
                :class="[
                  getTaskStyle(task),
                  isDraggable(task) ? '' : 'task-chip-locked',
                ]"
                @click.stop="editTask(task)"
                :title="`${task.title}${task.description ? ' - ' + task.description : ''}`"
              >
                <span v-if="task.recurrence || task.recurrenceParentId" class="text-[10px] opacity-70 flex-shrink-0">↻</span>
                <span class="truncate">{{ task.title }}</span>
              </div>
            </VueDraggable>
            <!-- Reminders for this day -->
            <div class="space-y-1">
              <div
                v-for="reminder in getRemindersForDate(day.date)"
                :key="`reminder-${reminder.id}`"
                class="p-1 rounded text-xs truncate cursor-default bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-200 dark:border-purple-500/40"
                :title="`Reminder: ${reminder.title}${reminder.description ? ' - ' + reminder.description : ''}`"
              >
                🔔 {{ reminder.title }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Add Task for Selected Date -->
    <div v-if="selectedDate" class="fixed bottom-6 right-6">
      <button
        @click="showQuickAdd = true"
        class="bg-primary-500 hover:bg-primary-600 text-white rounded-full p-4 shadow-lg transition-colors"
        :title="`Add task for ${format(selectedDate, 'MMM d, yyyy')}`"
      >
        <PlusIcon class="w-6 h-6" />
      </button>
    </div>

    <!-- Task Modal -->
    <TaskModal
      v-if="showQuickAdd || editingTask"
      :task="editingTask"
      :default-date="selectedDate"
      @close="closeModal"
      @save="saveTask"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/vue/24/outline'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  startOfDay,
  addMonths,
  subMonths
} from 'date-fns'
import { Timestamp } from 'firebase/firestore'
import { VueDraggable } from 'vue-draggable-plus'
import { useTaskStore } from '@/stores/tasks'
import { useReminderStore } from '@/stores/reminders'
import TaskModal from '@/components/TaskModal.vue'
import type { Task } from '@/types'

const taskStore = useTaskStore()
const reminderStore = useReminderStore()

const currentDate = ref(new Date())
const selectedDate = ref<Date | null>(null)
const showQuickAdd = ref(false)
const editingTask = ref<Task | null>(null)

let unsubscribe: (() => void) | undefined = undefined

let unsubscribeReminders: (() => void) | undefined = undefined

onMounted(() => {
  unsubscribe = taskStore.loadTasks()
  unsubscribeReminders = reminderStore.loadReminders()
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
  if (unsubscribeReminders) unsubscribeReminders()
})

const calendarRange = computed(() => {
  const monthStart = startOfMonth(currentDate.value)
  const monthEnd = endOfMonth(currentDate.value)
  return {
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
  }
})

const calendarDays = computed(() =>
  eachDayOfInterval({
    start: calendarRange.value.start,
    end: calendarRange.value.end,
  }).map(date => ({
    date,
    isCurrentMonth: isSameMonth(date, currentDate.value),
  })),
)

// Concrete tasks + synthetic recurring instances for the visible range.
const tasksInWindow = computed(() =>
  taskStore.tasksInRange(calendarRange.value.start, calendarRange.value.end),
)

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

const getTasksForDate = (date: Date) => {
  return tasksInWindow.value.filter(task => isSameDay(task.due_date.toDate(), date))
}

// Per-cell writable arrays. VueDraggable mutates these on drop; the watcher
// below rebuilds them whenever the underlying tasks change so snapshots win.
const localTasksByDay = ref<Record<string, Task[]>>({})

const refreshLocalTasksByDay = () => {
  const map: Record<string, Task[]> = {}
  for (const day of calendarDays.value) {
    map[dayKey(day.date)] = getTasksForDate(day.date)
  }
  localTasksByDay.value = map
}

watch([calendarDays, tasksInWindow], refreshLocalTasksByDay, { immediate: true })

const isDraggable = (task: Task) => {
  if (!task.id) return false                   // synthetic recurring instance
  if (task.status === 'completed') return false // historical record
  return true
}

const onTaskDrop = async (event: any) => {
  const fromDay: string | undefined = event.from?.dataset?.day
  const toDay: string | undefined = event.to?.dataset?.day
  if (!fromDay || !toDay || fromDay === toDay) return

  const taskId: string | undefined = event.item?.dataset?.taskId
  if (!taskId) return
  const task = taskStore.tasks.find(t => t.id === taskId)
  if (!task) return

  const [y, m, d] = toDay.split('-').map(Number)
  const newDate = new Date(task.due_date.toDate())
  newDate.setFullYear(y, m, d) // preserve original hour/minute

  await taskStore.updateTask(taskId, { due_date: Timestamp.fromDate(newDate) })
}

const getRemindersForDate = (date: Date) => {
  const dayStart = startOfDay(date)
  return reminderStore.reminders.filter(reminder => {
    if (reminder.status !== 'active') return false
    const start = reminder.start_date ? startOfDay(reminder.start_date.toDate()) : undefined
    const end = reminder.end_date ? startOfDay(reminder.end_date.toDate()) : undefined
    if (start && end) {
      return dayStart >= start && dayStart <= end
    } else if (start) {
      return isSameDay(dayStart, start)
    } else if (end) {
      return isSameDay(dayStart, end)
    }
    return false
  })
}

const getTaskStyle = (task: Task) => {
  if (task.status === 'completed') {
    return 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-500/20 dark:text-green-200 dark:border-green-500/40'
  } else {
    const taskDate = task.due_date.toDate()
    const now = new Date()

    if (taskDate < now) {
      return 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-500/20 dark:text-red-200 dark:border-red-500/40'
    } else if (isToday(taskDate)) {
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-200 dark:border-yellow-500/40'
    } else {
      return 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-500/40'
    }
  }
}

const previousMonth = () => {
  currentDate.value = subMonths(currentDate.value, 1)
}

const nextMonth = () => {
  currentDate.value = addMonths(currentDate.value, 1)
}

const goToToday = () => {
  currentDate.value = new Date()
  selectedDate.value = new Date()
}

const selectDate = (date: Date) => {
  selectedDate.value = date
}

const editTask = (task: Task) => {
  // Synthetic recurring instance: route to its template since the instance has no id.
  if (!task.id && task.recurrenceParentId) {
    const template = taskStore.tasks.find(t => t.id === task.recurrenceParentId)
    if (template) editingTask.value = template
    return
  }
  editingTask.value = task
}

const closeModal = () => {
  showQuickAdd.value = false
  editingTask.value = null
  selectedDate.value = null
}

const saveTask = async (taskData: any) => {
  if (editingTask.value) {
    await taskStore.updateTask(editingTask.value.id!, taskData)
  } else {
    await taskStore.addTask(taskData)
  }
  closeModal()
}
</script>