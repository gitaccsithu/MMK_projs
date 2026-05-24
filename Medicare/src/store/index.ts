import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthSession, User } from '@/types'
import * as api from '@/services/mockApi'
import { storageService } from '@/services/storageService'

interface AuthState {
  session: AuthSession | null
  user: User | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>
  logout: () => void
  hydrate: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null, user: null, isLoading: false, error: null,
  login: async (email, password, rememberMe) => {
    set({ isLoading: true, error: null })
    const result = await api.login(email, password, rememberMe)
    if (result.error) { set({ isLoading: false, error: result.error }); return false }
    const user = await api.getUserById(result.data!.userId)
    set({ session: result.data, user: user ?? null, isLoading: false })
    return true
  },
  logout: () => { storageService.setAuth(null); set({ session: null, user: null, error: null }) },
  hydrate: async () => {
    const session = storageService.getAuth()
    if (!session) { set({ session: null, user: null }); return }
    const user = await api.getUserById(session.userId)
    set({ session, user: user ?? null })
  },
  clearError: () => set({ error: null }),
}))

interface SettingsState {
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'mm'
  sidebarCollapsed: boolean
  maintenanceMode: boolean
  setTheme: (t: 'light' | 'dark' | 'system') => void
  setLanguage: (l: 'en' | 'mm') => void
  toggleSidebar: () => void
  setMaintenanceMode: (m: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system', language: 'en', sidebarCollapsed: false, maintenanceMode: false,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMaintenanceMode: (maintenanceMode) => set({ maintenanceMode }),
    }),
    { name: 'medicare-settings' }
  )
)

import type { Notification } from '@/types'

interface AppState {
  isInitialized: boolean
  notifications: Notification[]
  initialize: () => Promise<void>
  refreshNotifications: (userId: string) => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  isInitialized: false,
  notifications: [],
  initialize: async () => { api.initializeApp(); set({ isInitialized: true }) },
  refreshNotifications: async (userId) => {
    const notifications = await api.getNotifications(userId)
    set({ notifications })
  },
}))

export function getUnreadCount(notifications: Notification[]) {
  return notifications.filter((n) => !n.read).length
}
