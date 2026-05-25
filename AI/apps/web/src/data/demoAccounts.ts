import type { User } from '@insightflow/shared'

export const DEMO_USERS: User[] = [
  { id: 'u1', name: 'Alex Morgan', email: 'alex@insightflow.example.com', role: 'member', department: 'Engineering' },
  { id: 'u2', name: 'Jordan Lee', email: 'admin@insightflow.example.com', role: 'admin', department: 'IT' },
]

export function getDemoUser(email: string): User | undefined {
  return DEMO_USERS.find((u) => u.email === email)
}
