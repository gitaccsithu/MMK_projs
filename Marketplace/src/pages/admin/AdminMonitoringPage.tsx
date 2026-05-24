import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Radar,
  CreditCard,
  Truck,
  OctagonAlert,
  ShieldBan,
  Gavel,
} from 'lucide-react'
import * as api from '@/services/mockApi'
import { BOOKING_STATUS_LABELS } from '@/types'
import type { Booking, Transaction } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'

const FRAUD_MOCK = [
  { id: 'f1', title: 'Velocity burst — same card ×6 in 120s', severity: 'critical' as const, region: 'SG East' },
  { id: 'f2', title: 'Merchant collusion heuristic tripped (#vendor_demo_8)', severity: 'high' as const, region: 'MY KL' },
  { id: 'f3', title: 'ATO pattern: dormant login revived + payout change', severity: 'medium' as const, region: 'TH BKK' },
]

export function AdminMonitoringPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [tx, setTx] = useState<Transaction[]>([])

  const reload = useCallback(async () => {
    const [b, t] = await Promise.all([api.getBookings(), api.getAllTransactions()])
    setBookings([...b].sort((x, y) => new Date(y.updatedAt).getTime() - new Date(x.updatedAt).getTime()))
    setTx(t)
  }, [])

  useEffect(() => {
    reload()
    const iv = window.setInterval(reload, 12000)
    return () => clearInterval(iv)
  }, [reload])

  const liveSlice = useMemo(() => bookings.slice(0, 18), [bookings])

  const riskHeat = tx.filter((txn) => txn.status === 'failed').length + FRAUD_MOCK.length * 3

  return (
    <AnimatedPage>
      <PageHeader title="Live operations center" description="Observe booking flow liquidity, treasury rails, and synthetic fraud sentinel events." />

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <AnimatedCard>
          <RiskStat label="Synthetic risk heat" score={riskHeat % 93} subtitle="Rolling blend of heuristic + chargebacks." icon={<Radar className="h-5 w-5 shrink-0" />} />
        </AnimatedCard>
        <AnimatedCard>
          <RiskStat label="Outstanding capture" score={Math.min(97, bookings.filter((b) => b.paymentStatus === 'pending').length * 11)} subtitle="Unsettled intents across PSPs." icon={<CreditCard className="h-5 w-5 shrink-0" />} />
        </AnimatedCard>
        <AnimatedCard>
          <RiskStat label="Field dispatch pressure" score={Math.min(100, bookings.filter((b) => b.status === 'on_the_way').length * 7)} subtitle="Active techs traversing SLA windows." icon={<Truck className="h-5 w-5 shrink-0" />} />
        </AnimatedCard>
      </div>

      <Tabs defaultValue="bookings">
        <TabsList className="mb-6 flex-wrap h-auto">
          <TabsTrigger value="bookings">Booking stream</TabsTrigger>
          <TabsTrigger value="treasury">Transactions</TabsTrigger>
          <TabsTrigger value="risk">Risk triage</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <Card className="border-primary/40">
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>In-flight engagements</CardTitle>
                <CardDescription>Autosyncs locally every ~12 seconds for this demo cockpit.</CardDescription>
              </div>
              <Badge variant="destructive" className="animate-pulse">
                Live
              </Badge>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px] pr-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="pb-3 pr-4">Booking</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4 hidden sm:table-cell">Payment</th>
                      <th className="pb-3 pr-4">Amount</th>
                      <th className="pb-3">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {liveSlice.map((b) => (
                      <tr key={b.id} className="group">
                        <td className="py-3 font-mono text-xs">{b.id.slice(-8)}</td>
                        <td className="py-3">
                          <Badge variant="secondary">{BOOKING_STATUS_LABELS[b.status]}</Badge>
                        </td>
                        <td className="hidden sm:table-cell py-3 capitalize text-muted-foreground">{b.paymentStatus}</td>
                        <td className="py-3 font-semibold">${b.amount}</td>
                        <td className="py-3 text-xs text-muted-foreground">{formatDistanceToNow(new Date(b.updatedAt), { addSuffix: true })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treasury">
          <Card>
            <CardHeader>
              <CardTitle>Treasury journal</CardTitle>
              <CardDescription>Unified ledger across wallet + card rails.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px]">
                <ul className="space-y-3 pr-4">
                  {tx.slice(0, 48).map((t) => (
                    <li
                      key={t.id}
                      className="flex flex-wrap gap-4 justify-between rounded-xl border bg-card px-4 py-3 text-sm hover:border-primary/40 transition-colors"
                    >
                      <div>
                        <p className="font-semibold">${t.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant={t.status === 'completed' ? 'secondary' : t.status === 'failed' ? 'destructive' : 'outline'}>
                          {t.status}
                        </Badge>
                        <p className="text-[11px] text-muted-foreground">{t.invoiceId}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-destructive to-orange-600" aria-hidden />
            <CardHeader>
              <div className="flex items-center gap-2">
                <OctagonAlert className="h-5 w-5 text-destructive" />
                <CardTitle>Fraud sentinel (mock payloads)</CardTitle>
              </div>
              <CardDescription>Operational narrative only — wired to heuristic placeholders for tabletop exercises.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {FRAUD_MOCK.map((evt) => (
                <article key={evt.id} className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 shadow-inner">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{evt.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <ShieldBan className="h-3.5 w-3.5" />
                        Telemetry region · {evt.region}
                      </p>
                    </div>
                    <Badge variant="destructive" className="capitalize shrink-0">
                      {evt.severity}
                    </Badge>
                  </div>
                  <div className="mt-4 flex gap-2 text-xs">
                    <Badge variant="outline" className="gap-1">
                      <Gavel className="h-3 w-3" /> assign SOC
                    </Badge>
                    <Badge variant="secondary">replay sessions</Badge>
                  </div>
                </article>
              ))}
              <article className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground md:col-span-2 bg-muted/20">
                Scenario builder ships with ServiceHub Fraud Studio — enqueue webhooks once your workspace graduates from mock data.
              </article>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AnimatedPage>
  )
}

function RiskStat({
  label,
  score,
  subtitle,
  icon,
}: {
  label: string
  score: number
  subtitle: string
  icon: ReactNode
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-[-20px] top-[-20px] h-36 w-36 rounded-full bg-primary/15 blur-2xl pointer-events-none" />
      <CardContent className="p-6 space-y-2">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="text-primary">{icon}</div>
        </div>
        <p className="text-3xl font-bold tracking-tight">{score}</p>
        <p className="text-xs text-muted-foreground leading-snug">{subtitle}</p>
        <div className="mt-4 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${score}%` }} />
        </div>
      </CardContent>
    </Card>
  )
}
