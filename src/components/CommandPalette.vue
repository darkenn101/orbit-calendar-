<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
    @click.self="close"
  >
    <div class="absolute inset-0 bg-black/40 dark:bg-black/60" @click="close" />
    <div class="relative w-full max-w-xl bg-elevated rounded-xl shadow-2xl border border-line overflow-hidden">
      <!-- Search input -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-line">
        <MagnifyingGlassIcon class="w-5 h-5 text-ink-subtle flex-shrink-0" />
        <input
          ref="inputEl"
          v-model="query"
          type="text"
          class="flex-1 bg-transparent border-none outline-none text-base text-ink placeholder:text-ink-subtle"
          placeholder="Search tasks, notes, reminders…"
          @keydown.down.prevent="move(1)"
          @keydown.up.prevent="move(-1)"
          @keydown.enter.prevent="activate()"
          @keydown.escape.prevent="close()"
        />
        <kbd class="text-[10px] font-medium text-ink-subtle border border-line rounded px-1.5 py-0.5 hidden sm:inline">esc</kbd>
      </div>

      <!-- Results -->
      <div ref="listEl" class="max-h-[60vh] overflow-y-auto py-1">
        <div
          v-if="results.length === 0"
          class="px-4 py-8 text-center text-sm text-ink-subtle"
        >
          {{ query.trim() ? 'No results' : 'Type to search or pick an action below' }}
        </div>

        <template
          v-for="(group, gIdx) in groupedResults"
          :key="group.label"
        >
          <div
            v-if="group.items.length > 0"
            class="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle"
            :class="{ 'border-t border-line': gIdx > 0 && groupedResults.slice(0, gIdx).some(g => g.items.length) }"
          >
            {{ group.label }}
          </div>
          <button
            v-for="result in group.items"
            :key="result.key"
            type="button"
            :data-result-index="result.index"
            class="w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors"
            :class="result.index === selectedIndex
              ? 'bg-primary-500 text-white'
              : 'text-ink hover:bg-overlay'"
            @click="activate(result.index)"
            @mouseenter="selectedIndex = result.index"
          >
            <component :is="result.icon" class="w-4 h-4 flex-shrink-0" :class="result.index === selectedIndex ? 'text-white' : 'text-ink-subtle'" />
            <span class="flex-1 truncate">
              {{ result.title }}
              <span
                v-if="result.subtitle"
                class="ml-2 text-xs"
                :class="result.index === selectedIndex ? 'text-white/80' : 'text-ink-subtle'"
              >
                {{ result.subtitle }}
              </span>
            </span>
            <span
              class="text-[10px] font-medium uppercase tracking-wider opacity-70"
            >
              {{ result.type }}
            </span>
          </button>
        </template>
      </div>

      <!-- Footer hints -->
      <div class="hidden sm:flex items-center justify-between px-4 py-2 border-t border-line bg-surface/60 text-[11px] text-ink-subtle">
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center gap-1">
            <kbd class="border border-line rounded px-1 py-0.5">↑</kbd>
            <kbd class="border border-line rounded px-1 py-0.5">↓</kbd>
            navigate
          </span>
          <span class="inline-flex items-center gap-1">
            <kbd class="border border-line rounded px-1 py-0.5">↵</kbd>
            select
          </span>
        </div>
        <span class="inline-flex items-center gap-1">
          <kbd class="border border-line rounded px-1 py-0.5">⌘</kbd>
          <kbd class="border border-line rounded px-1 py-0.5">K</kbd>
          to toggle
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { useMagicKeys, whenever, useEventListener } from '@vueuse/core'
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  BellIcon,
  FolderIcon,
  SunIcon,
  Squares2X2Icon,
  CalendarIcon,
  ListBulletIcon,
  ExclamationTriangleIcon,
  ViewColumnsIcon,
  CalendarDaysIcon,
} from '@heroicons/vue/24/outline'
import { matchTaskText, normalizeQuery } from '@/utils/taskSearch'
import { useTaskStore } from '@/stores/tasks'
import { useNoteStore } from '@/stores/notes'
import { useReminderStore } from '@/stores/reminders'
import { useProjectStore } from '@/stores/projects'
import { useCommandPalette } from '@/composables/useCommandPalette'
import { useTheme, type ThemeMode } from '@/composables/useTheme'

