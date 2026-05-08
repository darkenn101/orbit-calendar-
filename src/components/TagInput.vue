<template>
  <div
    class="input flex flex-wrap items-center gap-1.5 cursor-text min-h-[2.5rem]"
    @click="focusInput"
  >
    <span
      v-for="tag in modelValue"
      :key="tag"
      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-700/30 dark:text-primary-50"
    >
      #{{ tag }}
      <button
        type="button"
        class="hover:text-primary-900 dark:hover:text-white"
        @click.stop="removeTag(tag)"
        :aria-label="`Remove tag ${tag}`"
      >
        <XMarkIcon class="w-3 h-3" />
      </button>
    </span>
    <input
      ref="inputEl"
      v-model="draft"
      type="text"
      class="flex-1 min-w-[6rem] bg-transparent border-none outline-none text-sm py-1"
      :placeholder="modelValue.length === 0 ? placeholder : ''"
      @keydown="onKeydown"
      @blur="commitDraft"
      @paste="onPaste"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { XMarkIcon } from '@heroicons/vue/20/solid'

const props = defineProps<{
  modelValue: string[]
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const inputEl = ref<HTMLInputElement | null>(null)
const draft = ref('')

const focusInput = () => inputEl.value?.focus()

const normalize = (raw: string) => raw.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-')

const addTag = (raw: string) => {
  const clean = normalize(raw)
  if (!clean) return
  if (props.modelValue.includes(clean)) return
  emit('update:modelValue', [...props.modelValue, clean])
}

const removeTag = (tag: string) => {
  emit('update:modelValue', props.modelValue.filter((t) => t !== tag))
}

const commitDraft = () => {
  if (draft.value.trim()) {
    addTag(draft.value)
    draft.value = ''
  }
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ',' || event.key === 'Tab') {
    if (draft.value.trim()) {
      event.preventDefault()
      addTag(draft.value)
      draft.value = ''
    }
  } else if (event.key === 'Backspace' && draft.value === '' && props.modelValue.length > 0) {
    removeTag(props.modelValue[props.modelValue.length - 1])
  }
}

const onPaste = (event: ClipboardEvent) => {
  const text = event.clipboardData?.getData('text') ?? ''
  if (text.includes(',')) {
    event.preventDefault()
    text.split(',').forEach(addTag)
    draft.value = ''
  }
}
</script>
