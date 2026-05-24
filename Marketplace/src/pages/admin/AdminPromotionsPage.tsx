import { useCallback, useEffect, useState } from 'react'
import { Gift, BadgePercent } from 'lucide-react'
import type { Promotion } from '@/types'
import * as api from '@/services/mockApi'
import { PageHeader } from '@/components/shared/PageHeader'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { format } from 'date-fns'

export function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [edit, setEdit] = useState<Promotion | null>(null)

  const [form, setForm] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'percentage' as Promotion['discountType'],
    discountValue: 15,
    minAmount: 50,
    maxUses: 1000,
    vendorId: undefined as string | undefined,
    isActive: true,
    expiresInput: format(new Date(Date.now() + 86400000 * 30), "yyyy-MM-dd'T'HH:mm"),
  })

  const reload = useCallback(async () => setPromotions(await api.getPromotions()), [])

  useEffect(() => {
    reload()
  }, [reload])

  function openCreate() {
    const d = new Date(Date.now() + 86400000 * 30)
    setEdit(null)
    setForm({
      code: '',
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: 15,
      minAmount: 40,
      maxUses: 500,
      vendorId: undefined,
      isActive: true,
      expiresInput: format(d, "yyyy-MM-dd'T'HH:mm"),
    })
    setDialogOpen(true)
  }

  function openEdit(promo: Promotion) {
    setEdit(promo)
    setForm({
      code: promo.code,
      title: promo.title,
      description: promo.description,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minAmount: promo.minAmount,
      maxUses: promo.maxUses,
      vendorId: promo.vendorId,
      isActive: promo.isActive,
      expiresInput: format(new Date(promo.expiresAt), "yyyy-MM-dd'T'HH:mm"),
    })
    setDialogOpen(true)
  }

  async function save() {
    const expiresAt = new Date(form.expiresInput).toISOString()
    const base: Omit<Promotion, 'id'> = {
      code: form.code.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minAmount: Number(form.minAmount),
      maxUses: Number(form.maxUses),
      vendorId: form.vendorId?.trim() || undefined,
      expiresAt,
      isActive: form.isActive,
      usedCount: edit?.usedCount ?? 0,
    }

    if (edit) {
      const res = await api.updatePromotion(edit.id, base)
      if (res.error) toast.error(res.error)
      else {
        toast.success('Promotion synced')
        setDialogOpen(false)
        reload()
      }
    } else {
      const res = await api.createPromotion({ ...base, usedCount: 0 })
      if (res.error) toast.error(res.error)
      else {
        toast.success('Campaign launched')
        setDialogOpen(false)
        reload()
      }
    }
  }

  async function toggleActive(id: string, enabled: boolean) {
    const res = await api.updatePromotion(id, { isActive: enabled })
    if (res.error) toast.error(res.error)
    else {
      toast.message(enabled ? 'Live in checkout' : 'Paused')
      reload()
    }
  }

  async function remove(p: Promotion) {
    if (!window.confirm(`Delete promo ${p.code}?`)) return
    const res = await api.deletePromotion(p.id)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Removed')
      reload()
    }
  }

  return (
    <AnimatedPage>
      <PageHeader title="Promotion studio" description="Coordinate stackable incentives, uplift experiments, and partner-funded markdowns." />

      <div className="mb-6 rounded-3xl border bg-gradient-to-r from-primary/15 via-accent/60 to-muted p-[1px]">
        <div className="flex flex-wrap gap-6 rounded-[calc(theme(borderRadius.3xl)-1px)] bg-card px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/15 p-3 text-primary">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Active campaigns</p>
              <p className="text-3xl font-bold">{promotions.filter((p) => p.isActive).length}</p>
              <p className="text-sm text-muted-foreground">of {promotions.length} configured promos</p>
            </div>
          </div>
          <Button type="button" className="ml-auto shrink-0" onClick={openCreate}>
            Launch campaign
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="h-[620px]">
            <table className="min-w-[720px] w-full text-sm">
              <thead className="border-b bg-muted/40 sticky top-0 backdrop-blur text-left font-medium">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Title</th>
                  <th className="px-4 py-3 hidden md:table-cell">Mechanic</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">Usage</th>
                  <th className="px-4 py-3 text-center">Toggle</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {promotions.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-semibold">{p.code}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{p.title}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="outline" className="capitalize gap-1">
                        <BadgePercent className="h-3 w-3" />
                        {p.discountType} ·{' '}
                        {p.discountType === 'percentage' ? `${p.discountValue}%` : `$${p.discountValue}`}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{format(new Date(p.expiresAt), 'MMM d, yyyy HH:mm')}</td>
                    <td className="px-4 py-3">{p.usedCount} / {p.maxUses}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <Switch checked={p.isActive} onCheckedChange={(v) => toggleActive(p.id, v)} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(p)}>
                        Edit
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => remove(p)}>
                        Drop
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{edit ? `Edit promo ${edit.code}` : 'Compose promotion'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pr-code">Code</Label>
                <Input id="pr-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SHIPFREE" />
              </div>
              <div className="space-y-1.5">
                <Label>Discount type</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(v: 'percentage' | 'fixed') => setForm({ ...form, discountType: v })}
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
            <div className="grid gap-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <textarea
                className="min-h-[92px] w-full resize-none rounded-xl border px-3 py-2 text-sm"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Value</Label>
                <Input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Min spend ($)</Label>
                <Input
                  type="number"
                  value={form.minAmount}
                  onChange={(e) => setForm({ ...form, minAmount: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max impressions</Label>
                <Input
                  type="number"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Partner vendor ID (optional)</Label>
                <Input
                  placeholder="scoped to merchant"
                  value={form.vendorId ?? ''}
                  onChange={(e) => setForm({ ...form, vendorId: e.target.value || undefined })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="pr-expires">Ends</Label>
                <Input
                  id="pr-expires"
                  type="datetime-local"
                  value={form.expiresInput}
                  onChange={(e) => setForm({ ...form, expiresInput: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm gap-4">
              <span>Eligible for checkout carousel</span>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={!form.code.trim()} onClick={save}>
              Commit changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  )
}
