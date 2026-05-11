<template>
  <div class="relative" v-click-outside="close">
    <button
      type="button"
      class="text-ink-subtle hover:text-ink transition-colors"
      :title="`Theme: ${mode}`"
      :aria-label="`Theme: ${mode}. Click to change.`"
      @click="open = !open"
    >
      <component :is="currentIcon" class="w-5 h-5" />
    </button>

    <div
      v-if="open"
      class="absolute right-0 bottom-full mb-2 w-44 rounded-lg border border-line bg-elevated shadow-lg overflow-hidden z-40"
    >
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-overlay"
        @click="select(opt.value)"
      >
        <component :is="opt.icon" class="w-4 h-4 text-ink-subtle" />
        <span class="flex-1 text-left">{{ opt.label }}</span>
        <CheckIcon v-if="mode === opt.value" class="w-4 h-4 text-primary-600" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type DirectiveBinding } from 'vue'
import { SunIcon, MoonIcon, ComputerDesktopIcon, CheckIcon } from '@heroicons/vue/20/solid'
import { useTheme, type ThemeMode } from '@/composables/useTheme'

const { mode, setMode } = useTheme()

const open = ref(false)

const options: Array<{ value: ThemeMode; label: string; icon: typeof SunIcon }> = [
  { value: 'system', label: 'System', icon: ComputerDesktopIcon },
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
]

const currentIcon = computed(() => {
  const match = options.find((o) => o.value === mode.value)
  return match?.icon ?? ComputerDesktopIcon
})

const select = (value: ThemeMode) => {
  setMode(value)
  open.value = false
}

const close = () => {
  open.value = false
}

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
