import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTheme } from 'next-themes'
import { Fingerprint, Globe2, Moon, ShieldCheck, Sun, SunMoon } from 'lucide-react'
import { toast } from 'sonner'
import { useSettingsStore } from '@/store/settingsStore'
import * as api from '@/services/mockApi'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const securitySchema = z.object({
  current: z.string().min(4),
  next: z.string().min(8, 'Use at least 8 chars for the mock'),
})

export function CustomerSettingsPage() {
  const { theme, setTheme } = useTheme()
  const language = useSettingsStore((s) => s.language)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const setStoreTheme = useSettingsStore((s) => s.setTheme)
  const [twoFactor, setTwoFactor] = useState(true)
  const [biometric, setBiometric] = useState(false)
  const form = useForm<z.infer<typeof securitySchema>>({
    resolver: zodResolver(securitySchema),
    defaultValues: { current: '', next: '' },
  })

  function syncThemeChoice(next: 'light' | 'dark' | 'system') {
    setStoreTheme(next)
    setTheme(next)
    toast.success(`Theme → ${next}`)
  }

  function syncLanguage(next: 'en' | 'mm') {
    setLanguage(next)
    toast.success(next === 'mm' ? 'ဘာသာစကားပြောင်းပြီး (mock)' : 'Language preference updated (mock)')
  }

  async function syncMaintenanceMock(enabled: boolean) {
    await api.updateAppSettings({ maintenanceMode: enabled })
    toast.message(enabled ? 'Maintenance banner armed (mock)' : 'Public traffic restored (mock)')
  }

  return (
    <AnimatedPage>
      <PageHeader title="Settings" description="Theme, language, and security posture for this customer shell." />

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance">
          <div className="grid gap-6 lg:grid-cols-2">
            <AnimatedCard>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Theme</CardTitle>
                  <CardDescription>Hooks into next-themes + persisted settings store.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <Button
                    type="button"
                    variant={theme === 'light' ? 'default' : 'outline'}
                    className="h-24 flex-col gap-2"
                    onClick={() => syncThemeChoice('light')}
                  >
                    <Sun className="h-5 w-5" />
                    Daylight
                  </Button>
                  <Button
                    type="button"
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    className="h-24 flex-col gap-2"
                    onClick={() => syncThemeChoice('dark')}
                  >
                    <Moon className="h-5 w-5" />
                    Midnight
                  </Button>
                  <Button
                    type="button"
                    variant={theme === 'system' ? 'default' : 'outline'}
                    className="h-24 flex-col gap-2"
                    onClick={() => syncThemeChoice('system')}
                  >
                    <SunMoon className="h-5 w-5" />
                    System
                  </Button>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Globe2 className="h-4 w-4" />
                    Language
                  </CardTitle>
                  <CardDescription>Mock toggle between English ↔ Myanmar glyphs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button type="button" variant={language === 'en' ? 'default' : 'outline'} onClick={() => syncLanguage('en')}>
                      English
                    </Button>
                    <Button type="button" variant={language === 'mm' ? 'default' : 'outline'} onClick={() => syncLanguage('mm')}>
                      မြန်မာ (demo copy)
                    </Button>
                  </div>
                  <Badge variant="secondary">Transliteration layer not wired yet</Badge>
                  <MaintenanceToggleRow onToggle={(v) => void syncMaintenanceMock(v)} />
                </CardContent>
              </Card>
            </AnimatedCard>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <AnimatedCard>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4" />
                  Trusted device controls
                </CardTitle>
                <CardDescription>Mock toggles illustrating future security primitives.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <label className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-4">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Fingerprint className="h-4 w-4" /> Two-factor SMS/WhatsApp hybrid
                    </p>
                    <p className="text-xs text-muted-foreground">We&apos;ll poke you before payouts over $750.</p>
                  </div>
                  <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-4">
                  <div>
                    <p className="font-medium">Face / Touch unlock</p>
                    <p className="text-xs text-muted-foreground">Fast re-auth on trusted mobile clients.</p>
                  </div>
                  <Switch checked={biometric} onCheckedChange={setBiometric} />
                </label>

                <form
                  className="space-y-4 rounded-2xl border bg-muted/30 p-4"
                  onSubmit={form.handleSubmit(() => {
                    toast.success('Password rotation queued (demo only)')
                    form.reset({ current: '', next: '' })
                  })}
                >
                  <div className="space-y-2">
                    <Label htmlFor="cur">Current password</Label>
                    <Input id="cur" type="password" autoComplete="current-password" {...form.register('current')} />
                    {form.formState.errors.current && (
                      <p className="text-xs text-destructive">{form.formState.errors.current.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nxt">New password</Label>
                    <Input id="nxt" type="password" autoComplete="new-password" {...form.register('next')} />
                    {form.formState.errors.next && (
                      <p className="text-xs text-destructive">{form.formState.errors.next.message}</p>
                    )}
                  </div>
                  <Button type="submit">Schedule rotation</Button>
                </form>
              </CardContent>
            </Card>
          </AnimatedCard>
        </TabsContent>
      </Tabs>
    </AnimatedPage>
  )
}

function MaintenanceToggleRow({ onToggle }: { onToggle: (v: boolean) => void }) {
  const [armed, setArmed] = useState(false)
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-sm">
      <div>
        <p className="font-medium">Simulate marketplace maintenance banner</p>
        <p className="text-xs text-muted-foreground">Patches app settings via mockApi for realism.</p>
      </div>
      <Switch
        checked={armed}
        onCheckedChange={(checked) => {
          setArmed(checked)
          onToggle(checked)
        }}
      />
    </label>
  )
}
