import { create } from 'zustand'
import type { AppData, Booking, Notification, Service, Vendor } from '@/types'
import * as api from '@/services/mockApi'

interface AppState {
  data: AppData | null
  isInitialized: boolean
  isLoading: boolean
  services: Service[]
  bookings: Booking[]
  notifications: Notification[]
  vendors: Vendor[]
  initialize: () => Promise<void>
  refreshBookings: (userId?: string, role?: string) => Promise<void>
  refreshNotifications: (userId: string) => Promise<void>
  refreshServices: () => Promise<void>
  setData: (data: AppData) => void
}

export const useAppStore = create<AppState>((set) => ({
  data: null,
  isInitialized: false,
  isLoading: false,
  services: [],
  bookings: [],
  notifications: [],
  vendors: [],

  initialize: async () => {
    set({ isLoading: true })
    const data = api.initializeApp()
    set({
      data,
      isInitialized: true,
      isLoading: false,
      services: data.services,
      vendors: data.vendors,
    })
  },

  refreshBookings: async (userId, role) => {
    const bookings = await api.getBookings(userId, role)
    set({ bookings })
  },

  refreshNotifications: async (userId) => {
    const notifications = await api.getNotifications(userId)
    set({ notifications })
  },

  refreshServices: async () => {
    const services = await api.getServices()
    set({ services })
  },

  setData: (data) => set({ data }),
}))

export function getUnreadCount(notifications: Notification[]) {
  return notifications.filter((n) => !n.read).length
}
