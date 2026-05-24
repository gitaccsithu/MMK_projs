import { useCallback, useEffect, useState } from 'react'
import { Wrench, Database, Shield } from 'lucide-react'
import * as api from '@/services/mockApi'
import { useSettingsStore } from '@/store/settingsStore'
import { PageHeader } from '@/components/shared/PageHeader'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function AdminSettingsPage() {
  const maintenanceMode = useSettingsStore((s) => s.maintenanceMode)
  const setMaintenanceMode = useSettingsStore((s) => s.setMaintenanceMode)

  const [commission, setCommission] = useState(12)
  const [supportSla, setSupportSla] = useState(4)
  const [walletTopupCeiling, setWalletTopupCeiling] = useState(250)
  const [dataRegionTag, setDataRegionTag] = useState('sgp-roaming')

  const syncFromServer = useCallback(async () => {
    const s = await api.getAppSettings()
    setCommission(s.commissionPercent ?? 12)
    setSupportSla(s.supportSlaHours ?? 4)
    setWalletTopupCeiling(s.walletBalance)
    setMaintenanceMode(Boolean(s.maintenanceMode))
  }, [setMaintenanceMode])

  useEffect(() => {
    syncFromServer()
  }, [syncFromServer])

  async function savePlatformEconomics() {
    await api.updateAppSettings({
      commissionPercent: commission,
      supportSlaHours: supportSla,
      walletBalance: walletTopupCeiling,
    })
    toast.success('Platform configuration saved')
  }

  return (
    <AnimatedPage>
      <PageHeader title="Mission control toggles" description="Mirror production guardrails safely — still backed by IndexedDB mocks here." />

      <div className="grid gap-6 lg:grid-cols-2">
        <AnimatedCard className="lg:col-span-2">
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Wrench className="h-6 w-6 text-destructive" />
                <div>
                  <CardTitle>Maintenance mode</CardTitle>
                  <CardDescription>
                    Coupled to <code className="text-xs">useSettingsStore</code> — customers see a maintenance shell when enabled in your router.
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={maintenanceMode ? 'destructive' : 'secondary'}>{maintenanceMode ? 'Draining' : 'Healthy'}</Badge>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={async (v) => {
                    setMaintenanceMode(v)
                    await api.updateAppSettings({ maintenanceMode: v })
                    toast.message(v ? 'Maintenance ON' : 'Traffic flowing')
                  }}
                />
              </div>
            </CardHeader>
          </Card>
        </AnimatedCard>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Take rate & trust</CardTitle>
            </div>
            <CardDescription>Surface-level economics you can export to finance models.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="commission">Platform commission (%)</Label>
              <Input
                id="commission"
                type="number"
                min={0}
                max={40}
                value={commission}
                onChange={(e) => setCommission(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sla">Support SLA (hours)</Label>
              <Input id="sla" type="number" min={1} max={72} value={supportSla} onChange={(e) => setSupportSla(Number(e.target.value))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wallet">Wallet ceiling (demo metric)</Label>
              <Input
                id="wallet"
                type="number"
                value={walletTopupCeiling}
                onChange={(e) => setWalletTopupCeiling(Number(e.target.value))}
              />
            </div>
            <Button type="button" className="w-full" onClick={() => savePlatformEconomics()}>
              Save economics
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Infrastructure façade</CardTitle>
            </div>
            <CardDescription>Holds narrative-only configuration that pairs with infra-as-code later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="region">Data residency routing tag</Label>
              <Input id="region" value={dataRegionTag} onChange={(e) => setDataRegionTag(e.target.value)} />
            </div>
            <div className="rounded-xl border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Heads-up:</strong>{' '}
              ServiceHub clones this cockpit per workspace. Persisted payloads still route through{' '}
              <code className="text-[11px]">storageService.setAppData</code> mock transport.
            </div>
          </CardContent>
        </Card>
      </div>
    </AnimatedPage>
  )
}
