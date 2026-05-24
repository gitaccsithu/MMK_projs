import { useEffect, useState } from 'react'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import { alpha, useTheme } from '@mui/material/styles'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import { DEMO_ACCOUNTS } from '@/data/demoAccounts'
import * as api from '@/services/mockApi'
import type { Notification } from '@/types'
import { formatRelativeTime } from '@/utils/cn'
import { useAuthStore } from '@/store'

const receptionDemo = DEMO_ACCOUNTS.find((a) => a.role === 'receptionist')!

async function receptionistUserFromDemo(email: string) {
  const users = await api.getUsers()
  return users.find((u) => u.email === email)
}

export function ReceptionistNotificationsPage() {
  const theme = useTheme()
  const sessionUserId = useAuthStore((s) => s.session?.userId)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Notification[]>([])
  const [uid, setUid] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const fallback = sessionUserId || (await receptionistUserFromDemo(receptionDemo.email))?.id
      if (!fallback) {
        setLoading(false)
        return
      }
      const list = await api.getNotifications(fallback)
      if (cancelled) return
      setUid(fallback)
      setItems(list)
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [sessionUserId])

  async function refresh() {
    if (!uid) return
    setLoading(true)
    const next = await api.getNotifications(uid)
    setItems(next)
    setLoading(false)
  }

  async function readAll() {
    if (!uid) return
    await api.markAllNotificationsRead(uid)
    await refresh()
  }

  async function readOne(id: string) {
    await api.markNotificationRead(id)
    await refresh()
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="Care desk broadcasts"
        description="SMS + kiosk alerts curated for coordinators (seeded MediCare sandbox)."
      >
        <Button variant="outlined" size="small" disabled={loading || !items.length || !items.some((n) => !n.read)} onClick={() => void readAll()}>
          Mark all reviewed
        </Button>
      </PageHeader>

      <Card
        elevation={2}
        sx={{ border: '1px solid', borderColor: alpha(theme.palette.primary.dark, 0.25), mb: 5 }}
      >
        <CardHeader
          sx={{ flexWrap: 'wrap', gap: 2 }}
          avatar={
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.45 : 0.15),
                color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.dark',
                boxShadow: (t) => `inset 0 4px 12px ${alpha(t.palette.primary.main, 0.28)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <NotificationsActiveIcon sx={{ fontSize: 34 }} aria-hidden />
            </Box>
          }
          title={<Typography sx={{ fontWeight: 600 }}>Signal board</Typography>}
          subheader={
            <Typography variant="body2" color="text.secondary">
              Watching {items.length.toString()} payloads for lobby playbooks · user {uid || 'guest'}
            </Typography>
          }
          action={
            loading ? (
              <CircularProgress size={26} sx={{ mt: { xs: 2, sm: 0 }, color: 'primary.main', mr: 1 }} />
            ) : (
              <Chip label="Live sandbox" color="success" variant="filled" size="medium" sx={{ mt: { xs: 2, sm: 0 }, mr: 1 }} />
            )
          }
        />
      </Card>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loading &&
          [1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" sx={{ height: 92 }} />
          ))}
        {!loading &&
          items.slice(0, 40).map((notice) => (
            <Card
              key={notice.id}
              variant="outlined"
              sx={{
                borderWidth: notice.read ? 1 : 2,
                borderColor: notice.read ? 'divider' : alpha(theme.palette.primary.main, 0.55),
                bgcolor: notice.read ? undefined : alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.15 : 0.06),
              }}
            >
              <CardHeader
                sx={{
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { sm: 'center' },
                  justifyContent: 'space-between',
                }}
                title={<Typography sx={{ fontWeight: 600, fontSize: '1.15rem' }}>{notice.title}</Typography>}
                subheader={
                  <Typography variant="caption" sx={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                    {notice.channel ?? 'portal'}
                  </Typography>
                }
                action={
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexShrink: 0, mt: { xs: 1, sm: 0 } }}>
                    {!notice.read && (
                      <Button size="small" variant="outlined" onClick={() => void readOne(notice.id)}>
                        Acknowledge
                      </Button>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                      {formatRelativeTime(notice.createdAt)}
                    </Typography>
                  </Box>
                }
              />
              <CardContent sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary">
                  {notice.message}
                </Typography>
              </CardContent>
            </Card>
          ))}
        {!loading && items.length === 0 && (
          <Card variant="outlined" sx={{ borderStyle: 'dashed', p: 5, textAlign: 'center', bgcolor: 'transparent' }}>
            <Typography variant="body2" color="text.secondary">
              Alerts clear — seed more visits to generate reminders.
            </Typography>
          </Card>
        )}
      </Box>
    </AnimatedPage>
  )
}
