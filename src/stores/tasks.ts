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
import { computeNextOccurrence, expandRecurrence } from '@/utils/recurrence'
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
      tasks.value = snapshot.docs.map(doc => {
        const data = doc.data() as Partial<Task>
        return {
          id: doc.id,
          tags: [],
          projectId: null,
          subtasks: [],
          ...data,
        } as Task
      })
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

    // For recurring templates being completed, materialize the completion
    // and advance the template's due_date to the next occurrence.
    if (task.recurrence && task.status === 'pending') {
      return completeRecurringInstance(task)
    }

    const newStatus = task.status === 'pending' ? 'completed' : 'pending'
    return updateTask(taskId, { status: newStatus })
  }

  const completeRecurringInstance = async (template: Task) => {
    if (!authStore.user || !template.id || !template.recurrence) return { success: false }

    const now = Timestamp.now()
    const completedSnapshot: Omit<Task, 'id'> = {
      title: template.title,
      description: template.description,
      due_date: template.due_date,
      status: 'completed',
      projectId: template.projectId ?? null,
      tags: [...(template.tags ?? [])],
      subtasks: (template.subtasks ?? []).map(s => ({ ...s })),
      recurrence: null,
      recurrenceParentId: template.id,
      userId: authStore.user.uid,
      createdAt: now,
      updatedAt: now,
    }

    try {
      await addDoc(collection(db, 'tasks'), completedSnapshot)
    } catch (error: any) {
      return { success: false, error: error.message }
    }

    const next = computeNextOccurrence(template.recurrence, template.due_date.toDate())
    if (next) {
      return updateTask(template.id, { due_date: Timestamp.fromDate(next) })
    }
    // Series ended — mark template completed too.
    return updateTask(template.id, { status: 'completed' })
  }

  // Merge concrete tasks (whose due_date falls in range) with synthetic
  // future occurrences expanded from any recurring templates.
  const tasksInRange = (from: Date, to: Date): Task[] => {
    const fromMs = from.getTime()
    const toMs = to.getTime()

    const concreteInRange = tasks.value.filter(t => {
      const ms = t.due_date.toDate().getTime()
      return ms >= fromMs && ms <= toMs
    })

    const synthetics: Task[] = []
    for (const t of tasks.value) {
      if (t.recurrence && t.id) {
        synthetics.push(...expandRecurrence(t, from, to))
      }
    }

    return [...concreteInRange, ...synthetics]
  }

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    const updated = (task.subtasks ?? []).map(s =>
      s.id === subtaskId ? { ...s, done: !s.done } : s,
    )
    return updateTask(taskId, { subtasks: updated })
  }

  // Sort key for manual-order-with-date-fallback. Tasks with an explicit
  // `order` use that; everything else falls back to due_date in millis.
  const sortKey = (t: Task): number => {
    if (typeof t.order === 'number') return t.order
    return t.due_date.toMillis()
  }

  // Compute a new order value for a task being dropped between two neighbors.
  // Uses fractional indexing: midpoint of neighbor sort keys.
  const computeDropOrder = (prev: Task | undefined, next: Task | undefined): number => {
    const prevKey = prev ? sortKey(prev) : null
    const nextKey = next ? sortKey(next) : null
    if (prevKey !== null && nextKey !== null) return (prevKey + nextKey) / 2
    if (prevKey !== null) return prevKey + 1000
    if (nextKey !== null) return nextKey - 1000
    return Date.now()
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
    toggleTaskStatus,
    toggleSubtask,
    tasksInRange,
    sortKey,
    computeDropOrder,
  }
})