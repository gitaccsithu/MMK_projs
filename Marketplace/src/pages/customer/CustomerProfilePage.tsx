import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CreditCard, MapPinPlus, Trash2, UserCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import * as api from '@/services/mockApi'
import type { Address, PaymentMethodInfo } from '@/types'
import { cn, formatDate, generateId } from '@/utils/cn'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

const profileSchema = z.object({
  name: z.string().min(2, 'Name too short'),
  phone: z.string().min(6, 'Add a reachable number'),
})

const addressSchema = z.object({
  label: z.string().min(1),
  street: z.string().min(4),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(3),
})

const pmSchema = z.object({
  type: z.enum(['card', 'wallet', 'paypal', 'grabpay', 'apple_pay']),
  label: z.string().min(2),
  last4: z.string().max(4).optional(),
  expiry: z.string().max(5).optional(),
})

export function CustomerProfilePage() {
  const user = useAuthStore((s) => s.user)
  const [avatarPreview, setAvatarPreview] = useState<string>('')

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
    },
  })

  useEffect(() => {
    profileForm.reset({ name: user?.name ?? '', phone: user?.phone ?? '' })
    setAvatarPreview(user?.avatar ?? '')
  }, [user, profileForm])

  const addressForm = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: 'Home', street: '', city: '', state: '', zip: '' },
  })

  const pmForm = useForm({
    resolver: zodResolver(pmSchema),
    defaultValues: { type: 'card', label: 'Visa ****', last4: '4242', expiry: '12/28' },
  })

  if (!user) {
    return <EmptyState title="Sign in required" />
  }

  const me = user

  async function saveProfile(data: z.infer<typeof profileSchema>) {
    const res = await api.updateUser(me.id, data)
    if (!res.data) {
      toast.error(res.error ?? 'Could not save')
      return
    }
    useAuthStore.setState({ user: res.data })
    toast.success('Profile synced')
  }

  async function onAvatar(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    if (file.size > 1_200_000) {
      toast.error('Please pick an image smaller than ~1 MB for the demo datastore.')
      return
    }
    const reader = new FileReader()
    reader.onloadend = async () => {
      const raw = typeof reader.result === 'string' ? reader.result : ''
      setAvatarPreview(raw)
      const res = await api.updateUser(me.id, { avatar: raw })
      if (res.data) {
        useAuthStore.setState({ user: res.data })
        toast.success('Avatar refreshed')
      } else toast.error(res.error ?? 'Avatar failed')
    }
    reader.readAsDataURL(file)
  }

  async function appendAddress(vals: z.infer<typeof addressSchema>) {
    const nextAddr: Address = {
      ...vals,
      id: generateId('addr'),
      lat: me.addresses[0]?.lat ?? 1.35,
      lng: me.addresses[0]?.lng ?? 103.82,
      isDefault: me.addresses.length === 0,
    }
    const res = await api.updateUser(me.id, { addresses: [...me.addresses, nextAddr] })
    if (res.data) {
      useAuthStore.setState({ user: res.data })
      addressForm.reset({ label: 'Home', street: '', city: '', state: '', zip: '' })
      toast.success('Address saved')
    } else toast.error('Cannot add address')
  }

  async function removeAddress(id: string) {
    const filtered = me.addresses.filter((a) => a.id !== id)
    const res = await api.updateUser(me.id, {
      addresses: filtered.map((a, idx) => ({ ...a, isDefault: idx === 0 })),
    })
    if (res.data) {
      useAuthStore.setState({ user: res.data })
      toast.success('Address removed')
    }
  }

  async function appendPayment(vals: z.infer<typeof pmSchema>) {
    const next: PaymentMethodInfo = {
      id: generateId('pm'),
      type: vals.type,
      label: vals.label,
      last4: vals.last4 && vals.last4.length === 4 ? vals.last4 : '4242',
      expiry: vals.expiry ?? '••/••',
      isDefault: me.paymentMethods.length === 0,
    }
    const res = await api.updateUser(me.id, { paymentMethods: [...me.paymentMethods, next] })
    if (res.data) {
      useAuthStore.setState({ user: res.data })
      pmForm.reset()
      toast.success('Payment method vaulted')
    } else toast.error('Cannot add payment method')
  }

  async function dropPayment(id: string) {
    const res = await api.updateUser(me.id, {
      paymentMethods: me.paymentMethods
        .filter((pm) => pm.id !== id)
        .map((pm, i) => ({ ...pm, isDefault: i === 0 })),
    })
    if (res.data) {
      useAuthStore.setState({ user: res.data })
      toast.success('Payment method archived')
    }
  }

  async function patchNotificationPrefs(patch: Partial<typeof me.notificationPrefs>) {
    const res = await api.updateUser(me.id, {
      notificationPrefs: { ...me.notificationPrefs, ...patch },
    })
    if (res.data) {
      useAuthStore.setState({ user: res.data })
      toast.success('Alerts updated')
    }
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="Profile & preferences"
        description="Portable identity vault — synced with your ServiceHub concierge phone tree."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <AnimatedCard className="lg:col-span-1">
          <Card className="h-full bg-gradient-to-b from-primary/5 to-background">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCircle2 className="h-4 w-4" /> Public presence
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 text-center">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                <AvatarImage src={avatarPreview || me.avatar} alt="" />
                <AvatarFallback>{me.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  id="avatar"
                  className="hidden"
                  onChange={(e) => void onAvatar(e.target.files)}
                />
                <Button asChild variant="outline">
                  <label htmlFor="avatar" className="cursor-pointer">
                    Upload PNG/JPEG
                  </label>
                </Button>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Stored as base64 demo payload — avoids external buckets.
                </p>
              </div>
              <dl className="w-full rounded-2xl border bg-card px-4 py-3 text-left text-xs space-y-1">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Member since</dt>
                  <dd className="font-medium">{formatDate(me.createdAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tier</dt>
                  <dd className="font-medium capitalize">{me.loyaltyPoints > 900 ? 'Platinum glow' : 'Community'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard className="lg:col-span-2">
          <Tabs defaultValue="identity" className="w-full space-y-4">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="identity">Identity</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="wallet">Payments & alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="identity">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Legal name & phone</CardTitle>
                  <CardDescription>Wired directly into onboarding & SMS fallback.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={profileForm.handleSubmit((d) => void saveProfile(d))}>
                    <div className="space-y-2">
                      <Label htmlFor="nm">Full name</Label>
                      <Input id="nm" {...profileForm.register('name')} />
                      {profileForm.formState.errors.name && (
                        <p className="text-xs text-destructive">{profileForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Mobile</Label>
                      <Input id="phone" {...profileForm.register('phone')} placeholder="+65 ... " />
                      {profileForm.formState.errors.phone && (
                        <p className="text-xs text-destructive">{profileForm.formState.errors.phone.message}</p>
                      )}
                    </div>
                    <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                      Save profile
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="addresses">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPinPlus className="h-4 w-4" /> Service locations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ScrollArea className="h-[200px] pr-4">
                    <div className="space-y-2">
                      {me.addresses.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Add at least one address for booking.</p>
                      ) : (
                        me.addresses.map((addr) => (
                          <div
                            key={addr.id}
                            className={cn(
                              'flex flex-wrap gap-3 justify-between rounded-2xl border p-4',
                              addr.isDefault && 'border-primary bg-primary/5'
                            )}
                          >
                            <div>
                              <p className="text-sm font-semibold">
                                {addr.label} {addr.isDefault && '(default)'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {addr.street}, {addr.city}, {addr.state} {addr.zip}
                              </p>
                            </div>
                            <Button variant="destructive" size="icon" className="shrink-0" aria-label="Remove" type="button" onClick={() => void removeAddress(addr.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                  <form className="grid gap-4 sm:grid-cols-2" onSubmit={addressForm.handleSubmit((d) => void appendAddress(d))}>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="alabel">Label</Label>
                      <Input id="alabel" {...addressForm.register('label')} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="street">Street</Label>
                      <Input id="street" {...addressForm.register('street')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" {...addressForm.register('city')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" {...addressForm.register('state')} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="zip">Postal</Label>
                      <Input id="zip" {...addressForm.register('zip')} />
                    </div>
                    <Button className="sm:col-span-2" type="submit">
                      Add location
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wallet">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> Payment methods
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {me.paymentMethods.map((pm) => (
                      <div key={pm.id} className="flex justify-between rounded-2xl border p-4 text-sm">
                        <div>
                          <p className="font-semibold">{pm.label}</p>
                          <p className="text-xs text-muted-foreground uppercase">{pm.type}</p>
                          {pm.last4 && <p className="text-xs">{pm.last4} · expires {pm.expiry}</p>}
                          {pm.isDefault && (
                            <span className="mt-2 inline-flex rounded-full border px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                              Default route
                            </span>
                          )}
                        </div>
                        <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => void dropPayment(pm.id)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          Add vaulted card / wallet lane
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form onSubmit={pmForm.handleSubmit((d) => void appendPayment(d))}>
                          <DialogHeader>
                            <DialogTitle>New payment corridor</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-3 py-2">
                            <div className="space-y-2">
                              <Label>Type</Label>
                              <select
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                {...pmForm.register('type')}
                              >
                                <option value="card">Card</option>
                                <option value="paypal">PayPal</option>
                                <option value="wallet">Wallet</option>
                              </select>
                            </div>
                            <Input placeholder="Nickname" {...pmForm.register('label')} />
                            <Input placeholder="Last four" {...pmForm.register('last4')} maxLength={4} />
                            <Input placeholder="MM/YY" {...pmForm.register('expiry')} maxLength={5} />
                          </div>
                          <DialogFooter>
                            <Button type="submit">Save</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Concierge pings</CardTitle>
                    <CardDescription>Quiet hours aware · mock persistence via mockApi.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(
                      ['email', 'push', 'sms', 'promotions'] as const
                    ).map((key) => (
                      <label key={key} className="flex items-center justify-between gap-6 rounded-xl border px-4 py-3 capitalize">
                        <div>
                          <p className="text-sm font-medium">{key}</p>
                          <p className="text-xs text-muted-foreground">
                            {key === 'promotions' ? 'Partnership drops & cashback nudges' : key + ' confirmations'}
                          </p>
                        </div>
                        <Switch
                          checked={me.notificationPrefs[key]}
                          onCheckedChange={(v) =>
                            patchNotificationPrefs({ [key]: v } as Partial<typeof me.notificationPrefs>)
                          }
                        />
                      </label>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </AnimatedCard>
      </div>
    </AnimatedPage>
  )
}