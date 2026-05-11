<template>
  <div class="space-y-2">
    <ul v-if="modelValue.length > 0" class="space-y-1.5">
      <li
        v-for="(sub, index) in modelValue"
        :key="sub.id"
        class="flex items-center gap-2"
      >
        <button
          type="button"
          class="flex-shrink-0"
          :aria-label="sub.done ? 'Mark subtask incomplete' : 'Mark subtask complete'"
          @click="toggleDone(index)"
        >
          <div
            class="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
            :class="sub.done
              ? 'bg-green-500 border-green-500'
              : 'border-line-strong hover:border-green-400'"
          >
            <svg
              v-if="sub.done"
              class="w-2.5 h-2.5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </button>
        <input
          :ref="(el) => setInputRef(el, index)"
          v-model="sub.text"
          type="text"
          class="flex-1 bg-transparent border-none outline-none text-sm text-ink placeholder:text-ink-subtle"
          :class="{ 'line-through text-ink-subtle': sub.done }"
          :placeholder="`Subtask ${index + 1}`"
          @keydown.enter.prevent="addSubtask(index + 1)"
          @keydown.backspace="onBackspace($event, index)"
          @input="emitChange"
        />
        <button
          type="button"
          class="flex-shrink-0 text-ink-subtle hover:text-red-500 transition-colors"
          aria-label="Remove subtask"
          @click="removeSubtask(index)"
        >
          <XMarkIcon class="w-4 h-4" />
        </button>
      </li>
    </ul>

    <button
      type="button"
      class="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 transition-colors"
      @click="addSubtask()"
    >
      <PlusIcon class="w-4 h-4" />
      <span>{{ modelValue.length === 0 ? 'Add a subtask' : 'Add another' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { PlusIcon, XMarkIcon } from '@heroicons/vue/20/solid'
import type { Subtask } from '@/types'

const props = defineProps<{
  modelValue: Subtask[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Subtask[]]
}>()

const inputRefs = ref<(HTMLInputElement | null)[]>([])
const setInputRef = (el: unknown, index: number) => {
  inputRefs.value[index] = (el as HTMLInputElement | null) ?? null
}

const newId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `sub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const emitChange = () => emit('update:modelValue', [...props.modelValue])

const addSubtask = async (insertAt?: number) => {
  const next: Subtask[] = [...props.modelValue]
  const newSub: Subtask = { id: newId(), text: '', done: false }
  const targetIndex = insertAt === undefined || insertAt > next.length ? next.length : insertAt
  next.splice(targetIndex, 0, newSub)
  emit('update:modelValue', next)

  await nextTick()
  inputRefs.value[targetIndex]?.focus()
}

const removeSubtask = (index: number) => {
  const next = props.modelValue.filter((_, i) => i !== index)
  emit('update:modelValue', next)
}

const toggleDone = (index: number) => {
  const next = props.modelValue.map((s, i) => (i === index ? { ...s, done: !s.done } : s))
  emit('update:modelValue', next)
}

const onBackspace = (event: KeyboardEvent, index: number) => {
  const target = event.target as HTMLInputElement
  if (target.value === '' && props.modelValue.length > 0) {
    event.preventDefault()
    removeSubtask(index)
  }
}
</script>
