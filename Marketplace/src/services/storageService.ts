import type { AppData, AuthSession } from '@/types'

const PREFIX = 'servicehub'

export const STORAGE_KEYS = {
  appData: `${PREFIX}:appData`,
  auth: `${PREFIX}:auth`,
  theme: `${PREFIX}:theme`,
  language: `${PREFIX}:language`,
} as const

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export const storageService = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback
    return safeParse(localStorage.getItem(key), fallback)
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, JSON.stringify(value))
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  },

  getAppData(): AppData | null {
    return this.get<AppData | null>(STORAGE_KEYS.appData, null)
  },

  setAppData(data: AppData): void {
    this.set(STORAGE_KEYS.appData, data)
  },

  getAuth(): AuthSession | null {
    return this.get<AuthSession | null>(STORAGE_KEYS.auth, null)
  },

  setAuth(session: AuthSession | null): void {
    if (session) {
      this.set(STORAGE_KEYS.auth, session)
    } else {
      this.remove(STORAGE_KEYS.auth)
    }
  },

  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => this.remove(key))
  },
}
