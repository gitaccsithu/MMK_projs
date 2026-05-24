import * as api from '@/services/mockApi'
import { toast } from 'sonner'

let simulationInterval: ReturnType<typeof setInterval> | null = null

const STATUS_PROGRESSION = [
  'pending',
  'confirmed',
  'vendor_assigned',
  'on_the_way',
  'in_progress',
  'completed',
] as const

export function startSimulation() {
  if (simulationInterval) return

  simulationInterval = setInterval(async () => {
    const data = api.getAppDataSync()
    const activeBookings = data.bookings.filter(
      (b) => !['completed', 'cancelled'].includes(b.status)
    )
    if (activeBookings.length === 0) return

    const booking = activeBookings[Math.floor(Math.random() * activeBookings.length)]
    const currentIdx = STATUS_PROGRESSION.indexOf(
      booking.status as (typeof STATUS_PROGRESSION)[number]
    )
    if (currentIdx >= 0 && currentIdx < STATUS_PROGRESSION.length - 1) {
      const nextStatus = STATUS_PROGRESSION[currentIdx + 1]
      await api.updateBookingStatus(booking.id, nextStatus)
    }

    // Random notification for demo users
    if (Math.random() > 0.7) {
      const user = data.users[Math.floor(Math.random() * data.users.length)]
      data.notifications.unshift({
        id: `notif_sim_${Date.now()}`,
        userId: user.id,
        type: 'system',
        title: 'Platform Update',
        message: 'New services available in your area!',
        read: false,
        createdAt: new Date().toISOString(),
      })
      api.saveAppDataSync(data)
    }
  }, 15000)
}

export function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval)
    simulationInterval = null
  }
}

export function simulateBookingProgress(bookingId: string, onUpdate?: () => void) {
  let step = 0
  const interval = setInterval(async () => {
    if (step >= STATUS_PROGRESSION.length - 1) {
      clearInterval(interval)
      return
    }
    step++
    const status = STATUS_PROGRESSION[step]
    await api.updateBookingStatus(bookingId, status)
    toast.info(`Booking updated: ${status.replace(/_/g, ' ')}`)
    onUpdate?.()
  }, 8000)

  return () => clearInterval(interval)
}

export function simulateWebSocketMessage(callback: (msg: string) => void) {
  const messages = [
    'New booking received!',
    'Payment confirmed',
    'Customer left a 5-star review',
    'Vendor is now online',
    'Promo code applied successfully',
  ]
  const interval = setInterval(() => {
    if (Math.random() > 0.6) {
      callback(messages[Math.floor(Math.random() * messages.length)])
    }
  }, 12000)
  return () => clearInterval(interval)
}
