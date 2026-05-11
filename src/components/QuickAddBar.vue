<template>
  <div class="card">
    <div class="px-4 py-3">
      <form @submit.prevent="submit" class="flex items-center gap-3">
        <SparklesIcon class="w-5 h-5 text-primary-500 flex-shrink-0" />
        <input
          ref="inputEl"
          v-model="input"
          type="text"
          class="flex-1 bg-transparent border-none outline-none text-sm text-ink placeholder:text-ink-subtle"
          :placeholder="placeholder"
          @keydown.escape="clear"
        />
        <button
          type="submit"
          :disabled="!canSubmit || saving"
          class="btn-primary text-sm py-1.5 px-3 inline-flex items-center gap-1.5"
        >
          <span v-if="saving">Adding…</span>
          <span v-else>Add</span>
          <span class="text-[10px] opacity-70 hidden sm:inline">⏎</span>
        </button>
      </form>

      <div
        v-if="hasInput"
        class="mt-2 ml-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
      >
        <span class="text-ink-subtle">→</span>
        <span class="text-ink font-medium">
          {{ preview.title || '(empty title)' }}
        </span>
        <span
          class="inline-flex items-center px-2 py-0.5 rounded-full"
          :class="preview.dateMatched
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-700/30 dark:text-primary-50'
            : 'bg-overlay text-ink-muted'"
        >
          {{ preview.dateLabel }}
        </span>
        <span
          v-for="tag in preview.tags"
          :key="tag"
          class="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-700/30 dark:text-primary-50"
        >
          #{{ tag }}
        </span>
        <span v-if="defaultProject" class="inline-flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full" :class="projectColorClasses[defaultProject.color]" />
          <span class="text-ink-muted">{{ defaultProject.name }}</span>
        </span>
      </div>

      <p v-if="error" class="mt-2 ml-8 text-xs text-red-600 dark:text-red-400">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import * as chrono from 'chrono-node'
import { Timestamp } from 'firebase/firestore'
import { format, endOfDay } from 'date-fns'
import { SparklesIcon } from '@heroicons/vue/20/solid'
import { useTaskStore } from '@/stores/tasks'
import { useProjectStore } from '@/stores/projects'
import { projectColorClasses } from '@/utils/projectColors'

const props = defineProps<{
  defaultProjectId?: string | null
}>()

const taskStore = useTaskStore()
const projectStore = useProjectStore()

const input = ref('')
const saving = ref(false)
const error = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

const placeholder = 'Quick add — e.g. "call Sam tomorrow 4pm #work"'

const hasInput = computed(() => input.value.trim().length > 0)

const defaultProject = computed(() =>
  props.defaultProjectId ? projectStore.projectsById[props.defaultProjectId] ?? null : null,
)

interface Parsed {
  title: string
  date: Date
  dateMatched: boolean
  dateLabel: string
  tags: string[]
}

const parse = (raw: string): Parsed => {
  const tagMatches = [...raw.matchAll(/#(\w+)/g)]
  const tags = tagMatches.map((m) => m[1].toLowerCase())

  // Strip tags from string before chrono parses, so chrono doesn't get confused
  const withoutTags = raw.replace(/#\w+/g, '').trim()

  const results = chrono.parse(withoutTags, new Date(), { forwardDate: true })
  const first = results[0]
  const dateMatched = !!first
  const matchedText = first?.text ?? ''

  let date: Date
  if (first) {
    date = first.start.date()
    // If chrono didn't certify a time, default to 9am
    if (!first.start.isCertain('hour')) {
      date.setHours(9, 0, 0, 0)
    }
  } else {
    date = endOfDay(new Date())
  }

  // Strip the matched date phrase from the title
  const title = matchedText
    ? withoutTags.replace(matchedText, '').replace(/\s+/g, ' ').trim()
    : withoutTags

  const dateLabel = dateMatched
    ? format(date, "EEE MMM d 'at' h:mm a")
    : 'Today (end of day)'

  return { title, date, dateMatched, dateLabel, tags }
}

const preview = computed(() => parse(input.value))

const canSubmit = computed(() => preview.value.title.trim().length > 0)

const submit = async () => {
  if (!canSubmit.value) return
  saving.value = true
  error.value = ''
  const parsed = preview.value

  const result = await taskStore.addTask({
    title: parsed.title,
    description: '',
    due_date: Timestamp.fromDate(parsed.date),
    status: 'pending',
    projectId: props.defaultProjectId ?? null,
    tags: parsed.tags,
    subtasks: [],
  })
  saving.value = false

  if (result?.success) {
    input.value = ''
    inputEl.value?.focus()
  } else {
    error.value = result?.error ?? 'Failed to add task'
  }
}

const clear = () => {
  input.value = ''
}

defineExpose({ focus: () => inputEl.value?.focus() })
</script>
