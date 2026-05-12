<template>
  <div class="h-full flex flex-col bg-elevated">
    <template v-if="task && form">
      <div class="px-6 py-3 border-b border-line flex items-center justify-between gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          :class="form.status === 'completed'
            ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200'
            : 'bg-overlay text-ink-muted hover:bg-line'"
          @click="onToggleStatus"
        >
          <CheckCircleIcon class="w-4 h-4" />
          {{ form.status === 'completed' ? 'Completed' : 'Mark complete' }}
        </button>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="p-2 rounded-lg text-ink-subtle hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            title="Delete task"
            @click="onDelete"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
          <button
            type="button"
            class="p-2 rounded-lg text-ink-subtle hover:text-ink hover:bg-overlay transition-colors lg:hidden"
            title="Close"
            @click="emit('close')"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        <div>
          <input
            v-model="form.title"
            type="text"
            placeholder="Task title"
            class="w-full text-lg font-semibold text-ink bg-transparent border-none focus:outline-none placeholder:text-ink-subtle"
            @input="debouncedSave"
            @blur="flushSave"
          />
        </div>

        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-ink-subtle mb-1">Due date</label>
          <input
            v-model="form.due_date"
            type="datetime-local"
            class="input"
            @change="saveImmediate"
          />
        </div>

        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-ink-subtle mb-1">Project</label>
          <ProjectPicker v-model="form.projectId" @update:modelValue="saveImmediate" />
        </div>

        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-ink-subtle mb-1">Tags</label>
          <TagInput v-model="form.tags" @update:modelValue="saveImmediate" placeholder="Add tag" />
        </div>

        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-ink-subtle mb-1">Description</label>
          <textarea
            v-model="form.description"
            rows="4"
            placeholder="Notes about this task"
            class="input"
            @input="debouncedSave"
            @blur="flushSave"
          ></textarea>
        </div>

        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-ink-subtle mb-1">Checklist</label>
          <SubtaskList v-model="form.subtasks" @update:modelValue="saveImmediate" />
        </div>

        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-ink-subtle mb-1">Repeats</label>
          <RecurrenceEditor v-model="form.recurrence" :anchor-date="recurrenceAnchor" @update:modelValue="saveImmediate" />
        </div>

        <div class="text-xs text-ink-subtle pt-2 border-t border-line">
          <p v-if="task.createdAt">Created {{ formatRelative(task.createdAt) }}</p>
          <p v-if="task.updatedAt">Updated {{ formatRelative(task.updatedAt) }}</p>
        </div>
      </div>
    </template>

    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center px-8">
        <ClipboardDocumentListIcon class="w-16 h-16 text-ink-subtle opacity-30 mx-auto mb-4" />
        <p class="text-ink-subtle">Select a task or create a new one to see details here.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onBeforeUnmount, computed } from 'vue'
import { Timestamp } from 'firebase/firestore'
import { format, formatDistanceToNow } from 'date-fns'
import { CheckCircleIcon, TrashIcon, XMarkIcon, ClipboardDocumentListIcon } from '@heroicons/vue/24/outline'
import type { Task, Subtask, RecurrenceRule } from '@/types'
import ProjectPicker from '@/components/ProjectPicker.vue'
import TagInput from '@/components/TagInput.vue'
import SubtaskList from '@/components/SubtaskList.vue'
import RecurrenceEditor from '@/components/RecurrenceEditor.vue'
import { useTaskStore } from '@/stores/tasks'

interface FormState {
  title: string
  description: string
  due_date: string
  status: 'pending' | 'completed'
  projectId: string | null
  tags: string[]
  subtasks: Subtask[]
  recurrence: RecurrenceRule | null
}

const props = defineProps<{
  task: Task | null
}>()

const emit = defineEmits<{
  close: []
  deleted: [id: string]
}>()

const taskStore = useTaskStore()
const form = ref<FormState | null>(null)
let saveTimeout: ReturnType<typeof setTimeout> | null = null
let lastLoadedId: string | null = null

const recurrenceAnchor = computed(() => {
  if (!form.value?.due_date) return new Date()
  return new Date(form.value.due_date)
})

const formatRelative = (ts: any) => {
  try {
    return formatDistanceToNow(ts.toDate(), { addSuffix: true })
  } catch {
    return ''
  }
}

const persist = async () => {
  if (!form.value || !props.task?.id) return
  const f = form.value
  const updates: Partial<Task> = {
    title: f.title.trim(),
    description: f.description.trim(),
    status: f.status,
    projectId: f.projectId,
    tags: f.tags,
    subtasks: f.subtasks.filter(s => s.text.trim() !== ''),
    recurrence: f.recurrence,
  }
  if (f.due_date) {
    try {
      const d = new Date(f.due_date)
      if (!isNaN(d.getTime())) updates.due_date = Timestamp.fromDate(d)
    } catch {
      // ignore
    }
  }
  await taskStore.updateTask(props.task.id, updates)
}

const debouncedSave = () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(persist, 500)
}

const flushSave = () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = null
    persist()
  }
}

const saveImmediate = () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = null
  }
  persist()
}

const loadForm = (task: Task) => {
  form.value = reactive<FormState>({
    title: task.title ?? '',
    description: task.description ?? '',
    due_date: task.due_date ? format(task.due_date.toDate(), "yyyy-MM-dd'T'HH:mm") : '',
    status: task.status,
    projectId: task.projectId ?? null,
    tags: [...(task.tags ?? [])],
    subtasks: (task.subtasks ?? []).map(s => ({ ...s })),
    recurrence: task.recurrence ? { ...task.recurrence } : null,
  })
  lastLoadedId = task.id ?? null
}

watch(() => props.task?.id, (id) => {
  flushSave()
  if (!props.task) {
    form.value = null
    lastLoadedId = null
    return
  }
  if (id !== lastLoadedId) {
    loadForm(props.task)
  }
}, { immediate: true })

watch(() => props.task, (next, prev) => {
  if (!next || !form.value) return
  if (next.id !== lastLoadedId) return
  if (prev && prev.id === next.id && next.updatedAt && prev.updatedAt && next.updatedAt.toMillis() === prev.updatedAt.toMillis()) return
  form.value.status = next.status
}, { deep: true })

const onToggleStatus = async () => {
  flushSave()
  if (!props.task?.id) return
  await taskStore.toggleTaskStatus(props.task.id)
}

const onDelete = async () => {
  if (!props.task?.id) return
  if (!confirm('Delete this task? This cannot be undone.')) return
  const id = props.task.id
  await taskStore.deleteTask(id)
  emit('deleted', id)
}

onBeforeUnmount(flushSave)
</script>
