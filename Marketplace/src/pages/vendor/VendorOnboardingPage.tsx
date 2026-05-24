import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import * as api from '@/services/mockApi'
import { useAuthStore } from '@/store/authStore'
import { useVendorForAuthUser } from '@/pages/vendor/useVendorWorkspace'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { VendorDocument } from '@/types'
import { generateId } from '@/utils/cn'
import { Skeleton } from '@/components/ui/skeleton'

const stepSchemas = {
  1: z.object({
    businessName: z.string().min(2, 'Required'),
    businessType: z.string().min(2, 'Describe your entity type'),
  }),
  2: z.object({
    registrationNumber: z.string().min(3, 'Business registration ID'),
  }),
  3: z.object({
    categories: z.array(z.string()).min(1, 'Pick at least one category'),
  }),
  4: z.object({
    documentName: z.string().min(2, 'Document label'),
  }),
  5: z.object({
    bankName: z.string().min(2, 'Bank name'),
    bankAccount: z.string().min(4, 'Masked account OK'),
  }),
  6: z.object({
    address: z.string().min(4, 'Full street address'),
    lat: z.string().refine((s) => !Number.isNaN(Number(s)), 'Latitude required'),
    lng: z.string().refine((s) => !Number.isNaN(Number(s)), 'Longitude required'),
  }),
  7: z.object({
    serviceAreas: z.string().min(3, 'List coverage areas'),
  }),
  8: z.object({
    acknowledge: z.boolean().refine((v) => v === true, 'Acknowledge to finish'),
  }),
} as const

export type VendorOnboardingFormValues = z.infer<(typeof stepSchemas)[1]> &
  z.infer<(typeof stepSchemas)[2]> &
  z.infer<(typeof stepSchemas)[3]> &
  z.infer<(typeof stepSchemas)[4]> &
  z.infer<(typeof stepSchemas)[5]> &
  z.infer<(typeof stepSchemas)[6]> &
  z.infer<(typeof stepSchemas)[7]> &
  z.infer<(typeof stepSchemas)[8]>

