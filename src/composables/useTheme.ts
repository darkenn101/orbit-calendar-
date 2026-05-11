import { onUnmounted, ref } from 'vue'

export type ThemeMode = 'system' | 'light' | 'dark'

const THEME_STORAGE_KEY = 'orbit-theme'

const mql = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null

function readSavedMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return 'system'
}

function computeIsDark(m: ThemeMode): boolean {
  if (m === 'dark') return true
  if (m === 'light') return false
  return !!mql?.matches
}

// Module-scoped state — every component sees the same value without re-init.
const mode = ref<ThemeMode>(readSavedMode())
const isDark = ref<boolean>(computeIsDark(mode.value))

function apply() {
  isDark.value = computeIsDark(mode.value)
  document.documentElement.classList.toggle('dark', isDark.value)
}

const onSystemChange = () => {
  if (mode.value === 'system') apply()
}
mql?.addEventListener('change', onSystemChange)

// Keep the document class in sync with the initial value (covers the case where
// the inline boot script in main.ts hasn't covered every entry path).
apply()

export function useTheme() {
  const setMode = (next: ThemeMode) => {
    mode.value = next
    if (next === 'system') {
      window.localStorage.removeItem(THEME_STORAGE_KEY)
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    }
    apply()
  }

  onUnmounted(() => {
    // Listener is module-scoped, so we don't tear it down per-component.
  })

  return { mode, isDark, setMode }
}
