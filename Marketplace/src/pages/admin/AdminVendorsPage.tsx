import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapPin, Power, Store } from 'lucide-react'
import type { Vendor } from '@/types'
import * as api from '@/services/mockApi'
import { PageHeader } from '@/components/shared/PageHeader'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { format } from 'date-fns'

export function AdminVendorsPage() {
  const [list, setList] = useState<Vendor[]>([])
  const [search, setSearch] = useState('')

  const reload = useCallback(async () => {
    setList(await api.getVendors())
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (v) =>
        v.businessName.toLowerCase().includes(q) ||
        v.slug.toLowerCase().includes(q) ||
        v.location.address.toLowerCase().includes(q)
    )
  }, [list, search])

  async function toggleActive(vendor: Vendor) {
    const res = await api.updateVendor(vendor.id, {
      isActive: !vendor.isActive,
    })
    if (res.error) toast.error(res.error)
    else {
      toast.success(vendor.isActive ? 'Vendor deactivated' : 'Vendor re-listed')
      reload()
    }
  }

  return (
    <AnimatedPage>
      <PageHeader title="Vendor operations" description="Slice coverage, uptime, and trust signals across your supply network." />

      <Card className="overflow-hidden mb-6">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Store className="h-4 w-4" />
            {list.filter((v) => v.verificationStatus === 'approved').length} approved merchants ·{' '}
            {list.filter((v) => !v.isActive).length} paused
          </div>
          <Input
            placeholder="Search business, slug, HQ address…"
            className="max-w-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((v) => (
          <Card key={v.id} className="overflow-hidden border bg-gradient-to-br from-background to-muted/30">
            <CardContent className="p-0">
              <div className="flex items-start gap-4 p-5 border-b bg-card/70">
                <Avatar className="h-14 w-14 shrink-0 border">
                  <AvatarImage src={v.logo} alt="" />
                  <AvatarFallback>{v.businessName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-lg truncate">{v.businessName}</h3>
                    <Badge variant="outline" className="capitalize">
                      {v.verificationStatus.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex gap-2 items-start">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    {v.location.address}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2 text-xs text-muted-foreground">
                    <span>{v.completedBookings} jobs</span>
                    <span>·</span>
                    <span>${v.totalEarnings.toLocaleString()} earned</span>
                    <span>·</span>
                    <span>Joined {format(new Date(v.createdAt), 'MMM yyyy')}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant={v.isActive ? 'secondary' : 'destructive'} className="text-[10px] uppercase tracking-wide">
                    {v.isActive ? 'Live' : 'Hidden'}
                  </Badge>
                  <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs shadow-sm">
                    <Power className="h-3.5 w-3.5" />
                    <Switch checked={v.isActive} onCheckedChange={() => toggleActive(v)} />
                  </div>
                </div>
              </div>
              <div className="p-5 grid sm:grid-cols-3 gap-3 text-xs">
                <Metric label="Rating" value={`${v.rating.toFixed(1)} ★ (${v.reviewCount})`} />
                <Metric label="Categories" value={v.categories.slice(0, 2).join(', ') || '—'} />
                <Metric label="Specialists" value={`${v.teamMembers.length} on roster`} />
              </div>
              {v.adminNotes && (
                <div className="border-t px-5 py-3 text-xs bg-amber-500/5 border-amber-500/30 text-amber-900 dark:text-amber-100">
                  <strong>Admin note:</strong> {v.adminNotes}
                </div>
              )}
              <ScrollArea className="h-[120px] border-t">
                <div className="p-5 space-y-2 text-xs">
                  <p className="font-semibold text-sm">Operational surfaces</p>
                  <div className="flex flex-wrap gap-2">
                    {v.coverageAreas.map((area) => (
                      <Badge key={area} variant="outline">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>

      {!filtered.length && (
        <p className="text-center text-muted-foreground py-12">No merchants match those filters.</p>
      )}
    </AnimatedPage>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border px-3 py-2 bg-background">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-semibold truncate">{value}</p>
    </div>
  )
}
