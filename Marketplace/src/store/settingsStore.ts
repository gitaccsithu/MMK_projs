import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'mm'
  sidebarCollapsed: boolean
  maintenanceMode: boolean
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLanguage: (lang: 'en' | 'mm') => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setMaintenanceMode: (mode: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'en',
      sidebarCollapsed: false,
      maintenanceMode: false,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setMaintenanceMode: (maintenanceMode) => set({ maintenanceMode }),
    }),
    { name: 'servicehub-settings' }
  )
)
