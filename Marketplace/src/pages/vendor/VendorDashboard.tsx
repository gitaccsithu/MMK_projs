import { useEffect, useMemo, useState } from 'react'
import { format, startOfDay, subDays } from 'date-fns'
import { DollarSign, Star, CalendarCheck, TrendingUp } from 'lucide-react'
import * as api from '@/services/mockApi'
import { PageHeader } from '@/components/shared/PageHeader'
import {
  AreaChartCard,
  BarChartCard,
  LineChartCard,
  PieChartCard,
  StatCard,
} from '@/components/charts/ChartCards'
import type { Booking } from '@/types'
import { useVendorForAuthUser } from '@/pages/vendor/useVendorWorkspace'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export function VendorDashboard() {
  const userId = useAuthStore((s) => s.session?.userId)
  const { vendor, loading: vLoading } = useVendorForAuthUser(userId)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loadingBooks, setLoadingBooks] = useState(true)

  useEffect(() => {
    let active = true
    void (async () => {
      await Promise.resolve()
      if (!active) return

      if (!userId) {
        setBookings([])
        setLoadingBooks(false)
        return
      }

      setLoadingBooks(true)
      try {
        const b = await api.getBookings(userId, 'vendor')
        if (active) setBookings(b)
      } finally {
        if (active) setLoadingBooks(false)
      }
    })()
    return () => {
      active = false
    }
  }, [userId])

  const stats = useMemo(() => {
    const byStatus = bookings.reduce<Record<string, number>>((acc, b) => {
      acc[b.status] = (acc[b.status] ?? 0) + 1
      return acc
    }, {})
    const completed = bookings.filter((b) => b.status === 'completed')
    const recentRevenue = completed.reduce((s, b) => s + b.amount, 0)
    const pending = byStatus.pending ?? 0
    return { byStatus, completed: completed.length, recentRevenue, pending, total: bookings.length }
  }, [bookings])

  const weeklyRevenue = useMemo(() => {
    const points: { name: string; revenue: number; completedCount: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i))
      const key = format(day, 'MMM d')
      const dayStart = day.getTime()
      const dayEnd = dayStart + 86400000
      const dayRows = bookings.filter((b) => b.status === 'completed').filter((b) => {
        const t = new Date(b.updatedAt).getTime()
        return t >= dayStart && t < dayEnd
      })
      const rev = dayRows.reduce((s, b) => s + b.amount, 0)
      points.push({ name: key, revenue: Math.round(rev), completedCount: dayRows.length })
    }
    return points
  }, [bookings])

  const statusChart = useMemo(() => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      vendor_assigned: 'Assigned',
      on_the_way: 'En route',
      in_progress: 'In progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    }
    return Object.entries(stats.byStatus).map(([k, v]) => ({
      name: labels[k] ?? k,
      value: v,
    }))
  }, [stats.byStatus])

  const satisfactionTrend = useMemo(() => {
    const r = vendor?.rating ?? 4.5
    return Array.from({ length: 8 }, (_, i) => ({
      name: `W${i + 1}`,
      score: Number((r + (i - 4) * 0.05).toFixed(2)),
    }))
  }, [vendor?.rating])

  if (vLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No vendor profile</CardTitle>
          <CardDescription>No business is linked to your user account yet.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Vendor dashboard"
        description={`Welcome back — ${vendor.businessName}`}
      >
        <Badge variant={vendor.isActive ? 'default' : 'secondary'}>
          {vendor.verificationStatus === 'approved' ? 'Verified' : vendor.verificationStatus}
        </Badge>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Lifetime earnings"
          value={`$${vendor.totalEarnings.toLocaleString()}`}
          change="+Demo growth"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Completed bookings"
          value={String(vendor.completedBookings)}
          icon={<CalendarCheck className="h-5 w-5" />}
        />
        <StatCard
          title="Avg. rating"
          value={vendor.rating.toFixed(1)}
          icon={<Star className="h-5 w-5" />}
        />
        <StatCard
          title="Active pipeline"
          value={String(stats.pending)}
          change={`${stats.total} total in view`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AreaChartCard
          title="Revenue last 7 days"
          description="Completed booking amounts by day"
          data={weeklyRevenue}
          dataKey="revenue"
          loading={loadingBooks}
        />
        <PieChartCard
          title="Bookings by status"
          description="Current snapshot"
          data={statusChart.length ? statusChart : [{ name: 'No data', value: 1 }]}
          dataKey="value"
          nameKey="name"
          loading={loadingBooks}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <LineChartCard
          title="Satisfaction trend (mock)"
          description="Rolling score projection from your storefront rating"
          data={satisfactionTrend}
          dataKey="score"
          xKey="name"
        />
        <BarChartCard
          title="Recent completed volume"
          description="Count of completed jobs (last 7 days)"
          data={weeklyRevenue.map((d) => ({ name: d.name, count: d.completedCount }))}
          dataKey="count"
          loading={loadingBooks}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open actions</CardTitle>
          <CardDescription>Stay on top of customer requests.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="outline">{stats.pending} pending confirmations</Badge>
          <Badge variant="outline">{stats.byStatus.confirmed ?? 0} confirmed</Badge>
          <Badge variant="outline">{stats.byStatus.in_progress ?? 0} in progress</Badge>
        </CardContent>
      </Card>
    </div>
  )
}
