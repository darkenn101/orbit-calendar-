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
import type { Reminder } from '@/types'
import { useAuthStore } from './auth'

export const useReminderStore = defineStore('reminders', () => {
  const reminders = ref<Reminder[]>([])
  const loading = ref(false)

  const authStore = useAuthStore()

  const activeReminders = computed(() => 
    reminders.value.filter(reminder => reminder.status === 'active')
  )

  const completedReminders = computed(() => 
    reminders.value.filter(reminder => reminder.status === 'completed')
  )

  const upcomingReminders = computed(() => {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    return reminders.value.filter(reminder => {
      if (reminder.status !== 'active') return false
      
      // Check if reminder is currently active based on start and end dates
      const startDate = reminder.start_date?.toDate()
      const endDate = reminder.end_date?.toDate()
      
      // If no start date, check if end date is upcoming
      if (!startDate && endDate) {
        return endDate <= tomorrow
      }
      
      // If start date exists, check if it's upcoming or currently active
      if (startDate) {
        // If no end date, just check start date
        if (!endDate) {
          return startDate <= tomorrow
        }
        
        // If both dates exist, check if currently in range or starting soon
        return startDate <= tomorrow && (!endDate || now <= endDate)
      }
      
      // No dates specified, always show as upcoming
      return true
    })
  })

  const currentReminders = computed(() => {
    const now = new Date()
    
    return reminders.value.filter(reminder => {
      if (reminder.status !== 'active') return false
      
      const startDate = reminder.start_date?.toDate()
      const endDate = reminder.end_date?.toDate()
      
      // No dates specified, always show
      if (!startDate && !endDate) return true
      
      // Check if currently in the reminder period
      const hasStarted = !startDate || now >= startDate
      const hasNotEnded = !endDate || now <= endDate
      
      return hasStarted && hasNotEnded
    })
  })

  const loadReminders = () => {
    if (!authStore.user) return

    loading.value = true
    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', authStore.user.uid),
      orderBy('createdAt', 'desc')
    )

    return onSnapshot(q, (snapshot) => {
      reminders.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reminder[]
      loading.value = false
    })
  }

  const addReminder = async (reminderData: Omit<Reminder, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!authStore.user) return

    const now = Timestamp.now()
    const newReminder = {
      ...reminderData,
      userId: authStore.user.uid,
      createdAt: now,
      updatedAt: now
    }

    try {
      await addDoc(collection(db, 'reminders'), newReminder)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const updateReminder = async (reminderId: string, updates: Partial<Reminder>) => {
    try {
      const reminderRef = doc(db, 'reminders', reminderId)
      await updateDoc(reminderRef, {
        ...updates,
        updatedAt: Timestamp.now()
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const deleteReminder = async (reminderId: string) => {
    try {
      await deleteDoc(doc(db, 'reminders', reminderId))
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const dismissReminder = async (reminderId: string) => {
    return updateReminder(reminderId, { status: 'dismissed' })
  }

  const completeReminder = async (reminderId: string) => {
    return updateReminder(reminderId, { status: 'completed' })
  }

  const reactivateReminder = async (reminderId: string) => {
    return updateReminder(reminderId, { status: 'active' })
  }

  return {
    reminders,
    loading,
    activeReminders,
    completedReminders,
    upcomingReminders,
    currentReminders,
    loadReminders,
    addReminder,
    updateReminder,
    deleteReminder,
    dismissReminder,
    completeReminder,
    reactivateReminder
  }
})