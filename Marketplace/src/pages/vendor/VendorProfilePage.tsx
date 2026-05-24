import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import * as api from '@/services/mockApi'
import { useAuthStore } from '@/store/authStore'
import { useVendorForAuthUser } from '@/pages/vendor/useVendorWorkspace'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { Review } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getInitials } from '@/utils/cn'

export function VendorProfilePage() {
  const userId = useAuthStore((s) => s.session?.userId)
  const { vendor, loading } = useVendorForAuthUser(userId)
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    let active = true
    void (async () => {
      await Promise.resolve()
      if (!active) return
      if (!vendor) {
        setReviews([])
        return
      }
      const all = await api.getReviews()
      if (!active) return
      setReviews(all.filter((r) => r.vendorId === vendor.id))
    })()
    return () => {
      active = false
    }
  }, [vendor])

  if (loading) return <Skeleton className="h-[640px] w-full" />

  if (!vendor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>No vendor storefront linked.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const bannerSrc = vendor.banner ?? vendor.gallery[0]

  return (
    <div className="space-y-8">
      <PageHeader title="Vendor profile" description="How customers perceive your storefront." />

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div
          className="h-40 w-full bg-cover bg-center"
          style={{
            backgroundImage: bannerSrc ? `url(${bannerSrc})` : undefined,
          }}
        />
        <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between">
          <div className="-mt-16 flex gap-4">
            <Avatar className="h-28 w-28 border-4 border-background shadow-lg md:h-32 md:w-32">
              <AvatarImage src={vendor.logo} />
              <AvatarFallback className="text-2xl">{getInitials(vendor.businessName)}</AvatarFallback>
            </Avatar>
            <div className="pt-12 md:pt-14">
              <h2 className="text-2xl font-bold">{vendor.businessName}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1 font-medium text-foreground">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {vendor.rating.toFixed(1)} · {vendor.reviewCount} reviews
                </div>
                <Badge variant={vendor.verificationStatus === 'approved' ? 'success' : 'warning'}>
                  {vendor.verificationStatus}
                </Badge>
                {!vendor.isActive && <Badge variant="secondary">Inactive</Badge>}
              </div>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{vendor.description}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="gallery" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-2">
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="certs">Certifications</TabsTrigger>
        </TabsList>
        <TabsContent value="gallery" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Showcase imagery</CardTitle>
              <CardDescription>Great photos convert ServiceHub explorers.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {vendor.gallery.map((src) => (
                <div key={src} className="overflow-hidden rounded-xl border">
                  <img src={src} alt="" className="aspect-4/3 w-full object-cover" />
                </div>
              ))}
              {!vendor.gallery.length && <p className="text-sm text-muted-foreground">No gallery photos yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reviews" className="space-y-3">
          <Card>
            <CardHeader className="flex flex-row justify-between gap-4">
              <div>
                <CardTitle>Customer testimonials</CardTitle>
                <CardDescription>Backed by seeded marketplace reviews.</CardDescription>
              </div>
              <Badge variant="outline">{reviews.length} shown</Badge>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[360px] pr-4">
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="rounded-xl border bg-muted/40 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={r.userAvatar} />
                            <AvatarFallback>{getInitials(r.userName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{r.userName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-600">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-4 w-4 ${s <= r.rating ? 'fill-yellow-400 text-yellow-400' : ''}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{r.comment}</p>
                    </div>
                  ))}
                  {!reviews.length && (
                    <p className="text-center text-sm text-muted-foreground py-8">Reviews will populate as jobs finish.</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="team" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Trusted crew</CardTitle>
              <CardDescription>Experts listed on your public storefront.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {vendor.teamMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border p-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={m.avatar} />
                    <AvatarFallback>{getInitials(m.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-sm text-muted-foreground">{m.role}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="certs" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Certifications & attestations</CardTitle>
              <CardDescription>Show trust badges prominently on outbound proposals.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {vendor.certifications.map((c) => (
                <Badge key={c} variant="secondary">
                  {c}
                </Badge>
              ))}
              {!vendor.certifications.length && (
                <p className="text-sm text-muted-foreground">Add credentials from Settings › Compliance links (mock).</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
