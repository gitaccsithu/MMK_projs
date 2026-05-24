import { useCallback, useEffect, useMemo, useState } from 'react'
import { ShieldAlert, ShieldCheck, MessageSquareWarning } from 'lucide-react'
import type { Vendor, VerificationStatus } from '@/types'
import * as api from '@/services/mockApi'
import { PageHeader } from '@/components/shared/PageHeader'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { format } from 'date-fns'

const STATUS_ORDER: VerificationStatus[] = ['pending', 'needs_info', 'approved', 'rejected']

export function VerificationPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<VerificationStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [draftAction, setDraftAction] = useState<Exclude<VerificationStatus, 'needs_info'> | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    const v = await api.getVendors()
    setVendors(v)
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return vendors.filter((v) => {
      if (filter !== 'all' && v.verificationStatus !== filter) return false
      if (!q) return true
      return (
        v.businessName.toLowerCase().includes(q) ||
        v.slug.toLowerCase().includes(q) ||
        v.onboarding.registrationNumber.toLowerCase().includes(q)
      )
    })
  }, [filter, vendors, search])

  const selected = vendors.find((v) => v.id === selectedId) ?? null

  const openDecision = (vendor: Vendor, action: Exclude<VerificationStatus, 'needs_info'>) => {
    setSelectedId(vendor.id)
    setDraftAction(action)
    setNotes(vendor.adminNotes ?? '')
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="Vendor verification"
        description="Approve trusted partners onto the marketplace or bounce incomplete dossiers."
      />

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as VerificationStatus | 'all')}
          className="w-full md:w-auto"
        >
          <TabsList className="flex-wrap h-auto gap-1 p-1 bg-muted/50">
            <TabsTrigger value="all">Queue</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="needs_info">Needs info</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          placeholder="Search business name, slug, registration #"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:max-w-sm"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden lg:col-span-1">
          <CardHeader className="border-b bg-muted/40">
            <CardTitle>Inbox ({filtered.length})</CardTitle>
            <CardDescription>Documents and onboarding signals are illustrative for this demo tenant.</CardDescription>
          </CardHeader>
          <ScrollArea className="h-[560px]">
            <CardContent className="p-0">
              <ul className="divide-y">
                {loading && (
                  <li className="p-10 text-center text-sm text-muted-foreground">Refreshing queue…</li>
                )}
                {!loading && filtered.length === 0 && (
                  <li className="flex flex-col items-center gap-2 p-10 text-center">
                    <ShieldCheck className="h-10 w-10 text-emerald-500" />
                    <p className="font-medium">Queue is squeaky clean</p>
                    <p className="max-w-xs text-sm text-muted-foreground">
                      Tune filters above or ingest new vendor applications — nothing left to adjudicate here.
                    </p>
                  </li>
                )}
                {filtered.map((v) => {
                  const urgent = v.verificationStatus === 'pending' || v.verificationStatus === 'needs_info'
                  return (
                    <li key={v.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(v.id)}
                        className={`flex w-full flex-col gap-2 p-4 text-left transition-colors hover:bg-muted/60 ${
                          selectedId === v.id ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{v.businessName}</span>
                          <Badge variant={urgent ? 'destructive' : 'secondary'} className="capitalize">
                            {v.verificationStatus.replace(/_/g, ' ')}
                          </Badge>
                          {v.adminNotes ? (
                            <Badge variant="outline" className="gap-1 text-xs">
                              <MessageSquareWarning className="h-3 w-3" />
                              Admin note
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>{v.location.address}</span>
                          <span>Step {v.onboarding.step} onboarding</span>
                          <span>{v.completedBookings} jobs completed</span>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </ScrollArea>
        </Card>

        <Card className="lg:sticky lg:top-24 lg:self-start">
          <CardHeader>
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-6 w-6 text-primary" />
              <div>
                <CardTitle>Evidence & decision</CardTitle>
                <CardDescription>Approve or bounce with rationale — customers read review stars, ops read notes.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {selected ? (
              <>
                <div className="rounded-xl border bg-gradient-to-br from-muted/70 to-muted/30 p-4">
                  <p className="text-lg font-semibold">{selected.businessName}</p>
                  <p className="text-sm text-muted-foreground mt-1">{selected.description.slice(0, 160)}…</p>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Registration</dt>
                      <dd className="font-mono text-sm">{selected.onboarding.registrationNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Bank held</dt>
                      <dd className="font-mono text-sm">
                        {selected.onboarding.bankName} · {selected.onboarding.bankAccount.slice(0, 6)}****
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Submitted</dt>
                      <dd>
                        {selected.onboarding.submittedAt
                          ? format(new Date(selected.onboarding.submittedAt), 'PPp')
                          : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Documents</dt>
                      <dd>{selected.onboarding.documents.length} files uploaded</dd>
                    </div>
                  </dl>
                  <ScrollArea className="mt-4 h-[130px] rounded-lg border bg-background">
                    <ul className="divide-y text-sm">
                      {selected.onboarding.documents.map((doc) => (
                        <li key={doc.id} className="flex items-center justify-between gap-4 px-3 py-2">
                          <span className="font-medium truncate">{doc.name}</span>
                          <span className="shrink-0 text-xs capitalize text-muted-foreground">{doc.type}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="default" onClick={() => openDecision(selected, 'approved')}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Approve vendor
                  </Button>

                  <Dialog open={draftAction === 'approved'} onOpenChange={(open) => !open && setDraftAction(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Approve {selected.businessName}?</DialogTitle>
                      </DialogHeader>
                      <label className="text-sm font-medium">Internal note for audit log (optional)</label>
                      <textarea
                        rows={4}
                        className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="Finance cleared bank micro-deposit, onboarding manager confirmed insurance."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                      <DialogFooter className="gap-2 flex-col-reverse sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" onClick={() => setDraftAction(null)}>
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={async () => {
                            const res = await api.updateVendorVerification(
                              selected.id,
                              'approved',
                              notes.trim() || undefined
                            )
                            if (res.error) toast.error(res.error)
                            else {
                              toast.success('Vendor verified')
                              setDraftAction(null)
                              await reload()
                            }
                          }}
                        >
                          Confirm approval
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button variant="destructive" onClick={() => openDecision(selected, 'rejected')}>
                    Reject dossier
                  </Button>

                  <Dialog open={draftAction === 'rejected'} onOpenChange={(open) => !open && setDraftAction(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reject {selected.businessName}</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-muted-foreground">
                        Vendors retain this note for rework. Aim for specificity (missing trade license chapter, blurry ID,
                        mismatch on bank ACH name).
                      </p>
                      <label className="text-sm font-medium">Admin notes *</label>
                      <textarea
                        rows={4}
                        required
                        className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="Government ID unreadable → request rescan plus selfie cross-check."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                      <DialogFooter className="gap-2 flex-col-reverse sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" onClick={() => setDraftAction(null)}>
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          disabled={!notes.trim()}
                          onClick={async () => {
                            if (!notes.trim()) return
                            const res = await api.updateVendorVerification(selected.id, 'rejected', notes.trim())
                            if (res.error) toast.error(res.error)
                            else {
                              toast.success('Submission rejected')
                              setDraftAction(null)
                              await reload()
                            }
                          }}
                        >
                          Reject permanently
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="secondary"
                    onClick={async () => {
                      const res = await api.updateVendorVerification(
                        selected.id,
                        'needs_info',
                        notes.trim() || 'Ops requested clarification on onboarding documents.'
                      )
                      if (res.error) toast.error(res.error)
                      else {
                        toast.message('Marked as needs info')
                        await reload()
                      }
                    }}
                  >
                    Request more info
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Status progression reference:{' '}
                  <span className="font-medium text-foreground">
                    {STATUS_ORDER.map((s) => s.replace(/_/g, ' ')).join(' → ')}
                  </span>
                </p>
              </>
            ) : (
              <div className="rounded-xl border border-dashed px-8 py-12 text-center text-sm text-muted-foreground">
                Select a merchant from the inbox to unpack compliance artifacts.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AnimatedPage>
  )
}
