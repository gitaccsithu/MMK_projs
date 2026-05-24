import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import type { Booking, BookingStatus } from '@/types'
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_ORDER } from '@/types'
import * as api from '@/services/mockApi'
import { useAuthStore } from '@/store/authStore'
import { useVendorForAuthUser } from '@/pages/vendor/useVendorWorkspace'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/booking/StatusBadge'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'

const COLUMNS: BookingStatus[] = [...BOOKING_STATUS_ORDER, 'cancelled']

export function KanbanPage() {
  const userId = useAuthStore((s) => s.session?.userId)
  const { vendor, loading: vLoading } = useVendorForAuthUser(userId)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [liftingId, setLiftingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    const b = await api.getBookings(userId, 'vendor')
    setBookings(b)
  }, [userId])

  useEffect(() => {
    let active = true
    void (async () => {
      await Promise.resolve()
      if (!active) return
      if (!userId) {
        setBookings([])
        return
      }
      await load()
    })()
    return () => {
      active = false
    }
  }, [userId, load])

  const byColumn = useMemo(() => {
    const m = new Map<BookingStatus, Booking[]>()
    COLUMNS.forEach((c) => m.set(c, []))
    for (const b of bookings) {
      const list = m.get(b.status)
      if (list) list.push(b)
    }
    return m
  }, [bookings])

  const onDropTo = async (status: BookingStatus) => {
    if (!liftingId) {
      toast.message('Pick a card first (click), then click a column header to move.')
      return
    }
    const b = bookings.find((x) => x.id === liftingId)
    if (!b || b.status === status) {
      setLiftingId(null)
      return
    }
    const res =
      status === 'cancelled'
        ? await api.cancelBooking(liftingId)
        : await api.updateBookingStatus(liftingId, status)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success(`Moved to ${BOOKING_STATUS_LABELS[status]}`)
    setLiftingId(null)
    await load()
  }

  const toggleLift = (id: string) => {
    setLiftingId((cur) => (cur === id ? null : id))
  }

  if (vLoading) return <Skeleton className="min-h-[400px] w-full" />

  if (!vendor) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">No vendor profile for this login.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking board"
        description="Two-step move: click a card to lift it (drag-style highlight), then click a column badge to drop."
      />
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const items = byColumn.get(col) ?? []
          return (
            <div key={col} className="flex w-[280px] shrink-0 flex-col gap-2">
              <button
                type="button"
                className={cn(
                  'flex items-center justify-between rounded-xl border bg-card px-3 py-2 text-left text-sm shadow-sm transition hover:bg-accent'
                )}
                onClick={() => void onDropTo(col)}
              >
                <span className="font-semibold">{BOOKING_STATUS_LABELS[col]}</span>
                <Badge variant="outline">{items.length}</Badge>
              </button>

              <ScrollArea className="h-[calc(100vh-220px)] pr-3">
                <div className="flex flex-col gap-2 pb-10">
                  {items.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleLift(b.id)}
                      className={cn(
                        'rounded-xl border bg-background p-3 text-left shadow-sm transition',
                        liftingId === b.id
                          ? 'ring-2 ring-primary scale-[1.02] shadow-md cursor-grabbing border-primary'
                          : 'hover:border-muted-foreground/30'
                      )}
                    >
                      <div className="flex justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(b.scheduledAt), 'MMM d · p')}
                            </p>
                            <p className="text-sm font-medium line-clamp-2">{b.address.street}</p>
                            <p className="mt-2 text-xs text-muted-foreground">${b.amount}</p>
                          </div>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>
                    </button>
                  ))}
                  {!items.length && (
                    <p className="text-center text-xs text-muted-foreground py-6 px-2">Empty</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )
        })}
      </div>
    </div>
  )
}
