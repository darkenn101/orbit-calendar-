<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">Task Dashboard</h1>
      <p class="mt-1 text-sm text-gray-600">
        Manage your tasks efficiently
      </p>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="card p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
              </svg>
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
              <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
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
            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Due Soon</dt>
              <dd class="text-lg font-medium text-gray-900">{{ taskStore.upcomingTasks.length }}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Task Button -->
    <div class="mb-6">
      <button
        @click="showAddTask = true"
        class="btn-primary inline-flex items-center"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add New Task
      </button>
    </div>

    <!-- Tasks List -->
    <div class="space-y-6">
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
    </div>

    <!-- Add/Edit Task Modal -->
    <TaskModal
      v-if="showAddTask || editingTask"
      :task="editingTask"
      @close="closeModal"
      @save="saveTask"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTaskStore } from '@/stores/tasks'
import TaskItem from '@/components/TaskItem.vue'
import TaskModal from '@/components/TaskModal.vue'
import type { Task } from '@/types'

const taskStore = useTaskStore()

const showAddTask = ref(false)
const editingTask = ref<Task | null>(null)

let unsubscribe: (() => void) | undefined = undefined

onMounted(() => {
  unsubscribe = taskStore.loadTasks()
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
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

const closeModal = () => {
  showAddTask.value = false
  editingTask.value = null
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