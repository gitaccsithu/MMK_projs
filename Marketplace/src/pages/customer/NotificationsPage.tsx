import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCheck, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import * as api from '@/services/mockApi'
import type { Notification, NotificationType } from '@/types'
import { formatDateTime, formatRelativeTime } from '@/utils/cn'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const TYPE_OPTIONS: Array<{ value: 'all' | NotificationType; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'booking', label: 'Bookings' },
  { value: 'payment', label: 'Payments' },
  { value: 'promotion', label: 'Promos' },
  { value: 'message', label: 'Messages' },
  { value: 'system', label: 'System' },
  { value: 'verification', label: 'Verification' },
]

const TYPE_VARIANT: Record<NotificationType, 'default' | 'secondary' | 'outline' | 'warning'> = {
  booking: 'secondary',
  payment: 'outline',
  promotion: 'warning',
  message: 'default',
  system: 'secondary',
  verification: 'outline',
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Notification[]>([])
  const [filter, setFilter] = useState<(typeof TYPE_OPTIONS)[number]['value']>('all')

  const refresh = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const data = await api.getNotifications(user.id)
      setItems(data)
    } catch {
      toast.error('Failed to poll inbox')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((n) => n.type === filter)
  }, [items, filter])

  async function openItem(n: Notification) {
    if (!n.read) {
      await api.markNotificationRead(n.id)
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    }
    if (n.link) {
      navigate(n.link)
    }
  }

  async function markAll() {
    if (!user?.id) return
    await api.markAllNotificationsRead(user.id)
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.success('Inbox archived')
  }

  if (!user) {
    return <EmptyState title="Sign in to open notifications" />
  }

  return (
    <AnimatedPage>
      <PageHeader title="Concierge inbox" description="Operational alerts routed from bookings, payouts, promos." />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {TYPE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              size="sm"
              variant={filter === opt.value ? 'default' : 'outline'}
              onClick={() => setFilter(opt.value)}
              className="rounded-full capitalize"
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => void markAll()}>
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all read
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Quiet channel" description="Nothing to show for this filter." />
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <AnimatedCard key={n.id}>
              <Card
                className={[
                  'border transition hover:border-primary/40',
                  n.read ? 'bg-card/40' : 'bg-primary/5',
                ].join(' ')}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide">
                      <Badge variant={TYPE_VARIANT[n.type]}>{n.type}</Badge>
                      <span className="text-muted-foreground">{formatRelativeTime(n.createdAt)}</span>
                    </div>
                    <CardTitle className="text-base">{n.title}</CardTitle>
                    <CardDescription>{n.message}</CardDescription>
                  </div>
                  {!n.read && <span className="mt-2 h-3 w-3 rounded-full bg-primary" aria-hidden />}
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-3 pb-4 text-xs text-muted-foreground">
                  <span>{formatDateTime(n.createdAt)}</span>
                  <Button type="button" size="sm" variant="outline" onClick={() => void openItem(n)}>
                    {n.link ? 'Open deep link' : 'Mark read'}
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/customer/bookings">Bookings</Link>
                  </Button>
                </CardContent>
              </Card>
            </AnimatedCard>
          ))}
        </div>
      )}
    </AnimatedPage>
  )
}
