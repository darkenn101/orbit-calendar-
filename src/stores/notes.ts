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
import type { Note } from '@/types'
import { useAuthStore } from './auth'

export const useNoteStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const loading = ref(false)

  const authStore = useAuthStore()

  const pinnedNotes = computed(() =>
    notes.value.filter(note => note.isPinned)
  )

  const unpinnedNotes = computed(() =>
    notes.value.filter(note => !note.isPinned)
  )

  const sortedNotes = computed(() => [
    ...pinnedNotes.value,
    ...unpinnedNotes.value
  ])

  const loadNotes = () => {
    if (!authStore.user) return

    loading.value = true
    const q = query(
      collection(db, 'notes'),
      where('userId', '==', authStore.user.uid),
      orderBy('updatedAt', 'desc')
    )

    return onSnapshot(q, (snapshot) => {
      notes.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[]
      loading.value = false
    })
  }

  const addNote = async (noteData: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!authStore.user) return

    const now = Timestamp.now()
    const newNote = {
      ...noteData,
      userId: authStore.user.uid,
      createdAt: now,
      updatedAt: now
    }

    try {
      const docRef = await addDoc(collection(db, 'notes'), newNote)
      return { success: true, id: docRef.id }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    try {
      const noteRef = doc(db, 'notes', noteId)
      await updateDoc(noteRef, {
        ...updates,
        updatedAt: Timestamp.now()
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const deleteNote = async (noteId: string) => {
    try {
      await deleteDoc(doc(db, 'notes', noteId))
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const togglePin = async (noteId: string) => {
    const note = notes.value.find(n => n.id === noteId)
    if (!note) return
    return updateNote(noteId, { isPinned: !note.isPinned })
  }

  return {
    notes,
    loading,
    pinnedNotes,
    unpinnedNotes,
    sortedNotes,
    loadNotes,
    addNote,
    updateNote,
    deleteNote,
    togglePin
  }
})