export function VendorOnboardingPage() {
  const userId = useAuthStore((s) => s.session?.userId)
  const { vendor, loading, reload } = useVendorForAuthUser(userId)
  const [step, setStep] = useState(1)

  const form = useForm<VendorOnboardingFormValues>({
    defaultValues: {
      businessName: '',
      businessType: '',
      registrationNumber: '',
      categories: [],
      documentName: '',
      bankName: '',
      bankAccount: '',
      address: '',
      lat: '1.3521',
      lng: '103.8198',
      serviceAreas: '',
      acknowledge: false,
    },
  })

  const watchedCategories = useWatch({ control: form.control, name: 'categories', defaultValue: [] })
  const businessNameW = useWatch({ control: form.control, name: 'businessName' })
  const bankNameW = useWatch({ control: form.control, name: 'bankName' })
  const acknowledgeW = useWatch({ control: form.control, name: 'acknowledge' })

  useEffect(() => {
    if (!vendor) return
    let active = true
    void (async () => {
      await Promise.resolve()
      if (!active) return
      const o = vendor.onboarding
      form.reset({
        businessName: o.businessName || vendor.businessName,
        businessType: o.businessType,
        registrationNumber: o.registrationNumber,
        categories: o.categories?.length ? o.categories : vendor.categories ?? [],
        documentName: o.documents?.[0]?.name ?? '',
        bankName: o.bankName,
        bankAccount: o.bankAccount,
        address: o.location.address,
        lat: String(o.location.lat),
        lng: String(o.location.lng),
        serviceAreas: o.serviceAreas.join(', '),
        acknowledge: Boolean(o.submittedAt),
      })
      setStep(Math.min(Math.max(o.step || 1, 1), 8))
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-seed when vendor snapshot changes
  }, [vendor])

  const [catList, setCatList] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    void (async () => {
      const cats = await api.getCategories()
      setCatList(cats.map((c) => ({ id: c.id, name: c.name })))
    })()
  }, [])

  const pct = Math.round((step / 8) * 100)

  const onboardingPayload = (
    overrides: Partial<{
      step: number
      documents: VendorDocument[]
      submittedAt: string
    }> = {},
    v = form.getValues()
  ) => {
    const serviceAreasList = v.serviceAreas.split(',').map((s) => s.trim()).filter(Boolean)

    let documents: VendorDocument[] = overrides.documents ?? []

    if (documents.length === 0 && vendor) {
      documents = [...vendor.onboarding.documents]
    }

    if (documents.length === 0 && v.documentName.trim()) {
      documents = [
        {
          id: generateId('doc'),
          name: v.documentName,
          type: 'license',
          url: '#demo-upload',
          uploadedAt: new Date().toISOString(),
        },
      ]
    }

    return {
      ...vendor!.onboarding,
      step: overrides.step ?? step,
      businessName: v.businessName,
      businessType: v.businessType,
      registrationNumber: v.registrationNumber,
      categories: v.categories,
      documents,
      bankName: v.bankName,
      bankAccount: v.bankAccount,
      location: {
        lat: Number(v.lat),
        lng: Number(v.lng),
        address: v.address,
      },
      serviceAreas: serviceAreasList,
      submittedAt: overrides.submittedAt ?? vendor!.onboarding.submittedAt,
    }
  }

  const applyZodErrors = (error: z.ZodError) => {
    for (const issue of error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string') {
        form.setError(key as keyof VendorOnboardingFormValues, { message: issue.message })
      }
    }
  }

  const onNext = async () => {
    if (!vendor) return
    const values = form.getValues()
    const parsed = stepSchemas[step as keyof typeof stepSchemas].safeParse(values)
    form.clearErrors()

    if (!parsed.success) {
      applyZodErrors(parsed.error)
      return
    }

    try {
      const docsOverride =
        step === 4 && values.documentName.trim()
          ? [
              {
                id: generateId('doc'),
                name: values.documentName,
                type: 'license',
                url: '#demo-upload',
                uploadedAt: new Date().toISOString(),
              },
            ]
          : undefined

      await api.updateVendor(vendor.id, {
        onboarding: onboardingPayload(
          docsOverride !== undefined ? { step: step + 1, documents: docsOverride } : { step: step + 1 }
        ),
        businessName: values.businessName,
        location: onboardingPayload(undefined, values).location,
      })

      toast.success(`Step ${step} saved`)
      await reload()
      setStep((s) => Math.min(s + 1, 8))
    } catch {
      toast.error('Could not persist onboarding draft')
    }
  }

  const onBack = () => {
    form.clearErrors()
    setStep((s) => Math.max(1, s - 1))
  }

  const finalize = async () => {
    if (!vendor) return
    const values = form.getValues()
    const parsed = stepSchemas[8].safeParse(values)
    form.clearErrors()
    if (!parsed.success) {
      applyZodErrors(parsed.error)
      return
    }

    await api.updateVendor(vendor.id, {
      onboarding: onboardingPayload({
        step: 8,
        submittedAt: new Date().toISOString(),
      }),
      businessName: values.businessName,
      location: onboardingPayload(undefined, values).location,
    })

    toast.success('Onboarding submitted — mock reviewers notified')
    await reload()
    setStep(8)
  }

  const stepTitle = useMemo(
    () =>
      ({
        1: 'Business identity',
        2: 'Registration',
        3: 'Categories',
        4: 'Compliance documents',
        5: 'Payout profile',
        6: 'HQ location',
        7: 'Service coverage',
        8: 'Review & certify',
      }) as Record<number, string>,
    []
  )

  if (loading) return <Skeleton className="h-[520px] w-full max-w-3xl mx-auto" />

  if (!vendor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendor onboarding</CardTitle>
          <CardDescription>You need an attached vendor workspace.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title="Vendor onboarding"
        description="Eight guided steps — validated with Zod per step via safeParse."
      />

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {step} / 8</span>
          <span>{pct}%</span>
        </div>
        <Progress value={pct} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{stepTitle[step] ?? ''}</CardTitle>
          <CardDescription>Drafts sync to Mock API alongside your storefront.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {step === 1 && (
            <>
              <Field label="Legal business name">
                <Input {...form.register('businessName')} />
                {form.formState.errors.businessName && (
                  <p className="text-xs text-destructive">{form.formState.errors.businessName.message}</p>
                )}
              </Field>
              <Field label="Business structure">
                <Input placeholder="LLC · Sole prop · Partnership" {...form.register('businessType')} />
                {form.formState.errors.businessType && (
                  <p className="text-xs text-destructive">{form.formState.errors.businessType.message}</p>
                )}
              </Field>
            </>
          )}
          {step === 2 && (
            <Field label="Government registration ID">
              <Input {...form.register('registrationNumber')} />
              {form.formState.errors.registrationNumber && (
                <p className="text-xs text-destructive">{form.formState.errors.registrationNumber.message}</p>
              )}
            </Field>
          )}
          {step === 3 && (
            <div className="space-y-2">
              <Label>Offering categories</Label>
              <div className="flex flex-wrap gap-2">
                {catList.map((c) => {
                  const picked = watchedCategories.includes(c.id)
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => {
                        const curr = form.getValues('categories')
                        const next = picked ? curr.filter((id) => id !== c.id) : [...curr, c.id]
                        form.setValue('categories', next, { shouldDirty: true })
                      }}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        picked ? 'border-primary bg-primary/10 text-primary' : ''
                      }`}
                    >
                      {c.name}
                    </button>
                  )
                })}
              </div>
              {form.formState.errors.categories && (
                <p className="text-xs text-destructive">{form.formState.errors.categories.message as string}</p>
              )}
            </div>
          )}
          {step === 4 && (
            <Field label="Primary license / permit label">
              <Input placeholder="e.g. Bizfile · NEA hygiene" {...form.register('documentName')} />
              {form.formState.errors.documentName && (
                <p className="text-xs text-destructive">{form.formState.errors.documentName.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Secure upload UX ships later — payload stores a deterministic mock record.
              </p>
            </Field>
          )}
          {step === 5 && (
            <>
              <Field label="Bank">
                <Input {...form.register('bankName')} />
                {form.formState.errors.bankName && (
                  <p className="text-xs text-destructive">{form.formState.errors.bankName.message}</p>
                )}
              </Field>
              <Field label="Account / masked number">
                <Input {...form.register('bankAccount')} />
                {form.formState.errors.bankAccount && (
                  <p className="text-xs text-destructive">{form.formState.errors.bankAccount.message}</p>
                )}
              </Field>
            </>
          )}
          {step === 6 && (
            <>
              <Field label="Address">
                <Input {...form.register('address')} />
                {form.formState.errors.address && (
                  <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>
                )}
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude">
                  <Input {...form.register('lat')} />
                  {form.formState.errors.lat && (
                    <p className="text-xs text-destructive">{form.formState.errors.lat.message}</p>
                  )}
                </Field>
                <Field label="Longitude">
                  <Input {...form.register('lng')} />
                  {form.formState.errors.lng && (
                    <p className="text-xs text-destructive">{form.formState.errors.lng.message}</p>
                  )}
                </Field>
              </div>
            </>
          )}
          {step === 7 && (
            <Field label="Service districts (comma separated)">
              <textarea
                className="flex min-h-[90px] w-full rounded-lg border px-3 py-2 text-sm"
                {...form.register('serviceAreas')}
              />
              {form.formState.errors.serviceAreas && (
                <p className="text-xs text-destructive">{form.formState.errors.serviceAreas.message}</p>
              )}
            </Field>
          )}
          {step === 8 && (
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                Confirm details for{' '}
                <Badge variant="outline">{businessNameW}</Badge>. Payout rails map to{' '}
                <span className="font-medium text-foreground">{bankNameW}</span>.
              </p>
              <label className="flex items-start gap-2 rounded-lg border p-4">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-primary"
                  checked={Boolean(acknowledgeW)}
                  onChange={(e) =>
                    form.setValue('acknowledge', e.target.checked, {
                      shouldDirty: true,
                    })
                  }
                />
                <span>I certify this submission for ServiceHub compliance review.</span>
              </label>
              {form.formState.errors.acknowledge && (
                <p className="text-xs text-destructive">{form.formState.errors.acknowledge.message}</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onBack} disabled={step === 1}>
              Back
            </Button>
            {step < 8 ? (
              <Button type="button" onClick={() => void onNext()}>
                Save & continue
              </Button>
            ) : (
              <Button type="button" onClick={() => void finalize()}>
                Submit onboarding
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
