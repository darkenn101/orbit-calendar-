import { computed, ref, watch, type ComputedRef } from 'vue'

export interface UseTaskSelectionOptions {
  visibleIds: ComputedRef<string[]>
}

export const useTaskSelection = (opts: UseTaskSelectionOptions) => {
  const selected = ref<Set<string>>(new Set())
  const lastClickedId = ref<string | null>(null)

  const count = computed(() => selected.value.size)

  const isSelected = (id: string) => selected.value.has(id)

  const select = (id: string) => {
    if (selected.value.has(id)) return
    const next = new Set(selected.value)
    next.add(id)
    selected.value = next
    lastClickedId.value = id
  }

  const deselect = (id: string) => {
    if (!selected.value.has(id)) return
    const next = new Set(selected.value)
    next.delete(id)
    selected.value = next
  }

  const selectRange = (fromId: string, toId: string) => {
    const ids = opts.visibleIds.value
    const i = ids.indexOf(fromId)
    const j = ids.indexOf(toId)
    if (i === -1 || j === -1) return
    const [lo, hi] = i < j ? [i, j] : [j, i]
    const next = new Set(selected.value)
    for (let k = lo; k <= hi; k++) next.add(ids[k])
    selected.value = next
    lastClickedId.value = toId
  }

  const toggle = (id: string, options?: { shiftKey?: boolean }) => {
    if (options?.shiftKey && lastClickedId.value && lastClickedId.value !== id) {
      selectRange(lastClickedId.value, id)
      return
    }
    const next = new Set(selected.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selected.value = next
    lastClickedId.value = id
  }

  const selectAll = () => {
    selected.value = new Set(opts.visibleIds.value)
  }

  const clear = () => {
    selected.value = new Set()
    lastClickedId.value = null
  }

  watch(opts.visibleIds, ids => {
    if (!selected.value.size && !lastClickedId.value) return
    const visible = new Set(ids)
    let changed = false
    const next = new Set<string>()
    for (const id of selected.value) {
      if (visible.has(id)) next.add(id)
      else changed = true
    }
    if (changed) selected.value = next
    if (lastClickedId.value && !visible.has(lastClickedId.value)) {
      lastClickedId.value = null
    }
  })

  return {
    selected,
    lastClickedId,
    count,
    isSelected,
    toggle,
    select,
    deselect,
    selectRange,
    selectAll,
    clear,
  }
}
