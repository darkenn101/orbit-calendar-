<template>
  <div class="border-b border-line bg-elevated px-6 py-3 flex flex-wrap items-center gap-2">
    <!-- Status segmented -->
    <div class="inline-flex items-center rounded-md border border-line p-0.5 text-xs">
      <button
        v-for="s in statusOptions"
        :key="s.value"
        type="button"
        class="px-2.5 py-1 rounded transition-colors"
        :class="filters.statusFilter.value === s.value
          ? 'bg-primary-500 text-white'
          : 'text-ink-muted hover:bg-overlay'"
        @click="filters.statusFilter.value = s.value"
      >
        {{ s.label }}
      </button>
    </div>

    <!-- Due range -->
    <div class="relative">
      <button
        type="button"
        class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-line bg-surface hover:bg-overlay text-xs text-ink-muted"
        @click="toggleMenu('due')"
      >
        <CalendarIcon class="w-3.5 h-3.5" />
        <span>{{ dueLabel }}</span>
        <ChevronDownIcon class="w-3 h-3" />
      </button>
      <div
        v-if="openMenu === 'due'"
        class="absolute left-0 mt-1 z-20 w-44 bg-elevated rounded-md shadow-lg border border-line py-1"
      >
        <button
          v-for="opt in dueOptions"
          :key="opt.value"
          type="button"
          class="w-full text-left px-3 py-1.5 text-xs hover:bg-overlay"
          :class="filters.dueDateFilter.value.preset === opt.value ? 'text-primary-600 dark:text-primary-300 font-medium' : 'text-ink-muted'"
          @click="setDue(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Project multi-select -->
    <div class="relative">
      <button
        type="button"
        class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-line bg-surface hover:bg-overlay text-xs text-ink-muted"
        @click="toggleMenu('project')"
      >
        <FolderIcon class="w-3.5 h-3.5" />
        <span>{{ projectLabel }}</span>
        <ChevronDownIcon class="w-3 h-3" />
      </button>
      <div
        v-if="openMenu === 'project'"
        class="absolute left-0 mt-1 z-20 w-56 max-h-72 overflow-y-auto bg-elevated rounded-md shadow-lg border border-line py-1"
      >
        <button
          type="button"
          class="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-overlay"
          :class="filters.projectFilters.value.has(null) ? 'text-primary-600 dark:text-primary-300 font-medium' : 'text-ink-muted'"
          @click="filters.toggleProject(null)"
        >
          <InboxIcon class="w-3.5 h-3.5" />
          Inbox
        </button>
        <button
          v-for="p in projectStore.projects"
          :key="p.id"
          type="button"
          class="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-overlay"
          :class="p.id && filters.projectFilters.value.has(p.id) ? 'text-primary-600 dark:text-primary-300 font-medium' : 'text-ink-muted'"
          @click="p.id && filters.toggleProject(p.id)"
        >
          <span class="w-2 h-2 rounded-full" :class="projectColorClasses[p.color]" />
          {{ p.name }}
        </button>
      </div>
    </div>

    <!-- Tags multi-select -->
    <div class="relative" v-if="availableTags.length">
      <button
        type="button"
        class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-line bg-surface hover:bg-overlay text-xs text-ink-muted"
        @click="toggleMenu('tag')"
      >
        <HashtagIcon class="w-3.5 h-3.5" />
        <span>{{ tagLabel }}</span>
        <ChevronDownIcon class="w-3 h-3" />
      </button>
      <div
        v-if="openMenu === 'tag'"
        class="absolute left-0 mt-1 z-20 w-48 max-h-72 overflow-y-auto bg-elevated rounded-md shadow-lg border border-line py-1"
      >
        <button
          v-for="tag in availableTags"
          :key="tag"
          type="button"
          class="w-full text-left px-3 py-1.5 text-xs hover:bg-overlay"
          :class="filters.tagFilters.value.has(tag) ? 'text-primary-600 dark:text-primary-300 font-medium' : 'text-ink-muted'"
          @click="filters.toggleTag(tag)"
        >
          #{{ tag }}
        </button>
      </div>
    </div>

    <!-- Sort -->
    <div class="relative ml-auto">
      <button
        type="button"
        class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-line bg-surface hover:bg-overlay text-xs text-ink-muted"
        @click="toggleMenu('sort')"
      >
        <BarsArrowDownIcon class="w-3.5 h-3.5" />
        <span>{{ sortLabel }}</span>
        <ChevronDownIcon class="w-3 h-3" />
      </button>
      <div
        v-if="openMenu === 'sort'"
        class="absolute right-0 mt-1 z-20 w-44 bg-elevated rounded-md shadow-lg border border-line py-1"
      >
        <button
          v-for="opt in sortOptions"
          :key="`${opt.by}-${opt.dir ?? 'asc'}`"
          type="button"
          class="w-full text-left px-3 py-1.5 text-xs hover:bg-overlay"
          :class="isSortActive(opt) ? 'text-primary-600 dark:text-primary-300 font-medium' : 'text-ink-muted'"
          @click="setSort(opt)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <button
      v-if="filters.activeFilterCount.value > 0"
      type="button"
      class="text-xs text-primary-600 dark:text-primary-300 hover:underline"
      @click="filters.reset"
    >
      Clear ({{ filters.activeFilterCount.value }})
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { CalendarIcon, FolderIcon, HashtagIcon, ChevronDownIcon, BarsArrowDownIcon, InboxIcon } from '@heroicons/vue/24/outline'
import type { useTaskFilters, DueDatePreset, SortBy, SortDir } from '@/composables/useTaskFilters'
import { useProjectStore } from '@/stores/projects'
import { useTaskStore } from '@/stores/tasks'
import { projectColorClasses } from '@/utils/projectColors'

