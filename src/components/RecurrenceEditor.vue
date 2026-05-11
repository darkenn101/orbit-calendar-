<template>
  <div class="space-y-3">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="opt in freqOptions"
        :key="opt.value"
        type="button"
        class="px-3 py-1 rounded-full text-sm border transition-colors"
        :class="currentFreq === opt.value
          ? 'bg-primary-500 text-white border-primary-500'
          : 'bg-elevated text-ink-muted border-line hover:bg-overlay'"
        @click="setFreq(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>

    <template v-if="rule">
      <div class="flex items-center gap-2 text-sm">
        <span class="text-ink-muted">Every</span>
        <input
          type="number"
          min="1"
          max="365"
          v-model.number="rule.interval"
          class="input w-16 text-sm py-1"
          @change="emitChange"
        />
        <span class="text-ink-muted">{{ intervalUnit }}</span>
      </div>

      <div v-if="rule.freq === 'weekly'">
        <p class="text-xs text-ink-subtle mb-1.5">On these days:</p>
        <div class="flex gap-1">
          <button
            v-for="(label, i) in dayLabels"
            :key="i"
            type="button"
            class="w-9 h-9 rounded-full text-xs font-medium border transition-colors"
            :class="rule.weekdays?.includes(i)
              ? 'bg-primary-500 text-white border-primary-500'
              : 'bg-elevated text-ink-muted border-line hover:bg-overlay'"
            @click="toggleWeekday(i)"
          >
            {{ label }}
          </button>
        </div>
      </div>

      <div>
        <label class="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            :checked="hasEndDate"
            class="rounded"
            @change="toggleEndDate"
          />
          <span>End on a specific date</span>
        </label>
        <input
          v-if="hasEndDate"
          type="date"
          :value="endDateValue"
          class="input mt-2 text-sm"
          @input="onEndDateInput($event)"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Timestamp } from 'firebase/firestore'
import { format } from 'date-fns'
import type { RecurrenceFreq, RecurrenceRule } from '@/types'

const props = defineProps<{
  modelValue: RecurrenceRule | null | undefined
  anchorDate?: Date
}>()

const emit = defineEmits<{
  'update:modelValue': [value: RecurrenceRule | null]
}>()

const freqOptions: Array<{ value: 'none' | RecurrenceFreq; label: string }> = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const rule = computed(() => props.modelValue ?? null)
const currentFreq = computed<'none' | RecurrenceFreq>(() => rule.value?.freq ?? 'none')

const intervalUnit = computed(() => {
  const n = rule.value?.interval ?? 1
  switch (rule.value?.freq) {
    case 'daily': return n === 1 ? 'day' : 'days'
    case 'weekly': return n === 1 ? 'week' : 'weeks'
    case 'monthly': return n === 1 ? 'month' : 'months'
    default: return ''
  }
})

const hasEndDate = computed(() => !!rule.value?.endDate)
const endDateValue = computed(() =>
  rule.value?.endDate ? format(rule.value.endDate.toDate(), 'yyyy-MM-dd') : '',
)

const setFreq = (freq: 'none' | RecurrenceFreq) => {
  if (freq === 'none') {
    emit('update:modelValue', null)
    return
  }
  const existing = rule.value
  const next: RecurrenceRule = {
    freq,
    interval: existing?.interval ?? 1,
    weekdays: freq === 'weekly'
      ? (existing?.weekdays ?? [props.anchorDate?.getDay() ?? 1])
      : undefined,
    endDate: existing?.endDate,
  }
  emit('update:modelValue', next)
}

const emitChange = () => {
  if (rule.value) emit('update:modelValue', { ...rule.value })
}

const toggleWeekday = (dow: number) => {
  if (!rule.value || rule.value.freq !== 'weekly') return
  const current = rule.value.weekdays ?? []
  const next = current.includes(dow)
    ? current.filter((d) => d !== dow)
    : [...current, dow].sort((a, b) => a - b)
  // Don't allow zero weekdays — fall back to anchor day.
  const safe = next.length === 0 ? [props.anchorDate?.getDay() ?? 1] : next
  emit('update:modelValue', { ...rule.value, weekdays: safe })
}

const toggleEndDate = (event: Event) => {
  if (!rule.value) return
  const checked = (event.target as HTMLInputElement).checked
  if (checked) {
    const anchor = props.anchorDate ?? new Date()
    const defaultEnd = new Date(anchor)
    defaultEnd.setMonth(defaultEnd.getMonth() + 3)
    emit('update:modelValue', { ...rule.value, endDate: Timestamp.fromDate(defaultEnd) })
  } else {
    const { endDate: _drop, ...rest } = rule.value
    void _drop
    emit('update:modelValue', { ...rest })
  }
}

const onEndDateInput = (event: Event) => {
  if (!rule.value) return
  const raw = (event.target as HTMLInputElement).value
  if (!raw) return
  const date = new Date(raw)
  date.setHours(23, 59, 59, 999)
  emit('update:modelValue', { ...rule.value, endDate: Timestamp.fromDate(date) })
}
</script>
