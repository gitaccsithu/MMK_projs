import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import NotificationsIcon from '@mui/icons-material/Notifications'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { toast } from 'sonner'
import * as api from '@/services/mockApi'
import type { Notification, NotificationType } from '@/types'
import { useAppStore, useAuthStore } from '@/store'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'

const FILTERS: Array<{ id: NotificationType | 'all'; label: string }> = [
  { id: 'all', label: 'Everything' },
  { id: 'appointment', label: 'Appointments' },
  { id: 'consultation', label: 'Consults' },
  { id: 'prescription', label: 'Pharmacy' },
  { id: 'billing', label: 'Billing' },
  { id: 'system', label: 'System' },
  { id: 'message', label: 'Messages' },
]

export function PatientNotificationsPage() {
  const user = useAuthStore((s) => s.user)
  const refreshNotifications = useAppStore((s) => s.refreshNotifications)
  const [items, setItems] = useState<Notification[]>([])
  const [filter, setFilter] = useState<NotificationType | 'all'>('all')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const rows = await api.getNotifications(user.id)
    setItems(rows)
    await refreshNotifications(user.id)
    setLoading(false)
  }, [refreshNotifications, user?.id])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((n) => n.type === filter)
  }, [items, filter])

  const markOpen = async (id: string) => {
    await api.markNotificationRead(id)
    await load()
    toast.success('Marked read')
  }

  const markAll = async () => {
    if (!user?.id) return
    await api.markAllNotificationsRead(user.id)
    await load()
    toast.success('Clears across devices (mock)')
  }

  const unreadCount = items.filter((n) => !n.read).length

  return (
    <AnimatedPage>
      <Stack spacing={3}>
        <PageHeader title="Notifications" description={`${unreadCount} unread · prioritized by clinician signals.`}>
          <Button variant="outlined" size="small" disabled={unreadCount === 0 || loading} onClick={() => void markAll()} startIcon={<CheckCircleIcon sx={{ color: 'success.main' }} />}>
            Mark all
          </Button>
        </PageHeader>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {FILTERS.map((segment) => (
            <Chip
              key={segment.id}
              label={segment.label}
              onClick={() => setFilter(segment.id)}
              color={segment.id === filter ? 'primary' : 'default'}
              variant={segment.id === filter ? 'filled' : 'outlined'}
              sx={{ textTransform: 'uppercase', fontWeight: 700, typography: 'caption', letterSpacing: 0.5 }}
            />
          ))}
        </Box>

        {!loading && filtered.length === 0 && (
          <AnimatedCard>
            <EmptyState title="Silence is golden" description="Alerts appear when care teams collaborate or billing moves." icon={<NotificationsIcon sx={{ fontSize: 32 }} />} />
          </AnimatedCard>
        )}

        {filtered.map((n) => (
          <AnimatedCard key={n.id}>
            <Card variant="outlined" sx={{ borderColor: n.read ? 'divider' : 'success.light' }}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                      {!n.read && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', flexShrink: 0 }} />}
                      <Typography variant="h6" component="p">
                        {n.title}
                      </Typography>
                      <Chip label={n.type} size="small" />
                      <Chip label={format(parseISO(n.createdAt), 'PP · p')} size="small" variant="outlined" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {n.message}
                    </Typography>
                    {n.link && (
                      <Typography variant="caption" component="p" sx={{ mt: 1, fontFamily: 'monospace', color: 'text.secondary', wordBreak: 'break-all' }}>
                        Routed link <span>{n.link}</span>
                      </Typography>
                    )}
                    {n.channel && (
                      <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'success.dark', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {n.channel}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'flex-end', alignSelf: { xs: 'flex-end', sm: 'flex-start' } }}>
                    {!n.read && (
                      <Button variant="outlined" size="small" onClick={() => void markOpen(n.id)}>
                        Mark read
                      </Button>
                    )}
                    {n.read && <Chip label="Filed" size="small" color="success" />}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </AnimatedCard>
        ))}
      </Stack>
    </AnimatedPage>
  )
}
