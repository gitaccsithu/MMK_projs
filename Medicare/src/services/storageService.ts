import type { AppData, AuthSession } from '@/types'

const PREFIX = 'medicare'

export const STORAGE_KEYS = {
  appData: `${PREFIX}:appData`,
  auth: `${PREFIX}:auth`,
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
  set<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value))
  },
  remove(key: string) {
    localStorage.removeItem(key)
  },
  getAppData(): AppData | null {
    return this.get<AppData | null>(STORAGE_KEYS.appData, null)
  },
  setAppData(data: AppData) {
    this.set(STORAGE_KEYS.appData, data)
  },
  getAuth(): AuthSession | null {
    return this.get<AuthSession | null>(STORAGE_KEYS.auth, null)
  },
  setAuth(session: AuthSession | null) {
    if (session) this.set(STORAGE_KEYS.auth, session)
    else this.remove(STORAGE_KEYS.auth)
  },
  clearAll() {
    Object.values(STORAGE_KEYS).forEach((k) => this.remove(k))
  },
}
