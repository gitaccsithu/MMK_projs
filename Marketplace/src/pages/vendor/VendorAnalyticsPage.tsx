import { useEffect, useMemo, useState } from 'react'
import { format, getHours, subMonths } from 'date-fns'
import * as api from '@/services/mockApi'
import { useAuthStore } from '@/store/authStore'
import { useVendorForAuthUser } from '@/pages/vendor/useVendorWorkspace'
import { PageHeader } from '@/components/shared/PageHeader'
import { AreaChartCard, BarChartCard, LineChartCard, StatCard } from '@/components/charts/ChartCards'
import type { Booking } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Repeat, Clock } from 'lucide-react'

export function VendorAnalyticsPage() {
  const userId = useAuthStore((s) => s.session?.userId)
  const { vendor, loading: vLoading } = useVendorForAuthUser(userId)
  const [bookings, setBookings] = useState<Booking[]>([])

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
      if (active) setBookings(b)
    })()
    return () => {
      active = false
    }
  }, [userId])
  const completed = useMemo(() => bookings.filter((b) => b.status === 'completed'), [bookings])

  const monthlyTrend = useMemo(() => {
    const points: { name: string; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const start = subMonths(new Date(), i)
      const label = format(start, 'MMM')
      const month = start.getMonth()
      const year = start.getFullYear()
      const rev = completed
        .filter((b) => {
          const d = new Date(b.updatedAt)
          return d.getMonth() === month && d.getFullYear() === year
        })
        .reduce((s, b) => s + b.amount, 0)
      points.push({ name: label, revenue: Math.round(rev) })
    }
    return points
  }, [completed])

  const peakHours = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, h) => ({
      name: `${h}:00`,
      bookings: 0,
    }))
    for (const b of bookings) {
      const h = getHours(new Date(b.scheduledAt))
      buckets[h].bookings += 1
    }
    const top = [...buckets].sort((a, b) => b.bookings - a.bookings)[0]
    return { buckets, top }
  }, [bookings])

  const retention = useMemo(() => {
    const customers = new Map<string, number>()
    completed.forEach((b) => {
      customers.set(b.customerId, (customers.get(b.customerId) ?? 0) + 1)
    })
    const returning = [...customers.values()].filter((c) => c > 1).length
    const total = customers.size || 1
    const rate = Math.round((returning / total) * 100)
    const series = [
      { name: 'W1', repeatRate: Math.max(30, rate - 10) },
      { name: 'W2', repeatRate: Math.max(35, rate - 4) },
      { name: 'W3', repeatRate: rate },
      { name: 'W4', repeatRate: Math.min(92, rate + 6) },
    ]
    return { rate, returning, total, series }
  }, [completed])

  if (vLoading) return <Skeleton className="h-96 w-full" />

  if (!vendor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Vendor profile not found for this user.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Revenue trajectory, demand heatmap, and loyalty signals from your bookings."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="6-mo revenue (completed)"
          value={`$${completed.reduce((s, b) => s + b.amount, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Repeat customer rate"
          value={`${retention.rate}%`}
          change={`${retention.returning} of ${retention.total} customers returned`}
          icon={<Repeat className="h-5 w-5" />}
        />
        <StatCard
          title="Peak booking hour"
          value={peakHours.top ? peakHours.top.name : '—'}
          change={
            peakHours.top?.bookings ? `${peakHours.top.bookings} jobs scheduled` : 'Not enough data yet'
          }
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AreaChartCard
          title="Revenue trend"
          description="Last 6 rolling months (completed jobs)"
          data={monthlyTrend}
          dataKey="revenue"
        />
        <LineChartCard
          title="Retention lift (mock uplift)"
          description="Modeled repeat booking rate from cohort mix"
          data={retention.series}
          dataKey="repeatRate"
          xKey="name"
        />
      </div>

      <BarChartCard
        title="Peak hours"
        description="When customers schedule you (24h heatmap)"
        data={peakHours.buckets}
        dataKey="bookings"
        height={320}
      />

      <Card>
        <CardHeader>
          <CardTitle>Operational tips</CardTitle>
          <CardDescription>Generated locally from booking timestamps — swap for SQL in production.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="font-medium">Fulfillment mix</p>
            <p className="mt-2 text-muted-foreground">
              {bookings.filter((b) => b.status === 'completed').length} completions vs{' '}
              {bookings.filter((b) => b.status === 'cancelled').length} cancels tracked in mock data.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-medium">Liquidity signal</p>
            <p className="mt-2 text-muted-foreground">
              Keep at least {(bookings.length ? Math.ceil(bookings.length * 0.15) : 3) || 3} crews free during{' '}
              {peakHours.top?.name ?? 'peak'} to protect SLA.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-medium">Storefront health</p>
            <p className="mt-2 text-muted-foreground">
              Public rating {vendor.rating.toFixed(1)} from {vendor.reviewCount} reviews strengthens conversion.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
