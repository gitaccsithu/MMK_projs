import * as api from '@/services/mockApi'

let interval: ReturnType<typeof setInterval> | null = null

const STATUS_FLOW = ['pending', 'confirmed', 'waiting', 'in_consultation', 'completed'] as const

export function startSimulation() {
  if (interval) return
  interval = setInterval(async () => {
    const data = api.getAppDataSync()
    const active = data.appointments.filter((a) => !['completed', 'cancelled'].includes(a.status))
    if (!active.length) return
    const appt = active[Math.floor(Math.random() * active.length)]
    const idx = STATUS_FLOW.indexOf(appt.status as typeof STATUS_FLOW[number])
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) {
      await api.updateAppointmentStatus(appt.id, STATUS_FLOW[idx + 1])
    }
    if (Math.random() > 0.7) {
      const user = data.users[Math.floor(Math.random() * data.users.length)]
      data.notifications.unshift({
        id: `notif_sim_${Date.now()}`, userId: user.id, type: 'system',
        title: 'Health Reminder', message: 'Time for your daily medication', read: false, createdAt: new Date().toISOString(),
      })
      api.saveAppDataSync(data)
    }
  }, 15000)
}

export function stopSimulation() {
  if (interval) { clearInterval(interval); interval = null }
}
