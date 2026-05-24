import { useState } from 'react'
import { Megaphone, RadioTower, Smartphone, Mail } from 'lucide-react'
import * as api from '@/services/mockApi'
import { PageHeader } from '@/components/shared/PageHeader'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

const SEGMENTS = [
  { key: 'all', label: 'Entire funnel' },
  { key: 'customers', label: 'Customers · active 30d' },
  { key: 'vendors', label: 'Vendors · live listings' },
  { key: 'ops', label: 'Internal admins' },
  { key: 'champions', label: 'Top decile promoters' },
] as const

export function AdminNotificationsPage() {
  const [title, setTitle] = useState('Platform maintenance briefing')
  const [subtitle, setSubtitle] = useState('ServiceHub will upgrade payments routing briefly tonight.')
  const [cta, setCta] = useState('Learn more · status.servicehub.help')
  const [segment, setSegment] = useState<(typeof SEGMENTS)[number]['key']>('all')
  const [push, setPush] = useState(true)
  const [email, setEmail] = useState(true)
  const [deepLink, setDeepLink] = useState('/help')

  function broadcast(dryRun: boolean) {
    const payload = JSON.stringify({
      segment,
      channels: {
        push,
        email,
      },
      message: {
        title,
        subtitle,
        cta,
        deepLink,
      },
    })
    if (dryRun) {
      toast.message('Dry run captured', {
        description: payload.slice(0, 156) + (payload.length > 156 ? '…' : ''),
      })
      return
    }

    toast.promise(
      new Promise<string>((resolve) =>
        window.setTimeout(() => {
          const logId = crypto.randomUUID().slice(0, 8)
          persistBroadcastLog(logId)
          resolve(logId)
        }, 880)
      ),
      {
        loading: `Queueing ${SEGMENTS.find((s) => s.key === segment)?.label ?? ''} cohort…`,
        success: () => 'Broadcast enqueue accepted (demo transport stub)',
      }
    )
  }

  function persistBroadcastLog(logSuffix: string) {
    try {
      const data = api.getAppDataSync()
      data.activityLogs.unshift({
        id: `broadcast_${logSuffix}`,
        action: 'admin_broadcast_mock',
        entity: 'notifications',
        entityId: segment,
        details: `Synthetic broadcast (${push ? 'push' : ''}${push && email ? '+' : ''}${email ? 'email' : ''}) — ${title}`,
        createdAt: new Date().toISOString(),
      })
      api.saveAppDataSync(data)
    } catch {
      toast.error('Mock logger failed silently')
    }
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="Broadcast console (mock)"
        description="Design lifecycle messaging journeys without touching SNS/APNs."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 shadow-lg border-primary/20">
          <CardHeader className="space-y-1">
            <div className="flex items-start gap-2">
              <Megaphone className="mt-1 h-5 w-5 text-primary" />
              <div>
                <CardTitle>Audience canvas</CardTitle>
                <CardDescription>Select channels + segments — dry-runs serialize into your clipboard trail.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-2">
              <Label>Segment lift</Label>
              <Select value={segment} onValueChange={(v) => setSegment(v as typeof segment)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Audience" />
                </SelectTrigger>
                <SelectContent>
                  {SEGMENTS.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="n-title">Title</Label>
              <Input id="n-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="n-sub">Body</Label>
              <textarea
                id="n-sub"
                className="min-h-[112px] w-full rounded-xl border bg-background px-3 py-2 text-sm resize-none"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="n-cta">Call to action label</Label>
                <Input id="n-cta" value={cta} onChange={(e) => setCta(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="n-link">Deep link</Label>
                <Input id="n-link" value={deepLink} onChange={(e) => setDeepLink(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center justify-between rounded-2xl border px-4 py-3 shadow-sm gap-4">
                <span className="flex items-center gap-2 font-medium">
                  <Smartphone className="h-4 w-4 text-primary" />
                  Push toast
                </span>
                <Switch checked={push} onCheckedChange={setPush} />
              </label>
              <label className="flex items-center justify-between rounded-2xl border px-4 py-3 shadow-sm gap-4">
                <span className="flex items-center gap-2 font-medium">
                  <Mail className="h-4 w-4 text-primary" />
                  Email mirror
                </span>
                <Switch checked={email} onCheckedChange={setEmail} />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => broadcast(true)}>
                Dry run serialization
              </Button>
              <Button type="button" className="flex-1 gap-2" onClick={() => broadcast(false)}>
                <RadioTower className="h-4 w-4" /> Enqueue (mock carrier)
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <AnimatedCard>
            <Card className="h-full bg-gradient-to-b from-muted/80 via-background to-background">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  Live preview surfaces
                </CardTitle>
                <CardDescription>CarPlay-style preview for mobile push.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-[32px] border bg-card p-6 shadow-xl">
                  <div className="rounded-3xl bg-primary/95 px-6 py-4 text-primary-foreground space-y-1">
                    <p className="text-xs uppercase tracking-[0.4em] text-primary-foreground/70">Push</p>
                    <p className="font-semibold text-lg leading-snug">{title}</p>
                    <p className="text-sm text-primary-foreground/85">{subtitle}</p>
                  </div>
                  <button
                    type="button"
                    className="mt-4 w-full rounded-2xl border border-primary/30 bg-muted/70 py-3 text-xs font-semibold text-primary uppercase tracking-wide"
                  >
                    {cta}
                  </button>
                  <p className="mt-5 text-[11px] text-muted-foreground text-center">{deepLink}</p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>
      </div>
    </AnimatedPage>
  )
}
