import { addDays, endOfDay, isWithinInterval, startOfDay } from 'date-fns'
import type { Task } from '@/types'

export interface AgendaBuckets {
  overdue: Task[]
  today: Task[]
  tomorrow: Task[]
  thisWeek: Task[]
  later: Task[]
  noDate: Task[]
}

export interface GroupOptions {
  now?: Date
  includeCompleted?: boolean
}

const dueMillis = (t: Task): number | null => {
  const d = t.due_date?.toDate?.()
  return d ? d.getTime() : null
}

export const groupTasksByDueBucket = (
  tasks: Task[],
  opts: GroupOptions = {},
): AgendaBuckets => {
  const now = opts.now ?? new Date()
  const includeCompleted = !!opts.includeCompleted

  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const tomorrowStart = startOfDay(addDays(now, 1))
  const tomorrowEnd = endOfDay(addDays(now, 1))
  const weekStart = startOfDay(addDays(now, 2))
  const weekEnd = endOfDay(addDays(now, 6))

  const buckets: AgendaBuckets = {
    overdue: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
    noDate: [],
  }

  for (const t of tasks) {
    if (!includeCompleted && t.status === 'completed') continue

    const d = t.due_date?.toDate?.()
    if (!d) {
      buckets.noDate.push(t)
      continue
    }

    if (d < todayStart && t.status === 'pending') {
      buckets.overdue.push(t)
      continue
    }
    if (isWithinInterval(d, { start: todayStart, end: todayEnd })) {
      buckets.today.push(t)
      continue
    }
    if (isWithinInterval(d, { start: tomorrowStart, end: tomorrowEnd })) {
      buckets.tomorrow.push(t)
      continue
    }
    if (isWithinInterval(d, { start: weekStart, end: weekEnd })) {
      buckets.thisWeek.push(t)
      continue
    }
    buckets.later.push(t)
  }

  const byDueAsc = (a: Task, b: Task) => (dueMillis(a) ?? 0) - (dueMillis(b) ?? 0)
  buckets.overdue.sort(byDueAsc)
  buckets.today.sort(byDueAsc)
  buckets.tomorrow.sort(byDueAsc)
  buckets.thisWeek.sort(byDueAsc)
  buckets.later.sort(byDueAsc)

  return buckets
}

export type DueAnchor = 'today' | 'tomorrow' | 'thisWeek' | 'later'

export const anchorDateForBucket = (bucket: DueAnchor, now: Date = new Date()): Date => {
  const at9 = (d: Date) => {
    const n = new Date(d)
    n.setHours(9, 0, 0, 0)
    return n
  }
  switch (bucket) {
    case 'today': return at9(now)
    case 'tomorrow': return at9(addDays(now, 1))
    case 'thisWeek': return at9(addDays(now, 3))
    case 'later': return at9(addDays(now, 7))
  }
}
