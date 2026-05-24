import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, BookOpenCheck, Zap, Receipt, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import * as api from '@/services/mockApi'

const COLLECTION = [
  {
    id: 'scheduling',
    label: 'Scheduling & SLA',
    icon: Zap,
    color: 'text-amber-500',
    guides: [
      { title: 'How ServiceHub ETA math works', body: 'We blend traffic, staffing, and live GPS pings to surface pragmatic windows.' },
      { title: 'What happens when a technician is rerouted?', body: 'We alert your phone, credit loyalty points automatically, and re-open reschedule slots.' },
    ],
  },
  {
    id: 'payments',
    label: 'Payments & payouts',
    icon: Receipt,
    color: 'text-emerald-500',
    guides: [
      { title: 'Wallet vs. checkout capture differences', body: 'Wallets smooth micro-jobs while card rails handle compliance-heavy payouts.' },
      { title: 'Vendor weekly settlements', body: 'ACH batches include automatic promotional clawbacks mirrored in Statements.' },
    ],
  },
  {
    id: 'accounts',
    label: 'Profiles & personalization',
    icon: Sparkles,
    color: 'text-purple-500',
    guides: [
      { title: 'Multi-address households', body: 'Label addresses, designate default coverage postcodes for faster dispatch clustering.' },
      { title: 'Referral ladders', body: 'Stack invite codes alongside marketplace campaigns without double-spend.' },
    ],
  },
] as const

export function HelpPage() {
  const [query, setQuery] = useState('')
  const [categoriesPreview, setCategoriesPreview] = useState<string>('')

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q.length) return COLLECTION.flatMap((c) => c.guides.map((g) => ({ ...g, collection: c.label })))

    const acc: Array<{ title: string; body: string; collection: string }> = []
    COLLECTION.forEach((c) => {
      c.guides.forEach((g) => {
        if (g.title.toLowerCase().includes(q) || g.body.toLowerCase().includes(q)) {
          acc.push({ ...g, collection: c.label })
        }
      })
      if (c.label.toLowerCase().includes(q)) {
        c.guides.forEach((g) => {
          if (!acc.some((entry) => entry.title === g.title)) acc.push({ ...g, collection: c.label })
        })
      }
    })
    return acc
  }, [query])

  return (
    <>
      <div className="mx-auto mb-12 max-w-3xl space-y-4 text-center">
        <Badge variant="outline" className="mx-auto px-4 py-1 text-[11px] uppercase tracking-[0.4em]">
          Help center · ServiceHub
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">Search less, accomplish more.</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Curated best practices distilled from onsite operators serving millions of routed jobs (mock corpus for this sandbox).
        </p>
      </div>

      <Card className="mb-12 border-none bg-muted/45 shadow-xl">
        <CardContent className="flex flex-col gap-6 p-8 md:flex-row md:items-center">
          <div className="flex-1">
            <CardTitle className="text-2xl flex items-center gap-2 mb-4">
              <Search className="h-7 w-7 text-primary" />
              Spotlight search
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Start typing routing questions, payouts, cancellations, onboarding — synonyms included.
              <button
                type="button"
                className="ml-1 text-primary font-semibold inline-flex underline-offset-4 underline"
                onClick={async () => {
                  const cats = await api.getCategories()
                  setCategoriesPreview(cats.slice(0, 3).map((c) => c.name).join(' · '))
                }}
              >
                Pull live taxonomy
              </button>
            </CardDescription>
            {categoriesPreview && (
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-3">{categoriesPreview}</p>
            )}
          </div>
          <div className="w-full md:max-w-xl">
            <Input
              className="h-12 rounded-2xl border-primary/40 text-base shadow-inner"
              placeholder="Try ‘payout ETA’…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-3">
        {COLLECTION.map((bundle) => {
          const Icon = bundle.icon
          return (
            <Card key={bundle.id} className="backdrop-blur border-primary/25">
              <CardHeader>
                <div className={`inline-flex rounded-2xl bg-muted/70 p-3 w-fit ${bundle.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle>{bundle.label}</CardTitle>
                <CardDescription>Deep dives maintained by concierge success.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {bundle.guides.slice(0, 2).map((guide) => (
                  <ArticleRow key={guide.title} {...guide} />
                ))}
              </CardContent>
            </Card>
          )
        })}
      </section>

      <Card className="mt-14 border-none bg-card/80 backdrop-blur">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-8">
          <div>
            <CardTitle className="text-3xl mb-3 flex items-center gap-2">
              <BookOpenCheck className="h-9 w-9 text-primary" />
              Spotlight results
            </CardTitle>
            <CardDescription>Instant answers derived from fuzzy match against your keyboard.</CardDescription>
          </div>
          <Button asChild variant="outline" size="lg" className="rounded-full px-8">
            <Link to="/faq">Still uncertain? FAQs await</Link>
          </Button>
        </CardHeader>
        <CardContent className="divide-y px-8 py-0">
          {hits.length === 0 && <p className="py-8 text-center text-muted-foreground">Nothing matched yet — widen your wording.</p>}
          {hits.map((guide) => (
            <ArticleRow key={guide.title + guide.collection} eyebrow={guide.collection} {...guide} />
          ))}
        </CardContent>
      </Card>
    </>
  )
}

function ArticleRow({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string
  title: string
  body: string
}) {
  return (
    <article className="flex flex-col gap-2 py-5">
      {eyebrow && <p className="text-[11px] uppercase tracking-[0.38em] text-primary">{eyebrow}</p>}
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{body}</p>
    </article>
  )
}
