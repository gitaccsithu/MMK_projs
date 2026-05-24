import { create } from 'zustand'
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
  session: null,
  user: null,
  isLoading: false,
  error: null,

  login: async (email, password, rememberMe) => {
    set({ isLoading: true, error: null })
    const result = await api.login(email, password, rememberMe)
    if (result.error) {
      set({ isLoading: false, error: result.error })
      return false
    }
    const user = await api.getUserById(result.data!.userId)
    set({ session: result.data, user: user ?? null, isLoading: false })
    return true
  },

  logout: () => {
    storageService.setAuth(null)
    set({ session: null, user: null, error: null })
  },

  hydrate: async () => {
    const session = storageService.getAuth()
    if (!session) {
      set({ session: null, user: null })
      return
    }
    const user = await api.getUserById(session.userId)
    set({ session, user: user ?? null })
  },

  clearError: () => set({ error: null }),
}))
