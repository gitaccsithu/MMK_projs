import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Gauge, LocateFixed, Radar } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import * as api from '@/services/mockApi'
import type { Booking, BookingStatus, Service } from '@/types'
import { BOOKING_STATUS_ORDER } from '@/types'
import { formatCurrency, formatDateTime } from '@/utils/cn'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { BookingTimeline } from '@/components/booking/BookingTimeline'
import { MockMap, RoutePreview } from '@/components/maps/MockMap'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/booking/StatusBadge'
import { LineChartCard } from '@/components/charts/ChartCards'

function nextStatuses(current: BookingStatus): BookingStatus | null {
  if (current === 'cancelled' || current === 'completed') return null
  const order: BookingStatus[] = [...BOOKING_STATUS_ORDER]
  const idx = order.indexOf(current)
  if (idx === -1) return null
  return order[idx + 1] ?? null
}

export function BookingTrackPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [service, setService] = useState<Service | null>(null)

  /** Seconds remaining ETA mock */
  const [etaSecs, setEtaSecs] = useState(14 * 60)

  const load = useCallback(async () => {
    if (!id || !userId) return
    setLoading(true)
    try {
      const b = await api.getBookingById(id)
      if (!b || b.customerId !== userId) {
        setBooking(null)
        return
      }
      setBooking(b)
      const svc = await api.getServiceById(b.serviceId)
      setService(svc ?? null)
      const minutes = b.eta ?? 14
      setEtaSecs(minutes * 60)
    } catch {
      toast.error('Tracking unavailable')
    } finally {
      setLoading(false)
    }
  }, [id, userId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (
      !booking ||
      booking.status === 'completed' ||
      booking.status === 'cancelled' ||
      booking.status !== 'on_the_way'
    ) {
      return
    }
    const i = window.setInterval(() => {
      setEtaSecs((s) => Math.max(0, s - 1))
    }, 1000)
    return () => window.clearInterval(i)
  }, [booking?.status])

  const simulatedChart = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      minute: `${i + 6} min ago`,
      speed: booking?.status === 'on_the_way' ? 18 + i * 4 : booking?.status === 'in_progress' ? 36 : i * 2,
    }))
  }, [booking?.status])

  async function simulateProgress() {
    if (!booking) return
    const next = nextStatuses(booking.status)
    if (!next) {
      toast.message('Booking already finished lifecycle.')
      return
    }
    const res = await api.updateBookingStatus(booking.id, next, demoMessage(next))
    if (!res.data) {
      toast.error(res.error ?? 'Unable to simulate')
      return
    }
    toast.success(`Status simulated → ${next.replace(/_/g, ' ')}`)
    await load()
  }

  const routeDistance = `${(booking?.address.lat ? 2.8 : 1.4).toFixed(1)} km`
  const etaLabel = etaSecs <= 0 ? 'Arrived' : `${Math.floor(etaSecs / 60)}m ${etaSecs % 60}s`

  if (!id) {
    return <EmptyState title="Missing booking" />
  }

  if (!userId) {
    return <EmptyState title="Sign in to track deliveries" />
  }

  return (
    <AnimatedPage>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate('/customer/bookings')}>
          <ArrowLeft className="h-4 w-4" />
          Back to bookings
        </Button>
        <Badge variant="outline" className="gap-1">
          <Radar className="h-3 w-3" />
          LIVE SIMULATION
        </Badge>
      </div>

      {loading ? (
        <Skeleton className="h-[420px] rounded-2xl" />
      ) : !booking ? (
        <EmptyState title="Booking not accessible" description="Check your confirmation email or revisit My Bookings." />
      ) : (
        <>
          <PageHeader
            title={service?.title ?? 'Active booking'}
            description={`Appointment ${formatDateTime(booking.scheduledAt)} · ${booking.address.city}`}
          >
            <StatusBadge status={booking.status} />
            <Button type="button" variant="outline" size="sm" onClick={() => void simulateProgress()}>
              <Gauge className="mr-2 h-4 w-4" />
              Simulate progress
            </Button>
          </PageHeader>

          <div className="grid gap-6 lg:grid-cols-3">
            <AnimatedCard className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <LocateFixed className="h-4 w-4" />
                    Map tracking
                  </CardTitle>
                  <CardDescription>Live GPS mockup refreshed every few seconds.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <MockMap
                    className="h-72 md:h-[360px]"
                    showRoute={
                      booking.status === 'on_the_way' ||
                      booking.status === 'in_progress' ||
                      booking.status === 'vendor_assigned'
                    }
                    vendorLabel={`${booking.vendorId.slice(-6)}`}
                    customerLabel="You"
                    animated={booking.status === 'on_the_way'}
                  />
                  <RoutePreview distance={routeDistance} eta={etaLabel} />
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard>
              <Card className="h-full bg-gradient-to-b from-primary/5 to-background">
                <CardHeader>
                  <CardTitle className="text-base">Arrival ETA</CardTitle>
                  <CardDescription>Based on prevailing traffic assumptions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-3xl border bg-card p-8 text-center shadow-inner">
                    <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Countdown</p>
                    <p className="mt-3 font-mono text-5xl font-bold">{etaLabel}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Technician {booking.status === 'completed' ? 'finished' : 'en route'}{' '}
                      {service?.packages.find((p) => p.id === booking.packageId)?.name ?? ''}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted p-4 text-sm">
                    <p className="font-semibold">Payment shield</p>
                    <p className="mt-2 text-muted-foreground">
                      {booking.paymentMethod === 'wallet'
                        ? 'Wallet balance escrowed until you confirm completion.'
                        : 'Charges settle after your digital signature offline.'}{' '}
                      <Link className="text-primary underline" to="/customer/wallet">
                        Review wallet ledger
                      </Link>
                      .
                    </p>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <div>
                      <p className="font-semibold text-foreground">Amount</p>
                      {formatCurrency(booking.amount)}
                    </div>
                    <div className="h-12 w-px bg-border" />
                    <div>
                      <p className="font-semibold text-foreground">Location</p>
                      {booking.address.street}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <AnimatedCard>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Milestone radar</CardTitle>
                  <CardDescription>Every handshake is logged for concierge teams.</CardDescription>
                </CardHeader>
                <CardContent>
                  <BookingTimeline currentStatus={booking.status} timeline={booking.timeline} animated />
                </CardContent>
              </Card>
            </AnimatedCard>
            <AnimatedCard>
              <LineChartCard
                title="Technician pacing"
                description="Relative pace index • demo synthetic signal"
                data={simulatedChart}
                loading={loading}
                dataKey="speed"
                xKey="minute"
                height={240}
              />
            </AnimatedCard>
          </div>
        </>
      )}
    </AnimatedPage>
  )
}

function demoMessage(status: BookingStatus) {
  switch (status) {
    case 'confirmed':
      return 'Vendor confirmed your arrival window.'
    case 'vendor_assigned':
      return 'Sarah from dispatch accepted this visit.'
    case 'on_the_way':
      return 'GPS indicates the van departed the HQ lot.'
    case 'in_progress':
      return 'Toolkit deployed — service underway.'
    case 'completed':
      return 'Inspection photos uploaded and synced.'
    case 'pending':
      return 'Awaiting partner confirmation.'
    default:
      return 'Status bumped for demo realism.'
  }
}
