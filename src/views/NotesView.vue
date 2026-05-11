<template>
  <div class="h-[calc(100vh-0px)] flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-line bg-elevated">
      <div>
        <h1 class="text-2xl font-semibold text-ink">Notes</h1>
        <p class="mt-0.5 text-sm text-ink-subtle">{{ noteStore.notes.length }} {{ noteStore.notes.length === 1 ? 'note' : 'notes' }}</p>
      </div>
      <button @click="createNewNote" class="btn-primary inline-flex items-center">
        <PlusIcon class="w-4 h-4 mr-2" />
        New Note
      </button>
    </div>

    <!-- Main Content — Two Panel Layout -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Notes Sidebar -->
      <div class="w-72 border-r border-line flex flex-col bg-elevated">
        <!-- Search -->
        <div class="p-3 border-b border-line">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search notes..."
              class="w-full pl-9 pr-3 py-2 text-sm bg-surface text-ink border border-line rounded-lg placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Notes List -->
        <div class="flex-1 overflow-y-auto">
          <div v-if="noteStore.loading" class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
          </div>
          <div v-else-if="filteredNotes.length === 0" class="text-center py-8 px-4">
            <DocumentTextIcon class="w-12 h-12 text-ink-subtle mx-auto mb-3 opacity-50" />
            <p class="text-sm text-ink-subtle">
              {{ searchQuery ? 'No notes match your search' : 'No notes yet' }}
            </p>
            <button v-if="!searchQuery" @click="createNewNote" class="mt-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium">
              Create your first note
            </button>
          </div>
          <template v-else>
            <!-- Pinned Section -->
            <div v-if="pinnedFiltered.length > 0">
              <div class="px-4 py-1.5 text-xs font-semibold text-ink-subtle uppercase tracking-wider bg-surface/80">
                Pinned
              </div>
              <NoteItem
                v-for="note in pinnedFiltered"
                :key="note.id"
                :note="note"
                :isActive="activeNote?.id === note.id"
                @select="selectNote"
              />
            </div>
            <!-- Unpinned Section -->
            <div v-if="unpinnedFiltered.length > 0">
              <div v-if="pinnedFiltered.length > 0" class="px-4 py-1.5 text-xs font-semibold text-ink-subtle uppercase tracking-wider bg-surface/80">
                Notes
              </div>
              <NoteItem
                v-for="note in unpinnedFiltered"
                :key="note.id"
                :note="note"
                :isActive="activeNote?.id === note.id"
                @select="selectNote"
              />
            </div>
          </template>
        </div>
      </div>

      <!-- Editor Panel -->
      <div class="flex-1 flex flex-col bg-elevated">
        <template v-if="activeNote">
          <!-- Note Header -->
          <div class="flex items-center justify-between px-6 py-3 border-b border-line">
            <input
              v-model="activeTitle"
              @input="debouncedSave"
              type="text"
              placeholder="Untitled Note"
              class="text-lg font-semibold text-ink bg-transparent border-none focus:outline-none flex-1 mr-4 placeholder:text-ink-subtle"
            />
            <div class="flex items-center gap-1">
              <button
                @click="togglePin"
                class="p-2 rounded-lg hover:bg-overlay transition-colors"
                :class="activeNote.isPinned ? 'text-amber-500' : 'text-ink-subtle'"
                :title="activeNote.isPinned ? 'Unpin note' : 'Pin note'"
              >
                <BookmarkIcon class="w-4 h-4" :class="activeNote.isPinned ? '' : 'opacity-40'" />
              </button>
              <button
                @click="deleteCurrentNote"
                class="p-2 rounded-lg text-ink-subtle hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                title="Delete note"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- WYSIWYG Editor -->
          <div class="flex-1 overflow-hidden">
            <NoteEditor v-model="activeContent" @update:modelValue="debouncedSave" />
          </div>
        </template>

        <!-- Empty State -->
        <div v-else class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <DocumentTextIcon class="w-16 h-16 text-ink-subtle opacity-30 mx-auto mb-4" />
            <p class="text-ink-subtle">Select a note or create a new one</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useNoteStore } from '@/stores/notes'
import NoteItem from '@/components/NoteItem.vue'
import NoteEditor from '@/components/NoteEditor.vue'
import type { Note } from '@/types'
import { PlusIcon, MagnifyingGlassIcon, DocumentTextIcon, BookmarkIcon, TrashIcon } from '@heroicons/vue/24/outline'

const noteStore = useNoteStore()

const searchQuery = ref('')
const activeNote = ref<Note | null>(null)
const activeTitle = ref('')
const activeContent = ref('')
let saveTimeout: ReturnType<typeof setTimeout> | null = null
let unsubscribe: (() => void) | undefined

const filteredNotes = computed(() => {
  if (!searchQuery.value) return noteStore.sortedNotes
  const q = searchQuery.value.toLowerCase()
  return noteStore.sortedNotes.filter(note =>
    note.title.toLowerCase().includes(q) ||
    note.content.replace(/<[^>]*>/g, '').toLowerCase().includes(q)
  )
})

const pinnedFiltered = computed(() =>
  filteredNotes.value.filter(n => n.isPinned)
)

const unpinnedFiltered = computed(() =>
  filteredNotes.value.filter(n => !n.isPinned)
)

// Keep active note in sync with store updates (real-time)
watch(() => noteStore.notes, (newNotes) => {
  if (activeNote.value) {
    const updated = newNotes.find(n => n.id === activeNote.value!.id)
    if (updated) {
      activeNote.value = updated
    } else {
      // Note was deleted
      activeNote.value = null
      activeTitle.value = ''
      activeContent.value = ''
    }
  }
}, { deep: true })

const selectNote = (note: Note) => {
  // Save any pending changes before switching
  flushSave()
  activeNote.value = note
  activeTitle.value = note.title
  activeContent.value = note.content
}

const createNewNote = async () => {
  const result = await noteStore.addNote({
    title: '',
    content: '',
    isPinned: false,
  })
  if (result?.success && result.id) {
    // Wait for the snapshot to pick up the new note, then select it
    const checkForNote = () => {
      const newNote = noteStore.notes.find(n => n.id === result.id)
      if (newNote) {
        selectNote(newNote)
      } else {
        setTimeout(checkForNote, 100)
      }
    }
    checkForNote()
  }
}

const debouncedSave = () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(saveActiveNote, 500)
}

const flushSave = () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = null
    saveActiveNote()
  }
}

const saveActiveNote = () => {
  if (!activeNote.value?.id) return
  noteStore.updateNote(activeNote.value.id, {
    title: activeTitle.value,
    content: activeContent.value,
  })
}

const togglePin = () => {
  if (!activeNote.value?.id) return
  noteStore.togglePin(activeNote.value.id)
}

const deleteCurrentNote = async () => {
  if (!activeNote.value?.id) return
  if (!confirm('Are you sure you want to delete this note?')) return

  await noteStore.deleteNote(activeNote.value.id)
  activeNote.value = null
  activeTitle.value = ''
  activeContent.value = ''
}

onMounted(() => {
  unsubscribe = noteStore.loadNotes()
})

onUnmounted(() => {
  flushSave()
  if (unsubscribe) unsubscribe()
})
</script>
