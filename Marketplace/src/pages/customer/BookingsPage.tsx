import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarClock, MapPinOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import * as api from '@/services/mockApi'
import type { Booking, Service } from '@/types'
import { formatCurrency, formatDateTime, generateId } from '@/utils/cn'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/booking/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

const rescheduleSchema = z.object({
  datetime: z.string().min(1, 'Pick a new slot'),
})

function postponeBooking(bookingId: string, iso: string) {
  const data = api.getAppDataSync()
  const booking = data.bookings.find((b) => b.id === bookingId)
  if (!booking) return false
  booking.scheduledAt = iso
  booking.updatedAt = new Date().toISOString()
  booking.timeline.push({
    id: generateId('tl'),
    status: booking.status,
    message: `Rescheduled to ${formatDateTime(iso)}`,
    timestamp: new Date().toISOString(),
  })
  api.saveAppDataSync(data)
  return true
}

export function BookingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])

  const reload = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const [bks, svc] = await Promise.all([api.getBookings(user.id, 'customer'), api.getServices()])
      setBookings(bks)
      setServices(svc)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    void reload()
  }, [reload])

  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s])), [services])

  const sorted = useMemo(() => {
    return [...bookings].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
  }, [bookings])

  const canInteract = (b: Booking) => !['completed', 'cancelled'].includes(b.status)

  if (!user) {
    return (
      <EmptyState
        title="Sign in to view bookings"
        description="Authenticate as customer@example.com in the demo to load your itinerary."
      />
    )
  }

  return (
    <AnimatedPage>
      <PageHeader title="My bookings" description="Track timelines, reschedule, or cancel anytime before service starts." />

      {!loading && sorted.length === 0 ? (
        <AnimatedCard>
          <EmptyState
            title="No bookings yet"
            description="Kick off by picking a curated service bundle from the marketplace."
            action={{
              label: 'Open marketplace',
              onClick: () => navigate('/customer/marketplace'),
            }}
          />
        </AnimatedCard>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((x) => (
            <Skeleton key={x} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((b) => (
            <AnimatedCard key={b.id}>
              <Card className="border bg-card shadow-sm transition hover:border-primary/30">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg">{serviceMap.get(b.serviceId)?.title ?? 'Service'}</CardTitle>
                      <StatusBadge status={b.status} />
                    </div>
                    <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                      <span>{formatDateTime(b.scheduledAt)}</span>
                      <Badge variant="outline">{b.address.label}</Badge>
                    </CardDescription>
                    <CardDescription>{b.address.street}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/customer/bookings/${b.id}/track`}>Tracking</Link>
                    </Button>
                    <BookingsActionMenus
                      booking={b}
                      disabled={!canInteract(b)}
                      onCancelled={reload}
                      onRescheduled={reload}
                      serviceTitle={serviceMap.get(b.serviceId)?.title ?? 'Service'}
                      amount={formatCurrency(b.amount)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                  <span>
                    Payment:{' '}
                    <span className="font-semibold text-foreground">
                      {b.paymentMethod === 'wallet' ? 'Wallet' : b.paymentMethod}
                    </span>
                  </span>
                  <span>
                    Receipt:{' '}
                    <span className="font-semibold tabular-nums text-foreground">{formatCurrency(b.amount)}</span>
                  </span>
                </CardContent>
              </Card>
            </AnimatedCard>
          ))}
        </div>
      )}
    </AnimatedPage>
  )
}

function bookingToDatetimeLocal(iso: string) {
  const d = new Date(iso)
  const tzOff = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tzOff).toISOString().slice(0, 16)
}

function BookingsActionMenus(props: {
  booking: Booking
  disabled: boolean
  serviceTitle: string
  amount: string
  onCancelled: () => Promise<void> | void
  onRescheduled: () => Promise<void> | void
}) {
  const [cancelOpen, setCancelOpen] = useState(false)
  const form = useForm<z.infer<typeof rescheduleSchema>>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: { datetime: bookingToDatetimeLocal(props.booking.scheduledAt) },
  })

  async function cancelBooking() {
    const res = await api.cancelBooking(props.booking.id)
    if (!res.data) {
      toast.error(res.error ?? 'Unable to cancel')
      return
    }
    toast.success('Booking cancelled')
    setCancelOpen(false)
    await props.onCancelled()
  }

  async function reschedule(values: z.infer<typeof rescheduleSchema>) {
    const iso = new Date(values.datetime).toISOString()
    if (new Date(iso).getTime() < Date.now()) {
      toast.error('Pick a future date & time.')
      return
    }
    const ok = postponeBooking(props.booking.id, iso)
    if (!ok) {
      toast.error('Could not reschedule.')
      return
    }
    toast.success('Appointment updated')
    await props.onRescheduled()
  }

  return (
    <>
      <Dialog
        onOpenChange={(open) => {
          if (open)
            form.reset({ datetime: bookingToDatetimeLocal(props.booking.scheduledAt) })
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={props.disabled}>
            <CalendarClock className="mr-2 h-4 w-4" />
            Reschedule
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={form.handleSubmit((v) => void reschedule(v))}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Reschedule service
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <p className="text-sm font-medium">{props.serviceTitle}</p>
              <p className="text-xs text-muted-foreground">{props.amount}</p>
              <Label htmlFor="rs-when">New slot</Label>
              <Input id="rs-when" type="datetime-local" {...form.register('datetime')} />
              {form.formState.errors.datetime && (
                <p className="text-xs text-destructive">{form.formState.errors.datetime.message}</p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="submit">Save new time</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={props.disabled}
          onClick={() => setCancelOpen(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex flex-col gap-2">
              <span className="flex items-center gap-2">
                <MapPinOff className="h-4 w-4" />
                Cancel booking
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                We waive fees if cancelled &gt; 12 hrs before arrival.
              </span>
            </DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Never mind
            </Button>
            <Button variant="destructive" onClick={() => void cancelBooking()}>
              Confirm cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
