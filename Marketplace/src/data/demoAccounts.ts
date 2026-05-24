import type { UserRole } from '@/types'

export interface DemoAccount {
  email: string
  password: string
  role: UserRole
  name: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'customer@example.com',
    password: 'password123',
    role: 'customer',
    name: 'Alex Johnson',
  },
  {
    email: 'vendor@example.com',
    password: 'password123',
    role: 'vendor',
    name: 'Sarah Chen',
  },
  {
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
    name: 'Michael Admin',
  },
]

export function getDemoAccount(email: string) {
  return DEMO_ACCOUNTS.find((a) => a.email === email)
}
