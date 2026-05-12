<template>
  <div class="p-4">
    <div v-if="!tasks.length" class="text-center text-ink-subtle py-12">
      No tasks match the current filters.
    </div>
    <VueDraggable
      v-else-if="manualSort"
      v-model="localList"
      :animation="150"
      :delay="100"
      :delay-on-touch-only="true"
      class="space-y-2"
      handle=".drag-handle"
      @end="onReorder"
    >
      <div
        v-for="t in localList"
        :key="t.id"
        class="drag-handle"
      >
        <TaskRow
          :task="t"
          :selected="t.id ? selectedIds.has(t.id) : false"
          :active="t.id === activeTaskId"
          @select="onSelect"
          @edit="onEdit"
          @toggle="onToggle"
          @toggle-select="onToggleSelect"
        />
      </div>
    </VueDraggable>
    <div v-else class="space-y-2">
      <TaskRow
        v-for="t in tasks"
        :key="t.id"
        :task="t"
        :selected="t.id ? selectedIds.has(t.id) : false"
        :active="t.id === activeTaskId"
        @select="onSelect"
        @edit="onEdit"
        @toggle="onToggle"
        @toggle-select="onToggleSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import TaskRow from '@/components/tasks/TaskRow.vue'
import type { Task } from '@/types'
import { useTaskStore } from '@/stores/tasks'

const props = defineProps<{
  tasks: Task[]
  selectedIds: Set<string>
  activeTaskId: string | null
  manualSort: boolean
}>()

const emit = defineEmits<{
  selectTask: [id: string]
  edit: [task: Task]
  toggleTask: [id: string]
  toggleSelect: [id: string, shiftKey: boolean]
}>()

const taskStore = useTaskStore()

const localList = ref<Task[]>([])
watch(() => props.tasks, next => { localList.value = [...next] }, { immediate: true })

const onSelect = (id: string) => emit('selectTask', id)
const onEdit = (t: Task) => emit('edit', t)
const onToggle = (id: string) => emit('toggleTask', id)
const onToggleSelect = (id: string, shiftKey: boolean) => emit('toggleSelect', id, shiftKey)

const onReorder = async (event: any) => {
  const newIndex: number = event.newIndex
  const oldIndex: number = event.oldIndex
  if (newIndex === undefined || oldIndex === undefined || newIndex === oldIndex) return
  const moved = localList.value[newIndex]
  if (!moved?.id) return
  const prev = localList.value[newIndex - 1]
  const next = localList.value[newIndex + 1]
  const newOrder = taskStore.computeDropOrder(prev, next)
  await taskStore.updateTask(moved.id, { order: newOrder })
}
</script>