type Filters = ReturnType<typeof useTaskFilters>

const props = defineProps<{
  filters: Filters
  showManualSort?: boolean
}>()

const filters = computed(() => props.filters)

const projectStore = useProjectStore()
const taskStore = useTaskStore()

const openMenu = ref<string | null>(null)
const toggleMenu = (key: string) => {
  openMenu.value = openMenu.value === key ? null : key
}

const closeAll = () => { openMenu.value = null }
const onDocClick = (e: MouseEvent) => {
  const t = e.target as HTMLElement
  if (!t.closest('.relative')) closeAll()
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

const statusOptions: { value: 'all' | 'pending' | 'completed'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Done' },
]

const dueOptions: { value: DueDatePreset; label: string }[] = [
  { value: 'all', label: 'Any time' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
]

const availableTags = computed(() => {
  const set = new Set<string>()
  for (const t of taskStore.tasks) for (const tag of t.tags ?? []) set.add(tag)
  return Array.from(set).sort()
})

const dueLabel = computed(() => dueOptions.find(o => o.value === filters.value.dueDateFilter.value.preset)?.label ?? 'Any time')
const projectLabel = computed(() => {
  const n = filters.value.projectFilters.value.size
  if (!n) return 'Project'
  if (n === 1) {
    const [first] = filters.value.projectFilters.value
    if (first === null) return 'Inbox'
    return projectStore.projectsById[first]?.name ?? '1 project'
  }
  return `${n} projects`
})
const tagLabel = computed(() => {
  const n = filters.value.tagFilters.value.size
  if (!n) return 'Tags'
  if (n === 1) return `#${Array.from(filters.value.tagFilters.value)[0]}`
  return `${n} tags`
})

interface SortOption { by: SortBy; dir?: SortDir; label: string }
const sortOptions = computed<SortOption[]>(() => {
  const base: SortOption[] = [
    { by: 'due', dir: 'asc', label: 'Due date ↑' },
    { by: 'due', dir: 'desc', label: 'Due date ↓' },
    { by: 'created', dir: 'desc', label: 'Newest' },
    { by: 'created', dir: 'asc', label: 'Oldest' },
    { by: 'title', dir: 'asc', label: 'Title A–Z' },
  ]
  if (props.showManualSort) base.push({ by: 'manual', label: 'Manual order' })
  return base
})

const isSortActive = (opt: SortOption) =>
  filters.value.sortBy.value === opt.by &&
  (opt.by === 'manual' || filters.value.sortDir.value === opt.dir)

const sortLabel = computed(() => {
  const active = sortOptions.value.find(isSortActive)
  return active?.label ?? 'Sort'
})

const setSort = (opt: SortOption) => {
  filters.value.sortBy.value = opt.by
  if (opt.dir) filters.value.sortDir.value = opt.dir
  closeAll()
}

const setDue = (preset: DueDatePreset) => {
  filters.value.setDuePreset(preset)
  closeAll()
}
</script>
