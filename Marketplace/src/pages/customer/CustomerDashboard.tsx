import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  Heart,
  Sparkles,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import * as api from '@/services/mockApi'
import type { Booking, Service, Vendor, Transaction } from '@/types'
import { formatCurrency, formatDate, formatDateTime, cn } from '@/utils/cn'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { AreaChartCard, StatCard } from '@/components/charts/ChartCards'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/booking/StatusBadge'

function spendingSeries(transactions: Transaction[]) {
  const months: { key: string; label: string; total: number }[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString('en-US', { month: 'short' }),
      total: 0,
    })
  }
  const payments = transactions.filter((t) => t.type === 'payment' && t.status === 'completed')
  payments.forEach((t) => {
    const dt = new Date(t.createdAt)
    const key = `${dt.getFullYear()}-${dt.getMonth()}`
    const bucket = months.find((m) => m.key === key)
    if (bucket) bucket.total += t.amount
  })
  return months.map((m) => ({ name: m.label, amount: Math.round(m.total * 100) / 100 }))
}

export function CustomerDashboard() {
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [favoriteVendors, setFavoriteVendors] = useState<Vendor[]>([])
  const [promotions, setPromotions] = useState<Awaited<ReturnType<typeof api.getPromotions>>>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user?.id) return
      setLoading(true)
      try {
        const [bks, svc, tx, promos, allVendors] = await Promise.all([
          api.getBookings(user.id, 'customer'),
          api.getServices(),
          api.getTransactions(user.id),
          api.getPromotions(),
          api.getVendors(),
        ])
        if (cancelled) return
        setBookings(bks)
        setServices(svc)
        setTransactions(tx)
        setPromotions(promos.filter((p) => p.isActive))
        const favIds = user.favoriteVendorIds ?? []
        setFavoriteVendors(allVendors.filter((v) => favIds.includes(v.id)))
      } catch {
        toast.error('Could not refresh your dashboard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user?.id, user?.favoriteVendorIds])

  const spendingData = useMemo(() => spendingSeries(transactions), [transactions])

  const recentBookings = useMemo(() => {
    return [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4)
  }, [bookings])

  const upcoming = useMemo(() => {
    const now = Date.now()
    return [...bookings]
      .filter((b) => ['pending', 'confirmed', 'vendor_assigned', 'on_the_way', 'in_progress'].includes(b.status))
      .filter((b) => new Date(b.scheduledAt).getTime() >= now || b.status !== 'completed')
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 3)
  }, [bookings])

  const suggestions = useMemo(() => {
    return [...services].sort((a, b) => b.popularity - a.popularity || b.rating - a.rating).slice(0, 6)
  }, [services])

  const totalSpend = useMemo(() => {
    return transactions.filter((t) => t.type === 'payment' && t.status === 'completed').reduce((s, t) => s + t.amount, 0)
  }, [transactions])

  const activeJobs = bookings.filter((b) => !['completed', 'cancelled'].includes(b.status)).length

  const serviceLookup = useMemo(() => {
    const m = new Map<string, Service>()
    services.forEach((s) => m.set(s.id, s))
    return m
  }, [services])

  if (!user) {
    return (
      <EmptyState
        title="Sign in to view your dashboard"
        description="Log in as a customer to see bookings, spending, and personalized picks."
      />
    )
  }

  return (
    <AnimatedPage>
      <PageHeader
        title={`Welcome back, ${user.name.split(' ')[0]}`}
        description="Here's what's happening with your ServiceHub account today."
      >
        <Button asChild variant="outline">
          <Link to="/customer/marketplace">
            Browse marketplace
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnimatedCard>
          <StatCard
            title="Active bookings"
            value={loading ? '—' : String(activeJobs)}
            change={activeJobs ? `${activeJobs} in progress or scheduled` : 'Nothing on the calendar'}
            icon={<Calendar className="h-5 w-5" />}
          />
        </AnimatedCard>
        <AnimatedCard>
          <StatCard
            title="Lifetime spending"
            value={loading ? '—' : formatCurrency(totalSpend)}
            change="+12% vs last quarter (demo)"
            icon={<WalletCards className="h-5 w-5" />}
          />
        </AnimatedCard>
        <AnimatedCard>
          <StatCard
            title="Favorite vendors"
            value={loading ? '—' : String(favoriteVendors.length)}
            icon={<Heart className="h-5 w-5" />}
          />
        </AnimatedCard>
        <AnimatedCard>
          <StatCard
            title="Loyalty balance"
            value={loading ? '—' : `${user.loyaltyPoints.toLocaleString()} pts`}
            change="Redeem at checkout soon"
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </AnimatedCard>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <AnimatedCard className="lg:col-span-2">
          <AreaChartCard
            title="Monthly spending"
            description="Paid services booked through ServiceHub"
            data={spendingData}
            dataKey="amount"
            xKey="name"
            loading={loading}
            height={260}
          />
        </AnimatedCard>

        <AnimatedCard>
          <Card className="h-full border-dashed bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Promotions for you
              </CardTitle>
              <CardDescription>Limited codes from partnered vendors.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <Skeleton className="h-20 w-full" />
              ) : promotions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No live promotions — check back later.</p>
              ) : (
                promotions.slice(0, 3).map((p) => (
                  <div key={p.id} className="rounded-lg border bg-background p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{p.title}</span>
                      <Badge variant="secondary">{p.code}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <AnimatedCard>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Upcoming visits</CardTitle>
                <CardDescription>Closest scheduled services</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/customer/bookings">All bookings</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">You're all caught up. Book something new?</p>
              ) : (
                upcoming.map((b) => {
                  const svc = serviceLookup.get(b.serviceId)
                  return (
                    <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-4">
                      <div>
                        <p className="font-medium">{svc?.title ?? 'Service'}</p>
                        <p className="text-sm text-muted-foreground">{formatDateTime(b.scheduledAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={b.status} />
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/customer/bookings/${b.id}/track`}>Track</Link>
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent activity</CardTitle>
              <CardDescription>Latest updates across your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : recentBookings.length === 0 ? (
                <EmptyState title="No bookings yet" description="Explore the marketplace to get started." />
              ) : (
                recentBookings.map((b) => {
                  const svc = serviceLookup.get(b.serviceId)
                  return (
                    <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium">{svc?.title ?? 'Booking'}</p>
                        <p className="text-xs text-muted-foreground">Booked {formatDate(b.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{formatCurrency(b.amount)}</span>
                        <StatusBadge status={b.status} />
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <AnimatedCard className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Favorite vendors</CardTitle>
                <CardDescription>Vendors you've saved for quick rebooking.</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/customer/marketplace">Find more</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              ) : favoriteVendors.length === 0 ? (
                <EmptyState title="No favorites saved" description="Tap the heart on a vendor profile to pin them here." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {favoriteVendors.map((v) => (
                    <div key={v.id} className="flex gap-3 rounded-xl border p-4">
                      <img
                        src={v.logo ?? 'https://api.dicebear.com/7.x/initials/svg?seed=V'}
                        alt=""
                        className="h-12 w-12 rounded-lg bg-muted object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{v.businessName}</p>
                        <p className="text-xs text-muted-foreground">
                          ★ {v.rating.toFixed(1)} · {v.completedBookings} jobs
                        </p>
                        <Button asChild variant="link" className="h-auto px-0 text-xs">
                          <Link to="/customer/marketplace">Browse their services →</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Recommended services</CardTitle>
                <CardDescription>Popular bookings in your metro this week.</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link to="/customer/marketplace">Explore all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-[16/11] rounded-xl" />)
                  : suggestions.map((s) => (
                      <Link
                        key={s.id}
                        to={`/customer/marketplace/${s.id}`}
                        className="group overflow-hidden rounded-xl border bg-card transition hover:border-primary/40"
                      >
                        <div className="relative aspect-[16/10] bg-muted">
                          <img src={s.images[0]} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
                          <Badge className="absolute right-2 top-2" variant="secondary">
                            ★ {s.rating.toFixed(1)}
                          </Badge>
                        </div>
                        <div className="space-y-1 p-4">
                          <p className={cn('line-clamp-2 font-medium leading-snug group-hover:text-primary')}>{s.title}</p>
                          <p className="text-sm font-semibold text-primary">{formatCurrency(s.packages[0]?.price ?? 0)}</p>
                        </div>
                      </Link>
                    ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>
    </AnimatedPage>
  )
}
