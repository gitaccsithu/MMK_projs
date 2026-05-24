import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import * as api from '@/services/mockApi'
import type { Address, PaymentMethod, Service } from '@/types'
import { cn, formatCurrency, formatDateTime, generateId } from '@/utils/cn'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

const STEPS = ['Schedule', 'Package', 'Address', 'Payment', 'Confirm'] as const

const schema = z
  .object({
    scheduledAt: z.string().min(1, 'Pick date and time'),
    packageId: z.string().min(1, 'Pick a package'),
    addressMode: z.enum(['saved', 'new']),
    savedAddressId: z.string().optional(),
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    label: z.string(),
    notes: z.string(),
    paymentMethod: z.enum(['card', 'wallet', 'paypal', 'grabpay', 'apple_pay']),
  })
  .superRefine((data, ctx) => {
    if (data.addressMode === 'saved') {
      if (!data.savedAddressId) {
        ctx.addIssue({
          code: 'custom',
          path: ['savedAddressId'],
          message: 'Select a saved address',
        })
      }
    } else {
      if (!data.label.trim())
        ctx.addIssue({ code: 'custom', path: ['label'], message: 'Add a friendly label (e.g. Home)' })
      if (data.street.trim().length < 5)
        ctx.addIssue({ code: 'custom', path: ['street'], message: 'Street is too short' })
      if (!data.city.trim())
        ctx.addIssue({ code: 'custom', path: ['city'], message: 'City required' })
      if (!data.state.trim())
        ctx.addIssue({ code: 'custom', path: ['state'], message: 'State required' })
      if (!data.zip.trim())
        ctx.addIssue({ code: 'custom', path: ['zip'], message: 'Postal code required' })
    }
  })

type FormData = z.infer<typeof schema>

