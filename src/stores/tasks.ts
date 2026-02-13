import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { Task } from '@/types'
import { useAuthStore } from './auth'

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)

  const authStore = useAuthStore()

  const pendingTasks = computed(() => 
    tasks.value.filter(task => task.status === 'pending')
  )

  const completedTasks = computed(() => 
    tasks.value.filter(task => task.status === 'completed')
  )

  const upcomingTasks = computed(() => {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    return tasks.value.filter(task => {
      const taskDate = task.due_date.toDate()
      return task.status === 'pending' && taskDate <= tomorrow
    })
  })

  const loadTasks = () => {
    if (!authStore.user) return

    loading.value = true
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', authStore.user.uid),
      orderBy('due_date', 'asc')
    )

    return onSnapshot(q, (snapshot) => {
      tasks.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[]
      loading.value = false
    })
  }

  const addTask = async (taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!authStore.user) return

    const now = Timestamp.now()
    const newTask = {
      ...taskData,
      userId: authStore.user.uid,
      createdAt: now,
      updatedAt: now
    }

    try {
      await addDoc(collection(db, 'tasks'), newTask)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const taskRef = doc(db, 'tasks', taskId)
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: Timestamp.now()
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId))
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const toggleTaskStatus = async (taskId: string) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    const newStatus = task.status === 'pending' ? 'completed' : 'pending'
    return updateTask(taskId, { status: newStatus })
  }

  return {
    tasks,
    loading,
    pendingTasks,
    completedTasks,
    upcomingTasks,
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus
  }
})