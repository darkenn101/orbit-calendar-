<template>
  <button
    @click="emit('select', note)"
    class="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-amber-50/50 transition-colors"
    :class="{ 'bg-amber-50 border-l-2 border-l-amber-400': isActive }"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5">
          <BookmarkIcon
            v-if="note.isPinned"
            class="w-3 h-3 text-amber-500 flex-shrink-0"
          />
          <h4 class="text-sm font-medium text-gray-900 truncate">
            {{ displayTitle }}
          </h4>
        </div>
        <p class="mt-0.5 text-xs text-gray-500 truncate">
          {{ previewText }}
        </p>
      </div>
      <span class="text-xs text-gray-400 flex-shrink-0 mt-0.5">
        {{ formatDate(note.updatedAt) }}
      </span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format, isToday, isYesterday } from 'date-fns'
import type { Note } from '@/types'
import { BookmarkIcon } from '@heroicons/vue/20/solid'

const props = defineProps<{
  note: Note
  isActive: boolean
}>()

const emit = defineEmits<{
  select: [note: Note]
}>()

const displayTitle = computed(() => {
  return props.note.title || 'Untitled Note'
})

const previewText = computed(() => {
  // Strip HTML tags to get a text preview
  const text = props.note.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text || 'No content'
})

const formatDate = (timestamp: any) => {
  if (!timestamp?.toDate) return ''
  const date = timestamp.toDate()

  if (isToday(date)) {
    return format(date, 'h:mm a')
  } else if (isYesterday(date)) {
    return 'Yesterday'
  } else {
    return format(date, 'MMM d')
  }
}
</script>
