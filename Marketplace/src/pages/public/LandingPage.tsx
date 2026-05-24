import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart4, Cpu, Layers3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const METRICS = [
  { label: 'Same-day SLA coverage', stat: '98.4%', copy: 'Modeled concurrency across ASEAN metros during peak monsoon disruptions.' },
  { label:'Wallet vs. escrow split', stat: '$180M processed', copy: 'Mock ledger throughput showcasing compliant routing without naming PSPs verbatim.' },
  { label:'Trust ops automation', stat: '37% fewer false positives', copy: 'Fraud sentinel heuristics calibrated with explainable escalation trails.' },
] as const

export function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden rounded-none border-x-0 md:rounded-none bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.22),transparent_62%)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-20 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-8">
            <Badge className="w-fit rounded-full bg-primary px-6 py-1 text-[11px] uppercase tracking-[0.45em] text-primary-foreground">
              Marketplace OS
            </Badge>
            <div>
              <h1 className="text-5xl font-black tracking-tight leading-[1.05] md:text-6xl mb-6">
                Orchestrate on-demand brilliance <span className="text-primary">without duct tape stacks.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                ServiceHub aligns customer promises, technician excellence, treasury discipline, concierge AI — illuminating every hop from discovery QR through settlement archives.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="rounded-full px-10 gap-3 text-lg h-12" asChild>
                <Link to="/login">
                  Launch console <ArrowRight className="h-5 w-5" aria-hidden />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-10 border-primary/60 text-lg h-12" asChild>
                <Link to="/help">Tour help nucleus</Link>
              </Button>
            </div>
            <dl className="grid gap-4 sm:grid-cols-3">
              <MiniStat eyebrow="Workforce elasticity" delta="+41% weekend fill rate" detail="Adaptive routing overlays" icon={<Layers3 className="h-5 w-5" />} />
              <MiniStat eyebrow="Operational visibility" delta="Realtime kanban overlays" detail="Fleet & finance fusion" icon={<BarChart4 className="h-5 w-5" />} />
              <MiniStat eyebrow="Composable AI" delta="Agents respect guardrails" detail="SOC2-ready scaffolding" icon={<Cpu className="h-5 w-5" />} />
            </dl>
          </div>
          <div className="flex-1">
            <div className="relative rounded-[42px] border bg-card shadow-2xl p-10">
              <div className="absolute inset-px rounded-[40px] border border-white/60 dark:border-white/5 pointer-events-none" />
              <p className="text-sm uppercase tracking-[0.52em] text-muted-foreground mb-6 text-center">
                Operational snapshot
              </p>
              <div className="space-y-4">
                {[78, 64, 58, 93].map((width, idx) => (
                  <div key={idx}>
                    <div className="mb-2 flex justify-between text-xs uppercase tracking-[0.3em]">
                      <span>Signal {idx + 1}</span>
                      <span>{width}%</span>
                    </div>
                    <div className="h-4 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary shadow-lg" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-12 grid gap-3 text-sm leading-relaxed text-muted-foreground">
                <blockquote className="border-l border-primary px-6 py-4 italic bg-muted/70 rounded-xl">
                  “Teams finally unify dispatch, underwriting, concierge voice — nightly exports became optional.” — Chief Marketplace Officer, illustrative narrative.
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-4">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="secondary" className="tracking-[0.45em] text-[11px] uppercase px-6 py-2">
            Proof scaffolding
          </Badge>
          <h2 className="text-4xl font-black tracking-tight">Metrics marketing actually quotes.</h2>
          <p className="text-muted-foreground text-lg mx-auto max-w-3xl">
            Every KPI below is illustrative for investor decks — tie them back to instrumentation you intend to expose within your routed analytics pipelines.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {METRICS.map((metric) => (
            <Card key={metric.label} className="border-none bg-gradient-to-br from-card via-muted/70 to-muted/40">
              <CardContent className="p-10 space-y-6">
                <p className="text-sm uppercase tracking-[0.45em] text-muted-foreground">{metric.label}</p>
                <p className="text-5xl font-black text-primary">{metric.stat}</p>
                <p className="text-muted-foreground leading-relaxed">{metric.copy}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto mb-28 mt-28 max-w-5xl rounded-[52px] border bg-primary text-primary-foreground px-10 py-16 shadow-2xl">
        <div className="space-y-6 text-center">
          <p className="text-sm uppercase tracking-[0.62em] text-primary-foreground/80">Momentum</p>
          <p className="text-4xl font-black md:text-[44px]">Ready when your playbook is ready.</p>
          <Button asChild size="lg" variant="secondary" className="rounded-full px-12 text-lg h-12">
            <Link to="/login">Continue to authenticated cockpit</Link>
          </Button>
        </div>
      </section>
    </>
  )
}

function MiniStat({
  eyebrow,
  delta,
  detail,
  icon,
}: {
  eyebrow: string
  delta: string
  detail: string
  icon: ReactNode
}) {
  return (
    <div className="rounded-2xl border bg-card px-5 py-4 shadow-inner">
      <div className="flex items-start justify-between gap-3 mb-4 text-primary">{icon}</div>
      <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">{eyebrow}</p>
      <p className="text-xl font-semibold mt-3">{delta}</p>
      <p className="text-sm text-muted-foreground mt-1">{detail}</p>
    </div>
  )
}
