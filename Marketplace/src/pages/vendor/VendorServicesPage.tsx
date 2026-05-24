import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Service } from '@/types'
import * as api from '@/services/mockApi'
import { generateId } from '@/utils/cn'
import { useAuthStore } from '@/store/authStore'
import { useVendorForAuthUser } from '@/pages/vendor/useVendorWorkspace'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'

type FormState = {
  title: string
  description: string
  categoryId: string
  packageName: string
  packageDescription: string
  price: string
  duration: string
  tags: string
  isActive: boolean
}

const emptyForm: FormState = {
  title: '',
  description: '',
  categoryId: '',
  packageName: 'Standard',
  packageDescription: '',
  price: '99',
  duration: '60',
  tags: '',
  isActive: true,
}

export function VendorServicesPage() {
  const userId = useAuthStore((s) => s.session?.userId)
  const { vendor, loading: vLoading } = useVendorForAuthUser(userId)
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof api.getCategories>>>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    void (async () => {
      await Promise.resolve()
      if (!active) return
      if (!vendor) {
        setServices([])
        return
      }
      const [svcList, cats] = await Promise.all([api.getServicesForVendor(vendor.id), api.getCategories()])
      if (!active) return
      setServices(svcList)
      setCategories(cats)
    })()
    return () => {
      active = false
    }
  }, [vendor])

  const defaultCategory = useMemo(() => categories[0]?.id ?? '', [categories])

  const refreshLists = async () => {
    if (!vendor) return
    const [svcList, cats] = await Promise.all([api.getServicesForVendor(vendor.id), api.getCategories()])
    setServices(svcList)
    setCategories(cats)
  }

  const openCreate = () => {
    setEditing(null)
    setForm({
      ...emptyForm,
      categoryId: defaultCategory,
    })
    setOpen(true)
  }

  const openEdit = (s: Service) => {
    const pkg0 = s.packages[0]
    setEditing(s)
    setForm({
      title: s.title,
      description: s.description,
      categoryId: s.categoryId,
      packageName: pkg0?.name ?? 'Standard',
      packageDescription: pkg0?.description ?? '',
      price: String(pkg0?.price ?? 0),
      duration: String(pkg0?.duration ?? 60),
      tags: s.tags.join(', '),
      isActive: s.isActive,
    })
    setOpen(true)
  }

  const onSave = async () => {
    if (!vendor) return
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    const pkgId = editing?.packages[0]?.id ?? generateId('pkg')
    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const base = {
      vendorId: vendor.id,
      categoryId: form.categoryId || defaultCategory,
      title: form.title.trim(),
      description: form.description.trim(),
      images: editing?.images?.length ? editing.images : vendor.gallery.slice(0, 3),
      packages: [
        {
          id: pkgId,
          name: form.packageName.trim() || 'Standard',
          description: form.packageDescription.trim(),
          price: Math.max(0, Number(form.price) || 0),
          duration: Math.max(1, Number(form.duration) || 60),
          features: editing?.packages[0]?.features ?? [],
        },
      ],
      rating: editing?.rating ?? 4.5,
      reviewCount: editing?.reviewCount ?? 0,
      tags,
      isActive: form.isActive,
      availability: editing?.availability?.length ? editing.availability : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      location: vendor.location,
      popularity: editing?.popularity ?? 40,
    }

    const res = editing ? await api.updateService(editing.id, base) : await api.createService(base)

    setSaving(false)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success(editing ? 'Service updated' : 'Service created')
    setOpen(false)
    await refreshLists()
  }

  const onDelete = async (s: Service) => {
    const res = await api.deleteService(s.id)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success('Service removed')
    await refreshLists()
  }

  if (vLoading) return <Skeleton className="h-96 w-full" />

  if (!vendor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Missing vendor workspace</CardTitle>
          <CardDescription>Use a vendor account to manage listings.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Services" description="Publish and tune what customers can book.">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New service
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((s) => {
          const price = s.packages[0]?.price ?? 0
          return (
            <Card key={s.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">{s.title}</CardTitle>
                  <Badge variant={s.isActive ? 'default' : 'secondary'}>{s.isActive ? 'Live' : 'Hidden'}</Badge>
                </div>
                <CardDescription className="line-clamp-3">{s.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-2 text-sm">
                <p className="text-muted-foreground">
                  From <span className="font-semibold text-foreground">${price}</span> ·{' '}
                  {s.packages[0]?.duration ?? '?'} min
                </p>
                <div className="flex flex-wrap gap-1">
                  {s.tags.slice(0, 5).map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(s)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => void onDelete(s)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
          )
        })}
        {!services.length && (
          <p className="text-sm text-muted-foreground md:col-span-full">Create your first service package.</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:rounded-xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit service' : 'Create service'}</DialogTitle>
            <DialogDescription>Structured like marketplace listings — stored via mockApi.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <textarea
                className="flex min-h-[90px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={form.categoryId || defaultCategory}
                onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pick category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
              <div className="grid gap-2">
                <Label>Package name</Label>
                <Input
                  value={form.packageName}
                  onChange={(e) => setForm((f) => ({ ...f, packageName: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Package blurb</Label>
                <Input
                  value={form.packageDescription}
                  onChange={(e) => setForm((f) => ({ ...f, packageDescription: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
              <div className="grid gap-2">
                <Label>Price (USD)</Label>
                <Input
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Duration (min)</Label>
                <Input
                  inputMode="numeric"
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Tags (comma separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Listed & bookable</Label>
                <p className="text-xs text-muted-foreground">Turn off to hide without deleting.</p>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void onSave()} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
