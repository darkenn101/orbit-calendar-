import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  getDocs,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { Project, ProjectColor } from '@/types'
import { useAuthStore } from './auth'

export const useProjectStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const loading = ref(false)

  const authStore = useAuthStore()

  const projectsById = computed(() => {
    const map: Record<string, Project> = {}
    for (const p of projects.value) if (p.id) map[p.id] = p
    return map
  })

  const loadProjects = () => {
    if (!authStore.user) return

    loading.value = true
    const q = query(
      collection(db, 'projects'),
      where('userId', '==', authStore.user.uid),
      orderBy('createdAt', 'asc'),
    )

    let active = true
    let currentUnsub: () => void = () => {}
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const subscribe = () => {
      if (!active) return
      currentUnsub = onSnapshot(
        q,
        (snapshot) => {
          projects.value = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Project[]
          loading.value = false
        },
        (error) => {
          console.warn('[orbit] projects listener failed; retrying in 3s', error)
          loading.value = false
          if (retryTimer) clearTimeout(retryTimer)
          retryTimer = setTimeout(() => {
            if (active) subscribe()
          }, 3000)
        },
      )
    }
    subscribe()

    return () => {
      active = false
      if (retryTimer) clearTimeout(retryTimer)
      currentUnsub()
    }
  }

  const addProject = async (data: { name: string; color: ProjectColor }) => {
    if (!authStore.user) return { success: false, error: 'Not signed in' }

    const newProject = {
      name: data.name.trim(),
      color: data.color,
      userId: authStore.user.uid,
      createdAt: Timestamp.now(),
    }

    try {
      const ref = await addDoc(collection(db, 'projects'), newProject)
      return { success: true, id: ref.id }
    } catch (error: any) {
      console.warn('[orbit] addProject failed', error)
      return { success: false, error: error.message }
    }
  }

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      await updateDoc(doc(db, 'projects', id), updates)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Cascade delete: removes the project and every task whose projectId matches.
  const deleteProject = async (id: string) => {
    if (!authStore.user) return { success: false, error: 'Not signed in' }
    try {
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', authStore.user.uid),
        where('projectId', '==', id),
      )
      const tasksSnap = await getDocs(tasksQuery)

      const batch = writeBatch(db)
      tasksSnap.forEach((t) => batch.delete(t.ref))
      batch.delete(doc(db, 'projects', id))
      await batch.commit()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  return {
    projects,
    loading,
    projectsById,
    loadProjects,
    addProject,
    updateProject,
    deleteProject,
  }
})