interface Result {
  key: string
  type: string
  title: string
  subtitle?: string
  icon: Component
  run: () => void
  index: number
}

interface Group {
  label: string
  items: Result[]
}

const router = useRouter()
const { isOpen, close } = useCommandPalette()
const { mode, setMode } = useTheme()
const taskStore = useTaskStore()
const noteStore = useNoteStore()
const reminderStore = useReminderStore()
const projectStore = useProjectStore()

const query = ref('')
const selectedIndex = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)
const listEl = ref<HTMLElement | null>(null)

const MAX_PER_GROUP = 5

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

const matches = (haystack: string, q: string) => haystack.toLowerCase().includes(q)

// ----- Actions -----
const navigate = (path: string) => {
  close()
  router.push(path)
}

const cycleTheme = () => {
  const order: ThemeMode[] = ['system', 'light', 'dark']
  const next = order[(order.indexOf(mode.value) + 1) % order.length]
  setMode(next)
  close()
}

const baseActions = computed<Omit<Result, 'index'>[]>(() => [
  {
    key: 'action:dashboard',
    type: 'Action',
    title: 'Go to Dashboard',
    icon: Squares2X2Icon,
    run: () => navigate('/'),
  },
  {
    key: 'action:tasks',
    type: 'Action',
    title: 'Go to Tasks',
    icon: ListBulletIcon,
    run: () => navigate('/tasks'),
  },
  {
    key: 'action:tasks-overdue',
    type: 'Action',
    title: 'Show overdue tasks',
    icon: ExclamationTriangleIcon,
    run: () => navigate('/tasks?due=overdue&status=pending'),
  },
  {
    key: 'action:tasks-today',
    type: 'Action',
    title: 'Tasks due today',
    icon: CalendarIcon,
    run: () => navigate('/tasks?due=today'),
  },
  {
    key: 'action:tasks-kanban',
    type: 'Action',
    title: 'Tasks: Kanban view',
    icon: ViewColumnsIcon,
    run: () => navigate('/tasks?view=kanban'),
  },
  {
    key: 'action:tasks-agenda',
    type: 'Action',
    title: 'Tasks: Agenda view',
    icon: CalendarDaysIcon,
    run: () => navigate('/tasks?view=agenda'),
  },
  {
    key: 'action:calendar',
    type: 'Action',
    title: 'Go to Calendar',
    icon: CalendarIcon,
    run: () => navigate('/calendar'),
  },
  {
    key: 'action:notes',
    type: 'Action',
    title: 'Go to Notes',
    icon: DocumentTextIcon,
    run: () => navigate('/notes'),
  },
  {
    key: 'action:reminders',
    type: 'Action',
    title: 'Go to Reminders',
    icon: BellIcon,
    run: () => navigate('/reminders'),
  },
  {
    key: 'action:theme',
    type: 'Action',
    title: `Toggle theme (currently ${mode.value})`,
    icon: SunIcon,
    run: cycleTheme,
  },
])

// ----- Search results -----
// Strip a leading '#' so `#work` matches a task with tag `work`.
const normalizedQuery = computed(() => normalizeQuery(query.value))

const taskResults = computed<Omit<Result, 'index'>[]>(() => {
  const q = normalizedQuery.value
  if (!q) return []
  const projects = projectStore.projectsById
  return taskStore.tasks
    .filter((t) => matchTaskText(t, q))
    .slice(0, MAX_PER_GROUP)
    .map((t) => {
      const proj = t.projectId ? projects[t.projectId] : null
      const matchedTags = (t.tags ?? []).filter((tag) => tag.toLowerCase().includes(q))
      const subtitle = [
        proj?.name,
        matchedTags.length ? matchedTags.map((tag) => `#${tag}`).join(' ') : null,
        t.status === 'completed' ? 'done' : null,
      ].filter(Boolean).join(' · ') || undefined
      return {
        key: `task:${t.id}`,
        type: 'Task',
        title: t.title || '(untitled)',
        subtitle,
        icon: CheckCircleIcon,
        run: () => navigate(`/tasks?taskId=${t.id}`),
      }
    })
})

