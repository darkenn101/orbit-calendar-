<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">Calendar View</h1>
      <p class="mt-1 text-sm text-gray-600">
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
              class="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronLeftIcon class="w-5 h-5" />
            </button>
            <h2 class="text-xl font-semibold text-gray-900">
              {{ format(currentDate, 'MMMM yyyy') }}
            </h2>
            <button
              @click="nextMonth"
              class="p-2 hover:bg-gray-100 rounded-md transition-colors"
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
            class="py-2 text-center text-sm font-medium text-gray-500"
          >
            {{ day }}
          </div>
        </div>

        <!-- Calendar Days -->
        <div class="grid grid-cols-7 gap-1">
          <div
            v-for="day in calendarDays"
            :key="`${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`"
            class="min-h-[120px] border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition-colors cursor-pointer"
            :class="{
              'bg-gray-50': !day.isCurrentMonth,
              'bg-blue-50 border-blue-200': isToday(day.date),
              'hover:bg-blue-100': isToday(day.date)
            }"
            @click="selectDate(day.date)"
          >
            <!-- Date Number -->
            <div 
              class="text-sm font-medium mb-2"
              :class="{
                'text-gray-400': !day.isCurrentMonth,
                'text-blue-600': isToday(day.date),
                'text-gray-900': day.isCurrentMonth && !isToday(day.date)
              }"
            >
              {{ day.date.getDate() }}
            </div>

            <!-- Tasks for this day -->
            <div class="space-y-1">
              <div
                v-for="task in getTasksForDate(day.date)"
                :key="task.id"
                class="p-1 rounded text-xs truncate cursor-pointer"
                :class="getTaskStyle(task)"
                @click.stop="editTask(task)"
                :title="`${task.title} - ${task.description}`"
              >
                {{ task.title }}
              </div>
              <!-- Reminders for this day -->
              <div
                v-for="reminder in getRemindersForDate(day.date)"
                :key="`reminder-${reminder.id}`"
                class="p-1 rounded text-xs truncate cursor-default bg-purple-100 text-purple-800 border border-purple-200"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
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

const calendarDays = computed(() => {
  const monthStart = startOfMonth(currentDate.value)
  const monthEnd = endOfMonth(currentDate.value)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  return eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  }).map(date => ({
    date,
    isCurrentMonth: isSameMonth(date, currentDate.value)
  }))
})

const getTasksForDate = (date: Date) => {
  return taskStore.tasks.filter(task => {
    const taskDate = task.due_date.toDate()
    return isSameDay(taskDate, date)
  })
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
    return 'bg-green-100 text-green-800 border border-green-200'
  } else {
    const taskDate = task.due_date.toDate()
    const now = new Date()
    
    if (taskDate < now) {
      return 'bg-red-100 text-red-800 border border-red-200'
    } else if (isToday(taskDate)) {
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
    } else {
      return 'bg-blue-100 text-blue-800 border border-blue-200'
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