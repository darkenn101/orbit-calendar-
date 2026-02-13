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

export interface User {
  uid: string
  email: string
  displayName?: string
}