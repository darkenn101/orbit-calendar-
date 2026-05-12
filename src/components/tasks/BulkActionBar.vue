<template>
  <div
    class="fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none"
  >
    <div class="pointer-events-auto inline-flex items-center gap-2 px-3 py-2 rounded-xl shadow-2xl bg-elevated border border-line">
      <span class="px-2 text-sm font-medium text-ink whitespace-nowrap">
        {{ count }} selected
      </span>
      <span class="h-5 w-px bg-line" />
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-ink-muted hover:bg-overlay transition-colors"
        @click="$emit('complete')"
        :disabled="busy"
      >
        <CheckIcon class="w-4 h-4 text-green-600 dark:text-green-300" />
        Complete
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-ink-muted hover:bg-overlay transition-colors"
        @click="$emit('uncomplete')"
        :disabled="busy"
      >
        <ArrowUturnLeftIcon class="w-4 h-4" />
        Uncomplete
      </button>

      <!-- Move to project -->
      <div class="relative">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-ink-muted hover:bg-overlay transition-colors"
          @click="toggleMenu('project')"
          :disabled="busy"
        >
          <FolderIcon class="w-4 h-4" />
          Move
          <ChevronUpIcon class="w-3 h-3" />
        </button>
        <div
          v-if="openMenu === 'project'"
          class="absolute bottom-full mb-2 left-0 z-50 w-56 max-h-72 overflow-y-auto bg-elevated rounded-md shadow-lg border border-line py-1"
        >
          <button
            type="button"
            class="w-full text-left px-3 py-1.5 text-xs text-ink-muted hover:bg-overlay flex items-center gap-2"
            @click="onMove(null)"
          >
            <InboxIcon class="w-3.5 h-3.5" />
            Inbox
          </button>
          <button
            v-for="p in projectStore.projects"
            :key="p.id"
            type="button"
            class="w-full text-left px-3 py-1.5 text-xs text-ink-muted hover:bg-overlay flex items-center gap-2"
            @click="onMove(p.id!)"
          >
            <span class="w-2 h-2 rounded-full" :class="projectColorClasses[p.color]" />
            {{ p.name }}
          </button>
        </div>
      </div>

      <!-- Add tag -->
      <div class="relative">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-ink-muted hover:bg-overlay transition-colors"
          @click="toggleMenu('tag')"
          :disabled="busy"
        >
          <HashtagIcon class="w-4 h-4" />
          Tag
          <ChevronUpIcon class="w-3 h-3" />
        </button>
        <div
          v-if="openMenu === 'tag'"
          class="absolute bottom-full mb-2 left-0 z-50 w-56 bg-elevated rounded-md shadow-lg border border-line p-2"
        >
          <input
            v-model="newTag"
            type="text"
            placeholder="new tag or pick existing"
            class="w-full px-2 py-1 text-xs bg-surface border border-line rounded text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary-400"
            @keydown.enter.prevent="addNewTag"
          />
          <div v-if="availableTags.length" class="mt-2 max-h-44 overflow-y-auto space-y-0.5">
            <button
              v-for="tag in availableTags"
              :key="tag"
              type="button"
              class="w-full text-left px-2 py-1 text-xs text-ink-muted rounded hover:bg-overlay"
              @click="onAddTag(tag)"
            >
              #{{ tag }}
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        @click="$emit('delete')"
        :disabled="busy"
      >
        <TrashIcon class="w-4 h-4" />
        Delete
      </button>
      <span class="h-5 w-px bg-line" />
      <button
        type="button"
        class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-ink-subtle hover:bg-overlay transition-colors"
        @click="$emit('clear')"
      >
        <XMarkIcon class="w-3.5 h-3.5" />
        Clear
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  CheckIcon,
  ArrowUturnLeftIcon,
  FolderIcon,
  HashtagIcon,
  TrashIcon,
  XMarkIcon,
  InboxIcon,
  ChevronUpIcon,
} from '@heroicons/vue/24/outline'
import { useProjectStore } from '@/stores/projects'
import { useTaskStore } from '@/stores/tasks'
import { projectColorClasses } from '@/utils/projectColors'

defineProps<{
  count: number
  busy?: boolean
}>()

const emit = defineEmits<{
  complete: []
  uncomplete: []
  delete: []
  move: [projectId: string | null]
  tag: [tag: string]
  clear: []
}>()

const projectStore = useProjectStore()
const taskStore = useTaskStore()

const openMenu = ref<string | null>(null)
const toggleMenu = (key: string) => {
  openMenu.value = openMenu.value === key ? null : key
}
const close = () => { openMenu.value = null }

const onDocClick = (e: MouseEvent) => {
  const t = e.target as HTMLElement
  if (!t.closest('.relative')) close()
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

const newTag = ref('')

const availableTags = computed(() => {
  const set = new Set<string>()
  for (const t of taskStore.tasks) for (const tag of t.tags ?? []) set.add(tag)
  return Array.from(set).sort()
})

const onMove = (projectId: string | null) => {
  emit('move', projectId)
  close()
}
const onAddTag = (tag: string) => {
  emit('tag', tag)
  close()
}
const addNewTag = () => {
  const t = newTag.value.trim().replace(/^#/, '')
  if (!t) return
  emit('tag', t)
  newTag.value = ''
  close()
}
</script>
