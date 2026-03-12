import { Timestamp } from 'firebase/firestore'

export interface Task {
  id?: string
  title: string
  description: string
  due_date: Timestamp
  status: 'pending' | 'completed'
  userId: string
  createdAt: Timestamp
  updatedAt: Timestamp
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