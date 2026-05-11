import { Timestamp } from 'firebase/firestore'

export interface Subtask {
  id: string
  text: string
  done: boolean
}

export type RecurrenceFreq = 'daily' | 'weekly' | 'monthly'

export interface RecurrenceRule {
  freq: RecurrenceFreq
  interval: number          // every N freq-units
  weekdays?: number[]       // 0=Sun..6=Sat; only for weekly
  endDate?: Timestamp       // optional series end
}

export interface Task {
  id?: string
  title: string
  description: string
  due_date: Timestamp
  status: 'pending' | 'completed'
  projectId?: string | null
  tags: string[]
  subtasks: Subtask[]
  recurrence?: RecurrenceRule | null
  recurrenceParentId?: string | null   // set on materialized historical occurrences
  order?: number | null                // manual reorder position (sparse); null/undefined → fall back to due_date sort
  userId: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type ProjectColor =
  | 'slate' | 'red' | 'orange' | 'amber' | 'yellow'
  | 'lime' | 'green' | 'emerald' | 'teal' | 'cyan'
  | 'sky' | 'blue' | 'indigo' | 'violet' | 'purple'
  | 'fuchsia' | 'pink' | 'rose'

export interface Project {
  id?: string
  name: string
  color: ProjectColor
  userId: string
  createdAt: Timestamp
}

export interface Reminder {
  id?: string
  title: string
  description: string
  start_date?: Timestamp
  end_date?: Timestamp
  status: 'active' | 'completed' | 'dismissed'
  userId: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Note {
  id?: string
  title: string
  content: string
  isPinned: boolean
  userId: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface User {
  uid: string
  email: string
  displayName?: string
}