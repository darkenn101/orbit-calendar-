<template>
  <div class="relative" v-click-outside="close">
    <button
      type="button"
      class="input flex items-center justify-between gap-2 w-full text-left"
      @click="open = !open"
    >
      <span class="flex items-center gap-2 min-w-0">
        <span
          v-if="selectedProject"
          class="w-2.5 h-2.5 rounded-full flex-shrink-0"
          :class="dotClass(selectedProject.color)"
        />
        <InboxIcon v-else class="w-4 h-4 text-ink-subtle flex-shrink-0" />
        <span class="truncate">{{ selectedProject?.name ?? 'Inbox (no project)' }}</span>
      </span>
      <ChevronDownIcon class="w-4 h-4 text-ink-subtle flex-shrink-0" />
    </button>

    <div
      v-if="open"
      class="absolute z-20 mt-1 w-full rounded-lg border border-line bg-elevated shadow-lg overflow-hidden"
    >
      <button
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-overlay"
        @click="select(null)"
      >
        <InboxIcon class="w-4 h-4 text-ink-subtle" />
        <span>Inbox (no project)</span>
      </button>

      <button
        v-for="project in projectStore.projects"
        :key="project.id"
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-overlay"
        @click="select(project.id ?? null)"
      >
        <span class="w-2.5 h-2.5 rounded-full" :class="dotClass(project.color)" />
        <span class="truncate">{{ project.name }}</span>
      </button>

      <div class="border-t border-line">
        <div v-if="!showCreate" class="p-1">
          <button
            type="button"
            class="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-700/20"
            @click="showCreate = true"
          >
            <PlusIcon class="w-4 h-4" />
            <span>New project</span>
          </button>
        </div>

        <form v-else class="p-2 space-y-2" @submit.prevent="createProject">
          <input
            ref="newNameInput"
            v-model="newName"
            type="text"
            class="input text-sm"
            placeholder="Project name"
          />
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="color in colors"
              :key="color"
              type="button"
              class="w-5 h-5 rounded-full border-2 transition-transform"
              :class="[dotClass(color), newColor === color ? 'border-ink scale-110' : 'border-transparent']"
              :title="color"
              @click="newColor = color"
            />
          </div>
          <p v-if="createError" class="text-xs text-red-600 dark:text-red-400">
            {{ createError }}
          </p>
          <div class="flex justify-end gap-2">
            <button type="button" class="text-xs text-ink-subtle hover:text-ink-muted" @click="cancelCreate">
              Cancel
            </button>
            <button
              type="submit"
              class="text-xs font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
              :disabled="!newName.trim() || creating"
            >
              {{ creating ? 'Creating…' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch, type DirectiveBinding } from 'vue'
import { ChevronDownIcon, PlusIcon } from '@heroicons/vue/20/solid'
import { InboxIcon } from '@heroicons/vue/24/outline'
import { useProjectStore } from '@/stores/projects'
import { projectColorClasses } from '@/utils/projectColors'
import type { ProjectColor } from '@/types'

const props = defineProps<{
  modelValue: string | null | undefined
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const projectStore = useProjectStore()

const open = ref(false)
const showCreate = ref(false)
const newName = ref('')
const newColor = ref<ProjectColor>('blue')
const creating = ref(false)
const createError = ref('')
const newNameInput = ref<HTMLInputElement | null>(null)

const colors: ProjectColor[] = [
  'slate', 'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky', 'blue',
  'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
]

const selectedProject = computed(() =>
  props.modelValue ? projectStore.projectsById[props.modelValue] ?? null : null,
)

const dotClass = (color: ProjectColor) => projectColorClasses[color] ?? 'bg-gray-500'

const select = (id: string | null) => {
  emit('update:modelValue', id)
  open.value = false
}

const createProject = async () => {
  if (!newName.value.trim()) return
  creating.value = true
  createError.value = ''
  const result = await projectStore.addProject({ name: newName.value, color: newColor.value })
  creating.value = false
  if (result?.success && result.id) {
    emit('update:modelValue', result.id)
    cancelCreate()
    open.value = false
  } else {
    createError.value = result?.error ?? 'Failed to create project'
  }
}

const cancelCreate = () => {
  showCreate.value = false
  newName.value = ''
  newColor.value = 'blue'
  createError.value = ''
}

const close = () => {
  open.value = false
  cancelCreate()
}

watch(showCreate, async (v) => {
  if (v) {
    await nextTick()
    newNameInput.value?.focus()
  }
})

const vClickOutside = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    ;(el as any)._clickOutsideHandler = (event: MouseEvent) => {
      if (!el.contains(event.target as Node)) binding.value?.()
    }
    document.addEventListener('mousedown', (el as any)._clickOutsideHandler)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('mousedown', (el as any)._clickOutsideHandler)
  },
}
</script>
