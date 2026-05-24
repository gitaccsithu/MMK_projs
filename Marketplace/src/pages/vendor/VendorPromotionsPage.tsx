import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Promotion } from '@/types'
import * as api from '@/services/mockApi'
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

export function VendorPromotionsPage() {
  const userId = useAuthStore((s) => s.session?.userId)
  const { vendor, loading: vLoading } = useVendorForAuthUser(userId)
  const [promos, setPromos] = useState<Promotion[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Promotion | null>(null)
  const [form, setForm] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'percentage' as Promotion['discountType'],
    discountValue: '10',
    minAmount: '50',
    maxUses: '100',
    expiresAt: '',
    isActive: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    void (async () => {
      await Promise.resolve()
      if (!active) return
      if (!vendor) {
        setPromos([])
        return
      }
      const list = await api.getPromotionsForVendor(vendor.id)
      if (active) setPromos(list)
    })()
    return () => {
      active = false
    }
  }, [vendor])

  const refreshPromos = async () => {
    if (!vendor) return
    setPromos(await api.getPromotionsForVendor(vendor.id))
  }
  const openCreate = () => {
    setEditing(null)
    setForm({
      code: '',
      title: 'Weekend special',
      description: 'Limited time offer for repeat customers.',
      discountType: 'percentage',
      discountValue: '15',
      minAmount: '40',
      maxUses: '200',
      expiresAt: format(new Date(Date.now() + 86400000 * 45), "yyyy-MM-dd'T'HH:mm"),
      isActive: true,
    })
    setOpen(true)
  }

  const openEdit = (p: Promotion) => {
    setEditing(p)
    setForm({
      code: p.code,
      title: p.title,
      description: p.description,
      discountType: p.discountType,
      discountValue: String(p.discountValue),
      minAmount: String(p.minAmount),
      maxUses: String(p.maxUses),
      expiresAt: format(new Date(p.expiresAt), "yyyy-MM-dd'T'HH:mm"),
      isActive: p.isActive,
    })
    setOpen(true)
  }

  const onSave = async () => {
    if (!vendor) return
    const payload: Omit<Promotion, 'id'> = {
      code: form.code.toUpperCase(),
      title: form.title.trim(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: Math.max(0, Number(form.discountValue) || 0),
      minAmount: Math.max(0, Number(form.minAmount) || 0),
      maxUses: Math.max(1, Math.floor(Number(form.maxUses) || 1)),
      usedCount: editing?.usedCount ?? 0,
      vendorId: vendor.id,
      expiresAt: new Date(form.expiresAt).toISOString(),
      isActive: form.isActive,
    }

    if (!payload.code.match(/^[A-Z0-9_-]{3,32}$/i)) {
      toast.error('Use a code 3–32 chars (letters, numbers, _ -).')
      return
    }

    setSaving(true)
    const res = editing
      ? await api.updatePromotion(editing.id, payload)
      : await api.createPromotion(payload)
    setSaving(false)

    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success(editing ? 'Coupon saved' : 'Coupon created')
    setOpen(false)
    await refreshPromos()
  }

  const onDelete = async (p: Promotion) => {
    const res = await api.deletePromotion(p.id)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success('Removed')
    await refreshPromos()
  }

  if (vLoading) return <Skeleton className="h-96 w-full" />

  if (!vendor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Coupons</CardTitle>
          <CardDescription>Sign in as a vendor to design offers.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Promotions" description="Coupon codes and discount rules (demo CRUD).">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New coupon
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        {promos.map((p) => (
          <Card key={p.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-mono">{p.code}</CardTitle>
                <CardDescription>{p.title}</CardDescription>
              </div>
              <Badge variant={p.isActive ? 'default' : 'secondary'}>{p.isActive ? 'Active' : 'Paused'}</Badge>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground line-clamp-2">{p.description}</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">
                  {p.discountType === 'percentage' ? `${p.discountValue}%` : `$${p.discountValue} off`}
                </Badge>
                <span>Min ${p.minAmount}</span>
                <span>
                  Uses {p.usedCount}/{p.maxUses}
                </span>
                <span>Expires {format(new Date(p.expiresAt), 'PP')}</span>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(p)}>
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => void onDelete(p)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </Card>
        ))}
        {!promos.length && (
          <Card className="border-dashed lg:col-span-2">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground text-sm">
              <p>No coupons yet for {vendor.businessName}.</p>
              <Button size="sm" onClick={openCreate}>
                Build your first promo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md sm:rounded-xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit coupon' : 'New coupon'}</DialogTitle>
            <DialogDescription>Drives checkout discounts in the ServiceHub mock backend.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Code</Label>
                <Input
                  className="font-mono uppercase"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="SAVE20"
                  disabled={Boolean(editing)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Discount type</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, discountType: v as Promotion['discountType'] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <textarea
                className="flex min-h-[72px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Value</Label>
                <Input
                  inputMode="decimal"
                  value={form.discountValue}
                  onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Min amount</Label>
                <Input
                  inputMode="decimal"
                  value={form.minAmount}
                  onChange={(e) => setForm((f) => ({ ...f, minAmount: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Max uses</Label>
                <Input
                  inputMode="numeric"
                  value={form.maxUses}
                  onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Expiry</Label>
              <Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Paused codes stay in history.</p>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={() => void onSave()}>
              {saving ? 'Saving…' : 'Save coupon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
