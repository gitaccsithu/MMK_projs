import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Check, MessageSquare, Send, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { Booking, BookingStatus, User } from '@/types'
import { BOOKING_STATUS_LABELS } from '@/types'
import * as api from '@/services/mockApi'
import { useAuthStore } from '@/store/authStore'
import { useVendorForAuthUser } from '@/pages/vendor/useVendorWorkspace'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/booking/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, getInitials } from '@/utils/cn'

const CHAT_MOCK = [
  { id: '1', from: 'customer' as const, text: 'Hi! Can you arrive a bit earlier?', at: '09:12' },
  { id: '2', from: 'vendor' as const, text: 'Absolutely — I can be there 30 min ahead.', at: '09:14' },
]

const STATUS_OPTIONS: BookingStatus[] = [
  'pending',
  'confirmed',
  'vendor_assigned',
  'on_the_way',
  'in_progress',
  'completed',
  'cancelled',
]

export function VendorBookingsPage() {
  const userId = useAuthStore((s) => s.session?.userId)
  const { vendor, loading: vLoading } = useVendorForAuthUser(userId)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [customer, setCustomer] = useState<User | null>(null)
  const [draft, setDraft] = useState('')
  const loading = vLoading

  useEffect(() => {
    let active = true
    void (async () => {
      await Promise.resolve()
      if (!active) return
      if (!userId) {
        setBookings([])
        return
      }
      const b = await api.getBookings(userId, 'vendor')
      if (!active) return
      const sorted = [...b].sort((a, b2) => new Date(b2.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
      setBookings(sorted)
    })()
    return () => {
      active = false
    }
  }, [userId])

  const resolvedId = useMemo(() => {
    if (bookings.length === 0) return null
    if (pickedId && bookings.some((b) => b.id === pickedId)) return pickedId
    return bookings[0]?.id ?? null
  }, [bookings, pickedId])

  const selected = useMemo(() => bookings.find((b) => b.id === resolvedId) ?? null, [bookings, resolvedId])

  useEffect(() => {
    let active = true
    void (async () => {
      await Promise.resolve()
      if (!active) return
      const cid = selected?.customerId
      if (!cid) {
        setCustomer(null)
        return
      }
      const u = await api.getUserById(cid)
      if (active) setCustomer(u ?? null)
    })()
    return () => {
      active = false
    }
  }, [selected?.customerId])

  const refreshOne = async (id: string) => {
    const b = await api.getBookingById(id)
    if (b) setBookings((prev) => prev.map((x) => (x.id === id ? b : x)))
  }

  const onAccept = async () => {
    if (!selected || selected.status !== 'pending') return
    const res = await api.updateBookingStatus(selected.id, 'confirmed', 'Vendor accepted the booking')
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success('Booking accepted')
    await refreshOne(selected.id)
  }

  const onReject = async () => {
    if (!selected || selected.status !== 'pending') return
    const res = await api.cancelBooking(selected.id)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.message('Booking declined')
    await refreshOne(selected.id)
  }

  const onStatusChange = async (next: BookingStatus) => {
    if (!selected || next === selected.status) return
    const res =
      next === 'cancelled'
        ? await api.cancelBooking(selected.id)
        : await api.updateBookingStatus(selected.id, next)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success('Status updated')
    await refreshOne(selected.id)
  }

  const sendMockReply = () => {
    if (!draft.trim()) return
    toast.success('Message queued (mock)')
    setDraft('')
  }

  if (loading) {
    return <Skeleton className="min-h-[420px] w-full" />
  }

  if (!vendor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No vendor linked</CardTitle>
          <CardDescription>Sign in with a vendor demo account to manage bookings.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" description="Accept, reschedule in status, and message customers." />

      <div className="grid gap-6 xl:grid-cols-[280px,minmax(0,1fr),minmax(280px,320px)]">
        <Card className="h-fit max-h-[70vh]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">All jobs</CardTitle>
            <CardDescription>{bookings.length} total</CardDescription>
          </CardHeader>
          <div className="border-t" />
          <ScrollArea className="h-[55vh]">
            <CardContent className="flex flex-col gap-2 p-3">
              {bookings.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setPickedId(b.id)}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-left text-sm transition hover:bg-accent',
                    resolvedId === b.id && 'border-primary ring-2 ring-primary/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium line-clamp-1">{b.address.street}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(b.scheduledAt), 'PPp')} · ${b.amount}
                  </div>
                </button>
              ))}
              {!bookings.length && (
                <p className="text-center text-sm text-muted-foreground py-8">No bookings yet.</p>
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Job detail</CardTitle>
              <CardDescription>
                {selected ? format(new Date(selected.scheduledAt), 'PPpp') : 'Select a booking'}
              </CardDescription>
            </div>
            {selected && (
              <div className="flex flex-wrap gap-2">
                {selected.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={onAccept}>
                      <Check className="mr-1 h-4 w-4" />
                      Accept
                    </Button>
                    <Button size="sm" variant="destructive" onClick={onReject}>
                      <XCircle className="mr-1 h-4 w-4" />
                      Decline
                    </Button>
                  </>
                )}
                <Select value={selected.status} onValueChange={(v) => void onStatusChange(v as BookingStatus)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {BOOKING_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {!selected ? (
              <p className="text-sm text-muted-foreground">Choose a booking from the list.</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="font-medium">{customer?.name ?? '…'}</p>
                    <p className="text-sm text-muted-foreground">{customer?.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Payment</p>
                    <p className="font-medium capitalize">{selected.paymentMethod.replace('_', ' ')}</p>
                    <p className="text-sm text-muted-foreground">{selected.paymentStatus}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Service address</p>
                  <p className="text-sm">
                    {selected.address.street}, {selected.address.city} {selected.address.zip}
                  </p>
                </div>
                {selected.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="text-sm">{selected.notes}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Timeline</p>
                  <ul className="space-y-2 text-sm">
                    {selected.timeline.slice(-5).map((t) => (
                      <li key={t.id} className="flex justify-between gap-4 border-l-2 pl-3 border-primary/30">
                        <span>{t.message}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(new Date(t.timestamp), 'p')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col h-fit max-h-[70vh]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat (mock)
            </CardTitle>
            <CardDescription>In-app messaging preview</CardDescription>
          </CardHeader>
          <div className="border-t" />
          <CardContent className="flex flex-1 flex-col gap-3 p-0">
            <ScrollArea className="h-[38vh] px-4 py-3">
              <div className="space-y-3">
                {CHAT_MOCK.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      'flex gap-2',
                      m.from === 'vendor' ? 'flex-row-reverse text-right' : ''
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={m.from === 'vendor' ? vendor.logo : customer?.avatar} />
                      <AvatarFallback>
                        {getInitials(m.from === 'vendor' ? vendor.businessName : (customer?.name ?? 'C'))}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        'rounded-2xl px-3 py-2 text-sm max-w-[85%]',
                        m.from === 'vendor' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}
                    >
                      {m.text}
                      <div className="mt-1 text-[10px] opacity-70">{m.at}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t" />
            <div className="flex gap-2 p-3">
              <input
                className="flex h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
                placeholder="Type a message…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMockReply()}
              />
              <Button size="icon" type="button" onClick={sendMockReply}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