const noteResults = computed<Omit<Result, 'index'>[]>(() => {
  const q = normalizedQuery.value
  if (!q) return []
  return noteStore.notes
    .filter((n) => matches(n.title ?? '', q) || matches(stripHtml(n.content ?? ''), q))
    .slice(0, MAX_PER_GROUP)
    .map((n) => ({
      key: `note:${n.id}`,
      type: 'Note',
      title: n.title || 'Untitled Note',
      subtitle: stripHtml(n.content ?? '').slice(0, 80) || undefined,
      icon: DocumentTextIcon,
      run: () => navigate('/notes'),
    }))
})

const reminderResults = computed<Omit<Result, 'index'>[]>(() => {
  const q = normalizedQuery.value
  if (!q) return []
  return reminderStore.reminders
    .filter((r) => matches(r.title, q) || matches(r.description ?? '', q))
    .slice(0, MAX_PER_GROUP)
    .map((r) => ({
      key: `reminder:${r.id}`,
      type: 'Reminder',
      title: r.title || '(untitled)',
      subtitle: r.description || undefined,
      icon: BellIcon,
      run: () => navigate('/reminders'),
    }))
})

const projectResults = computed<Omit<Result, 'index'>[]>(() => {
  const q = normalizedQuery.value
  if (!q) return []
  return projectStore.projects
    .filter((p) => matches(p.name, q))
    .slice(0, MAX_PER_GROUP)
    .map((p) => ({
      key: `project:${p.id}`,
      type: 'Project',
      title: p.name,
      icon: FolderIcon,
      run: () => navigate(`/tasks?project=${p.id}`),
    }))
})

const actionResults = computed<Omit<Result, 'index'>[]>(() => {
  const q = normalizedQuery.value
  if (!q) return baseActions.value
  return baseActions.value.filter((a) => matches(a.title, q))
})

// Assign sequential indexes across the entire flat list of visible results.
const groupedResults = computed<Group[]>(() => {
  const groups: { label: string; raw: Omit<Result, 'index'>[] }[] = [
    { label: 'Actions', raw: actionResults.value },
    { label: 'Tasks', raw: taskResults.value },
    { label: 'Notes', raw: noteResults.value },
    { label: 'Reminders', raw: reminderResults.value },
    { label: 'Projects', raw: projectResults.value },
  ]
  let cursor = 0
  return groups.map((g) => ({
    label: g.label,
    items: g.raw.map((r) => ({ ...r, index: cursor++ })),
  }))
})

const results = computed<Result[]>(() =>
  groupedResults.value.flatMap((g) => g.items),
)

watch(results, () => {
  if (selectedIndex.value >= results.value.length) selectedIndex.value = 0
})

watch(query, () => {
  selectedIndex.value = 0
})

const move = (delta: number) => {
  if (results.value.length === 0) return
  const n = results.value.length
  selectedIndex.value = (selectedIndex.value + delta + n) % n
  scrollSelectedIntoView()
}

const scrollSelectedIntoView = () => {
  nextTick(() => {
    const el = listEl.value?.querySelector<HTMLElement>(`[data-result-index="${selectedIndex.value}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  })
}

const activate = (index?: number) => {
  if (index !== undefined) selectedIndex.value = index
  const target = results.value[selectedIndex.value]
  target?.run()
}

// Reset when opened, focus input.
watch(isOpen, async (open) => {
  if (open) {
    query.value = ''
    selectedIndex.value = 0
    await nextTick()
    inputEl.value?.focus()
  }
})

// Global Cmd-K / Ctrl-K toggle. The whenever() callback fires on keydown
// for the chord regardless of focus target, including inputs.
const keys = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && e.type === 'keydown') {
      e.preventDefault()
    }
  },
})
whenever(keys['meta+k'], () => { isOpen.value = !isOpen.value })
whenever(keys['ctrl+k'], () => { isOpen.value = !isOpen.value })

// Esc also closes from anywhere in the modal (the input handles it too, but
// the backdrop doesn't have focus).
useEventListener(window, 'keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isOpen.value) close()
})
</script>
