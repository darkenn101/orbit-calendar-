import { addDays, addMonths } from 'date-fns'
import { Timestamp } from 'firebase/firestore'
import type { RecurrenceRule, Task } from '@/types'

const applyHourMinute = (date: Date, hour: number, minute: number): Date => {
  const out = new Date(date)
  out.setHours(hour, minute, 0, 0)
  return out
}

// Compute the next occurrence strictly AFTER `current` per the rule.
// Returns null if the next occurrence exceeds the rule's endDate.
export const computeNextOccurrence = (
  rule: RecurrenceRule,
  current: Date,
): Date | null => {
  const baseHour = current.getHours()
  const baseMinute = current.getMinutes()
  let next: Date

  switch (rule.freq) {
    case 'daily':
      next = addDays(current, Math.max(1, rule.interval))
      break

    case 'weekly': {
      const weekdays = rule.weekdays && rule.weekdays.length > 0
        ? [...rule.weekdays].sort((a, b) => a - b)
        : [current.getDay()]
      const currentDow = current.getDay()
      const laterThisWeek = weekdays.find((d) => d > currentDow)
      if (laterThisWeek !== undefined) {
        next = addDays(current, laterThisWeek - currentDow)
      } else {
        const interval = Math.max(1, rule.interval)
        const daysToFirstDowNextCycle = (7 - currentDow) + weekdays[0] + (interval - 1) * 7
        next = addDays(current, daysToFirstDowNextCycle)
      }
      break
    }

    case 'monthly':
      next = addMonths(current, Math.max(1, rule.interval))
      break
  }

  // Reapply hour/minute so DST transitions don't drift the time-of-day.
  next = applyHourMinute(next, baseHour, baseMinute)

  if (rule.endDate && next.getTime() > rule.endDate.toDate().getTime()) {
    return null
  }
  return next
}

// Generate synthetic Task instances for occurrences strictly after the
// template's due_date, within [from, to]. The template itself is NOT
// included — it's a concrete doc that callers should iterate separately.
export const expandRecurrence = (
  template: Task,
  from: Date,
  to: Date,
): Task[] => {
  if (!template.recurrence || !template.id) return []

  const out: Task[] = []
  let cursor = template.due_date.toDate()
  let next = computeNextOccurrence(template.recurrence, cursor)

  // Hard cap to avoid runaway loops if the rule has 0 interval somehow.
  const maxIterations = 500
  let iterations = 0

  while (next && next.getTime() <= to.getTime() && iterations < maxIterations) {
    if (next.getTime() >= from.getTime()) {
      out.push({
        ...template,
        id: undefined,
        due_date: Timestamp.fromDate(next),
        recurrenceParentId: template.id,
        recurrence: undefined,
      })
    }
    cursor = next
    next = computeNextOccurrence(template.recurrence, cursor)
    iterations += 1
  }

  return out
}

export const describeRule = (rule: RecurrenceRule): string => {
  const n = Math.max(1, rule.interval)
  switch (rule.freq) {
    case 'daily':
      return n === 1 ? 'Every day' : `Every ${n} days`
    case 'weekly': {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const days = rule.weekdays && rule.weekdays.length > 0
        ? rule.weekdays.map((d) => dayNames[d]).join(', ')
        : ''
      const prefix = n === 1 ? 'Weekly' : `Every ${n} weeks`
      return days ? `${prefix} on ${days}` : prefix
    }
    case 'monthly':
      return n === 1 ? 'Every month' : `Every ${n} months`
  }
}
