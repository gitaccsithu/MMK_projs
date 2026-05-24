import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import * as api from '@/services/mockApi'
import { useAuthStore } from '@/store/authStore'
import { useVendorForAuthUser } from '@/pages/vendor/useVendorWorkspace'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

type SettingsFormValues = {
  businessName: string
  slug: string
  description: string
  coverage: string
  address: string
  lat: string
  lng: string
  bannerUrl: string
  isActive: boolean
}

export function VendorSettingsPage() {
  const userId = useAuthStore((s) => s.session?.userId)
  const { vendor, loading, reload } = useVendorForAuthUser(userId)
  const form = useForm<SettingsFormValues>({
    defaultValues: {
      businessName: '',
      slug: '',
      description: '',
      coverage: '',
      address: '',
      lat: '',
      lng: '',
      bannerUrl: '',
      isActive: true,
    },
  })

  const isActiveLive = useWatch({ control: form.control, name: 'isActive' })

  useEffect(() => {
    if (!vendor) return
    let active = true
    void (async () => {
      await Promise.resolve()
      if (!active) return
      form.reset({
        businessName: vendor.businessName,
        slug: vendor.slug,
        description: vendor.description,
        coverage: vendor.coverageAreas.join(', '),
        address: vendor.location.address,
        lat: String(vendor.location.lat),
        lng: String(vendor.location.lng),
        bannerUrl: vendor.banner ?? '',
        isActive: vendor.isActive,
      })
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate when workspace row changes
  }, [vendor])

  const submit = async (values: SettingsFormValues) => {
    if (!vendor) return
    const cov = values.coverage
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)

    const res = await api.updateVendor(vendor.id, {
      businessName: values.businessName.trim(),
      slug: values.slug.trim().toLowerCase().replace(/\s+/g, '-') || vendor.slug,
      description: values.description.trim(),
      coverageAreas: cov,
      banner: values.bannerUrl.trim() || undefined,
      isActive: values.isActive,
      location: {
        ...vendor.location,
        address: values.address.trim(),
        lat: Number(values.lat),
        lng: Number(values.lng),
      },
    })

    if (res.error) {
      toast.error(res.error)
      return
    }

    toast.success('Business profile updated')
    await reload()
  }

  if (loading) return <Skeleton className="h-[520px] w-full max-w-3xl" />

  if (!vendor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Unavailable without a mapped vendor workspace.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader title="Business settings" description="Control copy, geography, storefront availability." />

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Storefront fundamentals</CardTitle>
            <CardDescription>Landing page content and visibility.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{vendor.verificationStatus}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={form.handleSubmit((v) => void submit(v))}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Business name</Label>
                <Input {...form.register('businessName')} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input {...form.register('slug')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                className="flex min-h-[120px] w-full rounded-lg border border-input px-3 py-2 text-sm"
                {...form.register('description')}
              />
            </div>
            <div className="space-y-2">
              <Label>Banner URL</Label>
              <Input placeholder="https://…" {...form.register('bannerUrl')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Coverage neighborhoods (comma separated)</Label>
                <Input {...form.register('coverage')} placeholder="Marina Bay, Orchard, Jurong …" />
              </div>
              <div className="space-y-2">
                <Label>HQ Address</Label>
                <Input {...form.register('address')} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Lat</Label>
                  <Input {...form.register('lat')} />
                </div>
                <div className="space-y-2">
                  <Label>Lng</Label>
                  <Input {...form.register('lng')} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <Label>List business publicly</Label>
                <p className="text-xs text-muted-foreground">Guests only see vendors marked active.</p>
              </div>
              <Switch checked={Boolean(isActiveLive)} onCheckedChange={(v) => form.setValue('isActive', v)} />
            </div>
            <Button type="submit" className="w-fit">
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
