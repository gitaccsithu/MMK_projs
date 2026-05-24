import { useEffect, useState } from 'react'
import { Copy, Gift, Sparkles, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/utils/cn'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { AreaChartCard } from '@/components/charts/ChartCards'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

export function ReferralsPage() {
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [chart, setChart] = useState<{ week: string; pts: number }[]>([])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    const timer = window.setTimeout(() => {
      setChart(
        ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'].map((week, idx) => ({
          week,
          pts: Math.max(120, Math.min(user.loyaltyPoints, 900) - idx * 95 + idx * 7),
        }))
      )
      setLoading(false)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [user])

  if (!user) {
    return <EmptyState title="Sign in to unlock referrals" />
  }

  const account = user

  function copyCode() {
    void navigator.clipboard.writeText(account.referralCode)
    toast.success('Referral code copied')
  }

  const tierTarget = 5000
  const progress = Math.min(100, Math.round((account.loyaltyPoints / tierTarget) * 100))

  return (
    <AnimatedPage>
      <PageHeader title="Referrals & loyalty" description="Dual-sided rewards for inviting neighbors to ServiceHub." />

      <div className="grid gap-6 lg:grid-cols-3">
        <AnimatedCard className="lg:col-span-2">
          <Card className="h-full border-dashed border-primary/40 bg-gradient-to-br from-primary/10 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gift className="h-4 w-4" /> Your invite runway
              </CardTitle>
              <CardDescription>Share this code—both parties earn loyalty fuel when a booking completes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border bg-background px-6 py-4 font-mono text-2xl font-bold tracking-[0.4em]">
                  {account.referralCode}
                </div>
                <Button type="button" variant="outline" onClick={copyCode}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Badge variant="secondary">+250 pts / conversion</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Deep link (mock): <code className="text-xs">https://servicehub.app/i/{account.referralCode.toLowerCase()}</code>
              </p>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4" /> Loyalty runway
              </CardTitle>
              <CardDescription>Closer to concierge upgrades every time vendors rate you 5★.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Lifetime points</p>
                <p className="text-4xl font-bold">{account.loyaltyPoints.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Next tier unlocks concierge SMS + waived rush fees · target {tierTarget.toLocaleString()} pts</p>
              </div>
              <div>
                <div className="mb-2 flex justify-between text-xs">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
              <Badge variant="outline">Redemptions launch Q3 (mock roadmap)</Badge>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>

      <AnimatedCard className="mt-6">
        {loading ? (
          <Skeleton className="h-72 rounded-2xl" />
        ) : (
          <AreaChartCard
            title="Referral momentum (mock)"
            description="Synthetic weekly points accrual for storytelling"
            data={chart}
            dataKey="pts"
            xKey="week"
            height={280}
          />
        )}
      </AnimatedCard>

      <AnimatedCard className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" /> Friends you&apos;ve activated
            </CardTitle>
            <CardDescription>Auto-generated roster for UI polish—swap with real graph later.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {['Noah', 'Priya', 'Mateo', 'Liwei'].map((name, idx) => (
              <div key={name} className="flex items-center justify-between rounded-2xl border p-4 text-sm">
                <div>
                  <p className="font-semibold">{name} · joined week {idx + 1}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(35 + idx * 12)} credit applied</p>
                </div>
                <Badge variant="success">{120 - idx * 15} pts</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </AnimatedCard>
    </AnimatedPage>
  )
}
