import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownCircle, BadgeDollarSign, Download, Landmark, Receipt } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import * as api from '@/services/mockApi'
import type { Transaction } from '@/types'
import { formatCurrency, formatDateTime, generateId } from '@/utils/cn'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { LineChartCard, StatCard } from '@/components/charts/ChartCards'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const topUpSchema = z.object({
  amount: z.number({ message: 'Amount required' }).positive().max(9999),
})

type TopUpValues = z.infer<typeof topUpSchema>

export function WalletPage() {
  const user = useAuthStore((s) => s.user)
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const form = useForm<TopUpValues>({
    resolver: zodResolver(topUpSchema),
    defaultValues: { amount: 50 },
  })

  const hydrate = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const [settings, txs] = await Promise.all([api.getAppSettings(), api.getTransactions(user.id)])
      setBalance(settings.walletBalance)
      const sorted = txs.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setTransactions(sorted)
    } catch {
      toast.error('Could not hydrate wallet ledger.')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const chartBars = useMemo(() => {
    return transactions.slice(0, 8).reverse().map((t, idx) => ({
      label: `#${transactions.length - idx}`,
      net: Math.abs(t.amount),
    }))
  }, [transactions])

  async function onTopUp(values: TopUpValues) {
    if (!user?.id) return
    const snapshot = api.getAppDataSync()
    snapshot.settings.walletBalance += values.amount
    const txn: Transaction = {
      id: generateId('txn'),
      userId: user.id,
      amount: values.amount,
      type: 'topup',
      method: 'wallet',
      status: 'completed',
      description: `Mock top-up captured at ${formatDateTime(new Date().toISOString())}`,
      invoiceId: `INV-${Date.now().toString().slice(-7)}`,
      createdAt: new Date().toISOString(),
    }
    snapshot.transactions.unshift(txn)
    api.saveAppDataSync(snapshot)
    await api.updateAppSettings({ walletBalance: snapshot.settings.walletBalance })
    toast.success(`Added ${formatCurrency(values.amount)} to wallet`)
    form.reset({ amount: 50 })
    await hydrate()
  }

  function invoiceBlob(t: Transaction) {
    const body = `ServiceHub Receipt
-----------------------------------
Invoice : ${t.invoiceId}
Amount  : ${formatCurrency(t.amount)}
Status  : ${t.status.toUpperCase()}
Method  : ${t.method}
-----------------------------------
${t.description}
Generated ${formatDateTime(t.createdAt)}
`
    const blob = new Blob([body], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${t.invoiceId}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success('Invoice downloaded locally')
  }

  if (!user) {
    return <EmptyState title="Sign in to view wallet" />
  }

  return (
    <AnimatedPage>
      <PageHeader title="Digital wallet" description="Escrow payouts, cashback, and concierge credits in one runway." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnimatedCard>
          <StatCard
            title="Liquid balance"
            value={loading ? '—' : formatCurrency(balance)}
            icon={<BadgeDollarSign className="h-5 w-5" />}
            change="Instant settlement after job sign-off (demo)."
          />
        </AnimatedCard>
        <AnimatedCard>
          <StatCard
            title="Pending holds"
            value={loading ? '—' : formatCurrency(Math.min(balance * 0.15, 99))}
            icon={<Landmark className="h-5 w-5" />}
            change="Released when bookings complete"
          />
        </AnimatedCard>
        <AnimatedCard>
          <StatCard
            title="Recent movement"
            value={loading ? '—' : formatCurrency(chartBars.reduce((s, x) => s + x.net, 0))}
            icon={<Receipt className="h-5 w-5" />}
            change="Synthetic rollup for chart below"
          />
        </AnimatedCard>
        <AnimatedCard>
          <Card className="h-full border-primary/35 bg-gradient-to-br from-primary/10 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowDownCircle className="h-4 w-4" /> Top up
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full">Credit wallet (mock ACH)</Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={form.handleSubmit((d) => void onTopUp(d))}>
                    <DialogHeader>
                      <DialogTitle>Push funds instantly</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                      <Label htmlFor="amt">USD amount</Label>
                      <Input id="amt" type="number" step={5} {...form.register('amount', { valueAsNumber: true })} />
                      {form.formState.errors.amount && (
                        <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Zero fees inside the sandbox.</p>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Add funds</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>

      <AnimatedCard className="mt-6">
        <LineChartCard
          title="Net wallet velocity"
          description="Recent signed movements (positive axis magnitude)"
          data={chartBars}
          loading={loading}
          dataKey="net"
          xKey="label"
          height={260}
        />
      </AnimatedCard>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <AnimatedCard className="lg:col-span-2">
          <Tabs defaultValue="tx">
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base">Ledger</CardTitle>
                    <CardDescription>Immutable demo trail with reversible dispute hooks.</CardDescription>
                  </div>
                  <TabsList>
                    <TabsTrigger value="tx">Timeline</TabsTrigger>
                    <TabsTrigger value="method">Rails</TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent>
                <TabsContent value="tx">
                  <div className="space-y-3">
                    {loading ? (
                      <Skeleton className="h-24 w-full" />
                    ) : transactions.length === 0 ? (
                      <EmptyState title="No receipts yet" description="Make a marketplace booking or add a wallet top-up." />
                    ) : (
                      transactions.map((t) => (
                        <div
                          key={t.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 text-sm"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-semibold">{t.description}</p>
                              <Badge variant={t.status === 'failed' ? 'destructive' : 'secondary'}>{t.status}</Badge>
                              <Badge variant="outline">{t.type}</Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(t.createdAt)}</p>
                            <p className="text-[11px] text-muted-foreground">Invoice {t.invoiceId}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => invoiceBlob(t)}>
                              <Download className="mr-2 h-3.5 w-3.5" />
                              Invoice
                            </Button>
                            {t.bookingId && (
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/customer/bookings/${t.bookingId}/track`}>Track booking</Link>
                              </Button>
                            )}
                          </div>
                          <span className="font-mono text-lg font-bold">{formatCurrency(t.amount)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="method" className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <p>Wallets clear same-day; cards tokenize before vendors see details; PayPal routes into escrow.</p>
                  <Badge variant="outline">PCI posture is conceptual in this mock</Badge>
                  <p className="text-xs">
                    Need another rail? Extend <code className="text-foreground">mockApi</code> with processor webhooks later.
                  </p>
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </AnimatedCard>

        <AnimatedCard>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Payment choreography</CardTitle>
              <CardDescription>Shows vaulted instruments from Profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {user.paymentMethods.length === 0 ? (
                <p>Open Profile → Payments to attach a vaulted instrument.</p>
              ) : (
                user.paymentMethods.map((pm, idx) => (
                  <div key={pm.id} className="rounded-2xl border p-4">
                    <p className="font-semibold text-foreground">{pm.label}</p>
                    <p className="text-xs capitalize">{pm.type}</p>
                    {pm.expiry && <p className="text-xs">{pm.expiry}</p>}
                    <div className="mt-3 flex gap-2 text-[11px]">
                      <Badge variant={idx === 0 ? 'success' : 'outline'}>{idx === 0 ? 'Primary' : 'Fallback'}</Badge>
                      <Button variant="outline" size="sm" disabled>
                        Edit (mock locked)
                      </Button>
                    </div>
                  </div>
                ))
              )}
              <Button asChild variant="secondary" className="w-full">
                <Link to="/customer/profile">Manage payment corridors</Link>
              </Button>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>
    </AnimatedPage>
  )
}
