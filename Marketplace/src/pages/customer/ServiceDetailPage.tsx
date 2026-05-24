import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  BadgeCheck,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  MessageCircleQuestion,
  Star,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import * as api from '@/services/mockApi'
import type { Review, Service, Vendor } from '@/types'
import { cn, formatCurrency, formatDate } from '@/utils/cn'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const FAQ_ITEMS = [
  {
    q: 'What if I need to reschedule?',
    a: 'You can reschedule from My Bookings up to 12 hours before the visit. Same-day moves may incur a small fee.',
  },
  {
    q: 'Are vendors insured?',
    a: 'Verified pros display certifications on their profile. You can review coverage details before confirming payment.',
  },
  {
    q: 'How does pricing work?',
    a: 'Packages bundle labor and typical materials. Onsite diagnostics may quote add-ons—which you approve first.',
  },
]

export function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [service, setService] = useState<Service | null>(null)
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [imgIdx, setImgIdx] = useState(0)
  const [favSaving, setFavSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!id) return
      setLoading(true)
      try {
        const s = await api.getServiceById(id)
        if (cancelled) return
        if (!s) {
          setService(null)
          setVendor(null)
          setReviews([])
          return
        }
        setService(s)
        setImgIdx(0)
        const [v, rev] = await Promise.all([api.getVendorById(s.vendorId), api.getReviews(s.id)])
        if (!cancelled) {
          setVendor(v ?? null)
          setReviews(rev)
        }
      } catch {
        toast.error('Failed to load this service.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  const isFavorite = useMemo(() => {
    return user?.favoriteVendorIds?.includes(service?.vendorId ?? '') ?? false
  }, [user, service])

  async function toggleFavorite() {
    if (!user?.id || !service) {
      toast.error('Sign in to save favorites.')
      return
    }
    setFavSaving(true)
    const next = [...(user.favoriteVendorIds ?? [])]
    const ix = next.indexOf(service.vendorId)
    if (ix === -1) next.push(service.vendorId)
    else next.splice(ix, 1)
    const res = await api.updateUser(user.id, { favoriteVendorIds: next })
    if (!res.data) {
      toast.error('Unable to update favorites — try again.')
      setFavSaving(false)
      return
    }
    useAuthStore.setState({ user: res.data })
    toast.success(ix === -1 ? 'Vendor saved to favorites.' : 'Removed from favorites.')
    setFavSaving(false)
  }

  const mainImage = service?.images[imgIdx] ?? service?.images[0]

  if (!id) {
    return <EmptyState title="Missing service" description="Navigate from the marketplace to open a listing." />
  }

  return (
    <AnimatedPage>
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="lg:col-span-8 aspect-[16/10] rounded-2xl" />
          <Skeleton className="lg:col-span-4 h-64 rounded-2xl" />
        </div>
      ) : !service ? (
        <EmptyState title="Service unavailable" description="This listing might be inactive." />
      ) : (
        <>
          <PageHeader title={service.title} description={`Hosted by ${vendor?.businessName ?? 'ServiceHub Vendor'}`}>
            <Button
              variant="outline"
              size="icon"
              aria-label="Toggle favorite vendor"
              disabled={favSaving}
              onClick={() => void toggleFavorite()}
              className={cn(isFavorite && 'border-red-400/70 text-red-500')}
            >
              <Heart className={cn('h-5 w-5', isFavorite && 'fill-current')} />
            </Button>
            <Button asChild>
              <Link to={`/customer/book/${service.id}`}>
                Book now <CalendarPlus className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </PageHeader>

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-8">
              <AnimatedCard>
                <div className="overflow-hidden rounded-2xl border bg-muted shadow-sm">
                  <div className="relative aspect-[16/10]">
                    <img src={mainImage} alt="" className="h-full w-full object-cover" />
                    {service.images.length > 1 && (
                      <>
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full opacity-90"
                          aria-label="Previous image"
                          onClick={() =>
                            setImgIdx((i) => (i - 1 + service.images.length) % service.images.length)
                          }
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full opacity-90"
                          aria-label="Next image"
                          onClick={() => setImgIdx((i) => (i + 1) % service.images.length)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 overflow-x-auto bg-background/95 p-2">
                    {service.images.map((src, i) => (
                      <button
                        key={src + i}
                        type="button"
                        onClick={() => setImgIdx(i)}
                        className={cn(
                          'relative h-16 w-24 shrink-0 overflow-hidden rounded-md border transition',
                          i === imgIdx ? 'border-primary ring-2 ring-primary/40' : 'opacity-75 hover:opacity-100'
                        )}
                      >
                        <img src={src} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </AnimatedCard>

              <AnimatedCard>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Overview</CardTitle>
                    <CardDescription>Detailed scope and what&apos;s included.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {service.description}
                  </CardContent>
                </Card>
              </AnimatedCard>

              <AnimatedCard>
                <Card>
                  <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">Reviews</CardTitle>
                      <CardDescription>
                        {reviews.length ? `${reviews.length} verified bookings` : 'New listing — reviews coming soon'}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      ★ {service.rating.toFixed(1)} · {service.reviewCount} reviews
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {reviews.slice(0, 8).length === 0 ? (
                      <EmptyState icon={<MessageCircleQuestion className="h-8 w-8" />} title="No public reviews yet" />
                    ) : (
                      reviews.slice(0, 8).map((r) => (
                        <div key={r.id} className="border-b border-border/60 pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <img
                              src={r.userAvatar ?? 'https://api.dicebear.com/7.x/initials/svg?seed=R'}
                              alt=""
                              className="h-9 w-9 rounded-full border"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{r.userName}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Star className="h-3 w-3 text-amber-400" /> {r.rating} ·{' '}
                                {formatDate(r.createdAt)}
                              </div>
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </AnimatedCard>

              <AnimatedCard>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MessageCircleQuestion className="h-4 w-4" /> FAQ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {FAQ_ITEMS.map((item) => (
                      <details
                        key={item.q}
                        className="group rounded-xl border px-4 py-2 transition [&[open]]:bg-muted/40"
                      >
                        <summary className="cursor-pointer list-none py-2 font-medium outline-none [&::-webkit-details-marker]:hidden">
                          {item.q}
                        </summary>
                        <p className="pb-3 text-sm text-muted-foreground">{item.a}</p>
                      </details>
                    ))}
                  </CardContent>
                </Card>
              </AnimatedCard>
            </div>

            <aside className="space-y-4 lg:col-span-4">
              <AnimatedCard>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Vendor</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {vendor ? (
                      <>
                        <div className="flex gap-3">
                          <img
                            src={vendor.logo ?? 'https://api.dicebear.com/7.x/initials/svg?seed=V'}
                            alt=""
                            className="h-14 w-14 rounded-xl border object-cover"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-semibold">{vendor.businessName}</p>
                              {vendor.verificationStatus === 'approved' && (
                                <Badge variant="outline" className="gap-0.5 px-1.5 text-[10px]">
                                  <BadgeCheck className="h-3 w-3" /> Verified
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{vendor.completedBookings} completed jobs</p>
                            <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="h-3 w-3 text-amber-400" /> {vendor.rating.toFixed(1)} ·{' '}
                              {vendor.reviewCount} reviews
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                          {vendor.location.address}
                        </div>
                        <p className="text-sm text-muted-foreground">{vendor.description}</p>
                      </>
                    ) : (
                      <Skeleton className="h-32 w-full" />
                    )}
                  </CardContent>
                </Card>
              </AnimatedCard>

              <AnimatedCard>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Packages</CardTitle>
                    <CardDescription>Pick the tier that matches your workload.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {service.packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="rounded-xl border p-4 transition hover:border-primary/35"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{pkg.name}</p>
                            <p className="text-xs text-muted-foreground">{pkg.description}</p>
                            <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
                              {pkg.features.map((f) => (
                                <li key={f}>{f}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">{formatCurrency(pkg.price)}</p>
                            <p className="text-[11px] text-muted-foreground">{pkg.duration} min est.</p>
                          </div>
                        </div>
                        <Button asChild className="mt-4 w-full" variant="outline" size="sm">
                          <Link to={`/customer/book/${service.id}?pkg=${pkg.id}`}>Continue with package</Link>
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </AnimatedCard>
            </aside>
          </div>
        </>
      )}
    </AnimatedPage>
  )
}
