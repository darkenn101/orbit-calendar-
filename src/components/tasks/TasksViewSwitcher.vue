<template>
  <div class="inline-flex items-center rounded-lg border border-line bg-elevated p-0.5">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors"
      :class="modelValue === opt.value
        ? 'bg-primary-500 text-white'
        : 'text-ink-muted hover:bg-overlay'"
      @click="emit('update:modelValue', opt.value)"
    >
      <component :is="opt.icon" class="w-4 h-4" />
      <span class="hidden sm:inline">{{ opt.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ListBulletIcon, CalendarDaysIcon, ViewColumnsIcon, FolderIcon } from '@heroicons/vue/24/outline'
import type { TaskViewMode } from '@/composables/useTaskViewMode'

defineProps<{
  modelValue: TaskViewMode
}>()

const emit = defineEmits<{
  'update:modelValue': [v: TaskViewMode]
}>()

const options: { value: TaskViewMode; label: string; icon: any }[] = [
  { value: 'list', label: 'List', icon: ListBulletIcon },
  { value: 'agenda', label: 'Agenda', icon: CalendarDaysIcon },
  { value: 'kanban', label: 'Kanban', icon: ViewColumnsIcon },
  { value: 'projects', label: 'By Project', icon: FolderIcon },
]
</script>
