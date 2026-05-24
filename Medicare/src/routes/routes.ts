import type { UserRole } from '@/types'

/** Canonical dashboard entry after sign-in per role */
export const ROLE_HOME: Record<UserRole, string> = {
  patient: '/patient',
  doctor: '/doctor',
  receptionist: '/receptionist',
  admin: '/admin',
}

export function getRoleHome(role: UserRole): string {
  return ROLE_HOME[role]
}

export const paths = {
  landing: '/',
  login: '/auth/login',
  register: '/auth/register',
  forgotPassword: '/auth/forgot-password',
  otp: '/auth/otp',
  resetPassword: '/auth/reset-password',
  help: '/help',
  faq: '/faq',
  terms: '/terms',
  privacy: '/privacy',
} as const
