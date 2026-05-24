import type { UserRole } from '@/types'

export interface DemoAccount {
  email: string
  password: string
  role: UserRole
  name: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'patient@example.com', password: 'password123', role: 'patient', name: 'Alex Johnson' },
  { email: 'doctor@example.com', password: 'password123', role: 'doctor', name: 'Dr. Sarah Chen' },
  { email: 'receptionist@example.com', password: 'password123', role: 'receptionist', name: 'Maria Lopez' },
  { email: 'admin@example.com', password: 'password123', role: 'admin', name: 'James Admin' },
]

export function getDemoAccount(email: string) {
  return DEMO_ACCOUNTS.find((a) => a.email === email)
}
