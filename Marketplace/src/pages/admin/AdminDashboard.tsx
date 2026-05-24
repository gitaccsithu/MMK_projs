import { useEffect, useMemo, useState } from 'react'
import {
  DollarSign,
  CalendarCheck,
  Store,
  Users,
  ArrowUpRight,
  Activity as ActivityIcon,
} from 'lucide-react'
import * as api from '@/services/mockApi'
import { PageHeader } from '@/components/shared/PageHeader'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { StatCard, LineChartCard, AreaChartCard } from '@/components/charts/ChartCards'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

export function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ bookings: 0, vendors: 0, users: 0, gmv: 0 })
  const [activity, setActivity] = useState<Awaited<ReturnType<typeof api.getActivityLogs>>>([])

  const bookingsTrend = useMemo(
    () =>
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((name, i) => ({
        name,
        bookings: 120 + i * 42 + Math.round(Math.sin(i) * 20),
      })),
    []
  )

  const revenueTrend = useMemo(
    () =>
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((name, i) => ({
        name,
        revenue: 18000 + i * 6200 + i * i * 400,
      })),
    []
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const [bk, vn, usr, trx, logs] = await Promise.all([
        api.getBookings(),
        api.getVendors(),
        api.getUsers(),
        api.getAllTransactions(),
        api.getActivityLogs(),
      ])
      if (!cancelled) {
        const gmv = trx.filter((t) => t.status === 'completed').reduce((acc, t) => acc + t.amount, 0)
        setCounts({ bookings: bk.length, vendors: vn.length, users: usr.length, gmv })
        setActivity(logs.slice(0, 28))
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AnimatedPage>
      <PageHeader title="Dashboard" description="Operational health, growth curves, and real-time telemetry for ServiceHub." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnimatedCard>
          {loading ? (
            <Skeleton className="h-[104px] w-full rounded-xl" />
          ) : (
            <StatCard
              title="Gross bookings value"
              value={`$${counts.gmv.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              change="+12.4% vs last quarter"
              icon={<DollarSign className="h-6 w-6" />}
            />
          )}
        </AnimatedCard>
        <AnimatedCard>
          {loading ? (
            <Skeleton className="h-[104px] w-full rounded-xl" />
          ) : (
            <StatCard
              title="Active bookings"
              value={counts.bookings.toLocaleString()}
              change="+3.2% week over week"
              icon={<CalendarCheck className="h-6 w-6" />}
            />
          )}
        </AnimatedCard>
        <AnimatedCard>
          {loading ? (
            <Skeleton className="h-[104px] w-full rounded-xl" />
          ) : (
            <StatCard
              title="Verified vendors"
              value={counts.vendors.toLocaleString()}
              change="+6 new approvals"
              icon={<Store className="h-6 w-6" />}
            />
          )}
        </AnimatedCard>
        <AnimatedCard>
          {loading ? (
            <Skeleton className="h-[104px] w-full rounded-xl" />
          ) : (
            <StatCard
              title="Registered users"
              value={counts.users.toLocaleString()}
              change="+184 sign-ups last 30d"
              icon={<Users className="h-6 w-6" />}
            />
          )}
        </AnimatedCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <LineChartCard
            title="Booking volume"
            description="Rolling six-month throughput across all categories"
            data={bookingsTrend}
            dataKey="bookings"
            loading={loading}
            height={300}
          />
          <AreaChartCard
            title="Revenue (GMV)"
            description="Captured payments & wallet movements (demo projection)"
            data={revenueTrend}
            dataKey="revenue"
            loading={loading}
            height={280}
          />
        </div>

        <AnimatedCard className="xl:col-span-2">
          <Card className="glass h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Activity feed</CardTitle>
                <p className="text-xs text-muted-foreground">Latest audited events from your operators</p>
              </div>
              <Badge variant="secondary" className="gap-1">
                <ActivityIcon className="h-3.5 w-3.5" />
                Live
              </Badge>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[540px] pr-3">
                  <ul className="space-y-3">
                    {activity.map((item) => (
                      <li
                        key={item.id}
                        className="flex gap-3 rounded-lg border bg-background/70 p-3 text-sm backdrop-blur-sm"
                      >
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <ArrowUpRight className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold capitalize">{item.action.replace(/_/g, ' ')}</span>
                            <span className="text-xs text-muted-foreground">{item.entity}</span>
                          </div>
                          <p className="mt-1 text-muted-foreground line-clamp-2">{item.details}</p>
                          <time className="mt-2 block text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </time>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>
    </AnimatedPage>
  )
}
