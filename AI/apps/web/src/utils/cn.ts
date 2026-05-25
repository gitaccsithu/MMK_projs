import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function generateId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}`
}
