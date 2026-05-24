import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, LayoutGrid, List, Search, SlidersHorizontal, Star } from 'lucide-react'
import { toast } from 'sonner'
import * as api from '@/services/mockApi'
import type { Service, ServiceCategory } from '@/types'
import { cn, formatCurrency } from '@/utils/cn'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebounce } from '@/hooks/useDebounce'

const PAGE_SIZE = 9

export function MarketplacePage() {
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)
  const [categoryId, setCategoryId] = useState<string>('all')
  const [priceRange, setPriceRange] = useState<string>('any')
  const [minRating, setMinRating] = useState<string>('any')
  const [sort, setSort] = useState<'popularity' | 'price_asc' | 'price_desc' | 'rating'>('popularity')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const filters: Parameters<typeof api.getServices>[0] = {
        search: debouncedSearch || undefined,
        categoryId: categoryId === 'all' ? undefined : categoryId,
        minRating:
          minRating === 'any' ? undefined : minRating === '4' ? 4 : minRating === '45' ? 4.5 : undefined,
      }
      if (priceRange === 'under100') {
        filters.maxPrice = 100
      } else if (priceRange === '100250') {
        filters.minPrice = 100
        filters.maxPrice = 250
      } else if (priceRange === 'over250') {
        filters.minPrice = 250
      }
      const [svc, cats] = await Promise.all([api.getServices(filters), api.getCategories()])
      let list = svc
      if (sort === 'price_asc') {
        list = [...list].sort((a, b) => (a.packages[0]?.price ?? 0) - (b.packages[0]?.price ?? 0))
      } else if (sort === 'price_desc') {
        list = [...list].sort((a, b) => (b.packages[0]?.price ?? 0) - (a.packages[0]?.price ?? 0))
      } else if (sort === 'rating') {
        list = [...list].sort((a, b) => b.rating - a.rating)
      } else {
        list = [...list].sort((a, b) => b.popularity - a.popularity)
      }
      setServices(list)
      setCategories(cats)
    } catch {
      toast.error('Could not load marketplace.')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, categoryId, priceRange, minRating, sort])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, categoryId, priceRange, minRating, sort])

  const totalPages = Math.max(1, Math.ceil(services.length / PAGE_SIZE))
  const slice = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return services.slice(start, start + PAGE_SIZE)
  }, [services, page])

  return (
    <AnimatedPage>
      <PageHeader
        title="Marketplace"
        description="Compare trusted vendors, transparent pricing, and instant booking across ServiceHub."
      />

      <Card className="mb-6">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="market-search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="market-search"
                  className="pl-9"
                  placeholder="Cleaning, plumber, electrician…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={view === 'grid' ? 'default' : 'outline'}
                size="icon"
                aria-label="Grid view"
                onClick={() => setView('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={view === 'list' ? 'default' : 'outline'}
                size="icon"
                aria-label="List view"
                onClick={() => setView('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Fine tune results below — updates apply instantly.</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Price</Label>
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any price</SelectItem>
                  <SelectItem value="under100">Under $100</SelectItem>
                  <SelectItem value="100250">$100 – $250</SelectItem>
                  <SelectItem value="over250">$250+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Minimum rating</Label>
              <Select value={minRating} onValueChange={setMinRating}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any rating</SelectItem>
                  <SelectItem value="4">4.0 stars & up</SelectItem>
                  <SelectItem value="45">4.5 stars & up</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sort by</Label>
              <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Trending near you</SelectItem>
                  <SelectItem value="rating">Top rated</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {!loading && services.length === 0 ? (
        <EmptyState title="No services match" description="Relax your filters or try a broader search phrase." />
      ) : (
        <>
          <div
            className={cn(view === 'grid' ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-3')}
          >
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className={cn(view === 'grid' ? 'h-80 rounded-xl' : 'h-28 rounded-xl')} />
                ))
              : slice.map((s) =>
                  view === 'grid' ? (
                    <AnimatedCard key={s.id}>
                      <Link
                        to={`/customer/marketplace/${s.id}`}
                        className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card transition hover:border-primary/50 hover:shadow-md"
                      >
                        <div className="relative aspect-[16/10] bg-muted">
                          <img
                            src={s.images[0]}
                            alt=""
                            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                          />
                          <Badge className="absolute left-3 top-3 gap-1" variant="secondary">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {s.rating.toFixed(1)}
                          </Badge>
                          {s.distance != null && (
                            <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">
                              {s.distance} km away
                            </span>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col gap-2 p-4">
                          <p className="line-clamp-2 font-semibold leading-snug group-hover:text-primary">{s.title}</p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
                          <div className="mt-auto flex flex-wrap gap-2">
                            {s.tags.slice(0, 2).map((t) => (
                              <Badge key={t} variant="outline">
                                {t}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-lg font-bold text-primary">
                            From {formatCurrency(s.packages[0]?.price ?? 0)}
                          </p>
                        </div>
                      </Link>
                    </AnimatedCard>
                  ) : (
                    <AnimatedCard key={s.id}>
                      <Link
                        to={`/customer/marketplace/${s.id}`}
                        className="flex flex-col gap-3 rounded-xl border bg-card p-4 transition hover:border-primary/45 sm:flex-row sm:items-center"
                      >
                        <img src={s.images[0]} alt="" className="h-24 w-full rounded-lg object-cover sm:h-20 sm:w-28" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{s.title}</p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                            <Star className="h-3.5 w-3.5 text-amber-400" /> {s.rating.toFixed(1)} ({s.reviewCount})
                          </span>
                          <span className="font-bold text-primary">{formatCurrency(s.packages[0]?.price ?? 0)}</span>
                          <Badge variant="secondary">Popular #{s.popularity}</Badge>
                        </div>
                      </Link>
                    </AnimatedCard>
                  )
                )}
          </div>

          {!loading && services.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}-
                {Math.min(page * PAGE_SIZE, services.length)} of {services.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  aria-label="Previous page"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm tabular-nums">
                  Page {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={page >= totalPages}
                  aria-label="Next page"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </AnimatedPage>
  )
}