export function BookingWizardPage() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const [searchParams] = useSearchParams()
  const prefPkg = searchParams.get('pkg')
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [service, setService] = useState<Service | null>(null)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      addressMode: 'saved',
      savedAddressId: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      label: 'Service location',
      notes: '',
      packageId: '',
      paymentMethod: 'card',
      scheduledAt: '',
    },
    mode: 'onChange',
  })

  const watchedMode = watch('addressMode')
  const pkgIdWatch = watch('packageId')

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!serviceId || !user) return
      setLoading(true)
      try {
        const s = await api.getServiceById(serviceId)
        if (!s || cancelled) {
          setService(s ?? null)
          return
        }
        setService(s)
        const defaultPkg =
          prefPkg && s.packages.some((p) => p.id === prefPkg)
            ? prefPkg
            : s.packages[0]?.id ?? ''
        const primary = user.addresses.find((a) => a.isDefault) ?? user.addresses[0]
        reset({
          scheduledAt: toLocalDatetimeInput(new Date(Date.now() + 86400000)),
          packageId: defaultPkg,
          addressMode: primary ? 'saved' : 'new',
          savedAddressId: primary?.id ?? '',
          street: primary?.street ?? '',
          city: primary?.city ?? '',
          state: primary?.state ?? '',
          zip: primary?.zip ?? '',
          label: primary?.label ?? 'Service location',
          notes: '',
          paymentMethod: user.paymentMethods.find((pm) => pm.isDefault)?.type ?? 'card',
        })
      } catch {
        toast.error('Could not load service.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [serviceId, user, prefPkg, reset])

  const pkg = service?.packages.find((p) => p.id === pkgIdWatch)

  const addrFieldsSaved = watchedMode === 'saved'

  async function goNext() {
    if (step === 0 && !(await trigger(['scheduledAt']))) return
    if (step === 1 && !(await trigger(['packageId']))) return
    if (step === 2) {
      if (!(await trigger(['addressMode', 'savedAddressId', 'street', 'city', 'state', 'zip', 'label']))) return
      if (!user?.addresses.length && addrFieldsSaved) {
        toast.error('Add an address below or switch to manual entry.')
        return
      }
    }
    if (step === 3 && !(await trigger(['paymentMethod']))) return
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  function resolveAddress(values: FormData): Address {
    if (values.addressMode === 'saved') {
      const found = user!.addresses.find((a) => a.id === values.savedAddressId)!
      return { ...found }
    }
    return {
      id: generateId('addr'),
      label: values.label,
      street: values.street,
      city: values.city,
      state: values.state,
      zip: values.zip,
      lat: user!.addresses[0]?.lat ?? 1.3521,
      lng: user!.addresses[0]?.lng ?? 103.8198,
      isDefault: false,
    }
  }

  const onFinalize = async (values: FormData) => {
    if (!service || !user?.id || !pkg) return
    setSubmitting(true)
    try {
      const iso = parseLocalDatetimeToIso(values.scheduledAt)
      if (new Date(iso).getTime() < Date.now() - 60000) {
        toast.error('Please choose a time in the future.')
        setSubmitting(false)
        return
      }

      const address = resolveAddress(values)
      const res = await api.createBooking({
        customerId: user.id,
        vendorId: service.vendorId,
        serviceId: service.id,
        packageId: pkg.id,
        status: 'pending',
        scheduledAt: iso,
        address,
        notes: values.notes || undefined,
        amount: pkg.price,
        paymentMethod: values.paymentMethod as PaymentMethod,
        paymentStatus: 'completed',
        eta: undefined,
        vendorLocation: undefined,
      })
      if (res.error || !res.data) {
        toast.error(res.error ?? 'Booking failed.')
        return
      }
      toast.success('Booking confirmed!')
      navigate(`/customer/bookings/${res.data.id}`)
    } finally {
      setSubmitting(false)
    }
  }

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step])

  if (!serviceId) {
    return <EmptyState title="Missing route" />
  }

  if (!user) {
    return (
      <EmptyState
        title="Sign in required"
        description="Log in to complete a booking."
        action={{
          label: 'Go to login',
          onClick: () => navigate('/login'),
        }}
      />
    )
  }

  return (
    <AnimatedPage>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2 gap-2">
          <Link to={`/customer/marketplace/${serviceId}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to service
          </Link>
        </Button>
      </div>

      <PageHeader
        title={service?.title ?? 'Book a service'}
        description="Transparent pricing • flexible packages • realtime tracking after checkout."
      />

      {!loading && !service ? (
        <EmptyState title="Service not found" description="Return to marketplace and choose another vendor." />
      ) : loading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <form onSubmit={handleSubmit(onFinalize)}>
          <AnimatedCard className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {STEPS.map((label, idx) => (
                  <div
                    key={label}
                    className={cn(
                      'flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition',
                      idx === step
                        ? 'border-primary bg-primary/10 text-primary'
                        : idx < step
                        ? 'border-green-600/45 bg-green-500/10 text-green-700 dark:text-green-400'
                        : 'border-border text-muted-foreground'
                    )}
                  >
                    {idx < step ? <Check className="h-3 w-3" /> : <span>{idx + 1}</span>}
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Step <span className="font-semibold text-foreground">{step + 1}</span>/{STEPS.length}
              </p>
            </div>
            <Progress value={progress} className="mt-2 h-2" />
          </AnimatedCard>

          {step === 0 && (
            <AnimatedCard>
              <Card>
                <CardHeader>
                  <CardTitle>Select date & time</CardTitle>
                  <CardDescription>We remind you 60 minutes ahead of arrival.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="when">Appointment</Label>
                    <Input id="when" type="datetime-local" {...register('scheduledAt')} />
                    {errors.scheduledAt && <p className="text-xs text-destructive">{errors.scheduledAt.message}</p>}
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          )}

          {step === 1 && service && (
            <AnimatedCard>
              <Card>
                <CardHeader>
                  <CardTitle>Select package</CardTitle>
                  <CardDescription>Prices include ServiceHub concierge support.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {service.packages.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setValue('packageId', p.id, { shouldValidate: true })}
                      className={cn(
                        'rounded-2xl border p-5 text-left transition hover:border-primary/40',
                        pkgIdWatch === p.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'bg-card'
                      )}
                    >
                      <p className="text-lg font-semibold">{p.name}</p>
                      <p className="text-sm text-muted-foreground">{p.description}</p>
                      <p className="mt-3 text-xl font-bold text-primary">{formatCurrency(p.price)}</p>
                      <ul className="mt-3 list-disc pl-5 text-xs text-muted-foreground">
                        {p.features.slice(0, 3).map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </CardContent>
                {errors.packageId && <p className="px-6 pb-4 text-xs text-destructive">{errors.packageId.message}</p>}
              </Card>
            </AnimatedCard>
          )}

          {step === 2 && (
            <AnimatedCard>
              <Card>
                <CardHeader>
                  <CardTitle>Service address</CardTitle>
                  <CardDescription>Select a saved spot or paste a manual location.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2 rounded-lg bg-muted p-1">
                    <Button
                      type="button"
                      variant={addrFieldsSaved ? 'default' : 'ghost'}
                      size="sm"
                      className="flex-1"
                      onClick={() => setValue('addressMode', 'saved')}
                      disabled={!user.addresses.length}
                    >
                      Saved addresses {user.addresses.length ? '' : '(none yet)'}
                    </Button>
                    <Button
                      type="button"
                      variant={!addrFieldsSaved ? 'default' : 'ghost'}
                      size="sm"
                      className="flex-1"
                      onClick={() => setValue('addressMode', 'new')}
                    >
                      New address
                    </Button>
                  </div>

                  {addrFieldsSaved && user.addresses.length > 0 ? (
                    <div className="space-y-2">
                      <Label>Choose saved</Label>
                      <Select value={watch('savedAddressId')} onValueChange={(v) => setValue('savedAddressId', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Address" />
                        </SelectTrigger>
                        <SelectContent>
                          {user.addresses.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.label} · {a.street}, {a.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="label">Label</Label>
                          <Input id="label" {...register('label')} />
                          {errors.label && <p className="text-xs text-destructive">{errors.label.message}</p>}
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="street">Street</Label>
                          <Input id="street" {...register('street')} />
                          {errors.street && <p className="text-xs text-destructive">{errors.street.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input id="city" {...register('city')} />
                          {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input id="state" {...register('state')} />
                          {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="zip">ZIP</Label>
                          <Input id="zip" {...register('zip')} />
                          {errors.zip && <p className="text-xs text-destructive">{errors.zip.message}</p>}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes for technician</Label>
                    <textarea
                      id="notes"
                      rows={4}
                      className="w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      {...register('notes')}
                      placeholder="Gate code, parking, pets on site..."
                    />
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          )}

          {step === 3 && (
            <AnimatedCard>
              <Card>
                <CardHeader>
                  <CardTitle>Payment preference</CardTitle>
                  <CardDescription>For this demo checkout instantly succeeds.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioRow
                    value={watch('paymentMethod')}
                    options={[
                      { value: 'card', title: 'Card on file', sub: user.paymentMethods[0]?.label ?? 'Visa ••4242 demo' },
                      { value: 'wallet', title: 'ServiceHub Wallet', sub: 'Balance applied automatically' },
                      { value: 'paypal', title: 'PayPal', sub: 'One-tap payout to vendor escrow' },
                    ]}
                    onPick={(method) => setValue('paymentMethod', method)}
                  />
                </CardContent>
              </Card>
            </AnimatedCard>
          )}

          {step === 4 && pkg && (
            <AnimatedCard>
              <Card>
                <CardHeader>
                  <CardTitle>Review & confirm</CardTitle>
                  <CardDescription>Double-check the essentials before we dispatch the vendor.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm md:grid-cols-2">
                  <ConfirmRow label="Service" value={service!.title} />
                  <ConfirmRow label="Package" value={pkg.name} />
                  <ConfirmRow label="Investment" value={formatCurrency(pkg.price)} />
                  <ConfirmRow label="Appointment" value={formatDateTime(parseLocalDatetimeToIso(watch('scheduledAt')))} />
                  <ConfirmRow label="Notes" value={watch('notes') || 'None provided'} span />
                  <ConfirmRow label="Payment" value={prettyPay(watch('paymentMethod'))} />
                </CardContent>
              </Card>
            </AnimatedCard>
          )}

          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Back
            </Button>
            <div className="flex gap-3">
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={() => void goNext()}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm booking
                </Button>
              )}
            </div>
          </div>
        </form>
      )}
    </AnimatedPage>
  )
}

function RadioRow(props: {
  value: PaymentMethod
  options: { value: PaymentMethod; title: string; sub?: string }[]
  onPick: (v: PaymentMethod) => void
}) {
  return (
    <div className="space-y-2">
      {props.options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => props.onPick(o.value)}
          className={cn(
            'flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition hover:border-primary/40',
            props.value === o.value ? 'border-primary bg-primary/5' : 'border-border bg-card'
          )}
        >
          <div>
            <p className="font-semibold">{o.title}</p>
            {o.sub && <p className="text-xs text-muted-foreground">{o.sub}</p>}
          </div>
          <div
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full border border-primary',
              props.value === o.value && 'bg-primary'
            )}
          >
            <span className={cn('h-2 w-2 rounded-full', props.value === o.value ? 'bg-primary-foreground' : 'transparent')} />
          </div>
        </button>
      ))}
    </div>
  )
}

function ConfirmRow({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={cn('rounded-xl border bg-muted/30 p-4', span && 'md:col-span-2')}>
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}

function parseLocalDatetimeToIso(local: string) {
  if (!local) return new Date().toISOString()
  const d = new Date(local)
  return d.toISOString()
}

function toLocalDatetimeInput(d: Date) {
  const tzOff = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tzOff).toISOString().slice(0, 16)
}

function prettyPay(pm: PaymentMethod) {
  const map: Record<PaymentMethod, string> = {
    card: 'Saved card ending in 4242',
    wallet: 'ServiceHub Wallet balance',
    paypal: 'PayPal',
    grabpay: 'GrabPay',
    apple_pay: 'Apple Pay',
  }
  return map[pm]
}
