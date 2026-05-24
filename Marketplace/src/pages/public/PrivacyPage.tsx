import { ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ReactNode } from 'react'

export function PrivacyPage() {
  return (
    <>
      <div className="mb-12 flex gap-6 border-b pb-10">
        <div className="rounded-3xl bg-primary/10 p-6 text-primary">
          <ShieldCheck className="h-14 w-14" aria-hidden />
        </div>
        <div className="space-y-4">
          <Badge variant="outline" className="uppercase tracking-[0.38em] text-[11px]">
            Effective · Rolling
          </Badge>
          <h1 className="text-4xl font-bold">Privacy policy</h1>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            Transparency keeps trust elastic. Below we outline how identities, transactional metadata, conversational transcripts, deterministic fraud fingerprints, ephemeral geolocation breadcrumbs, personalization graphs, auditing hooks — all evolve across ServiceHub workspaces.
          </p>
        </div>
      </div>

      <article className="space-y-10 text-muted-foreground leading-relaxed text-base">
        <PolicyBlock eyebrow="Data controller" heading="Corporate posture">
          ServiceHub processes personal data pursuant to SOC2-aligned controls mirrored in-region with data residency selectors admin-configurable atop your deployment shell.
        </PolicyBlock>

        <PolicyBlock eyebrow="Collected layers" heading="What we ingest">
          We collect account primitives, payout instruments, staffing rosters subject to minimized fields, telemetry from mobile dispatch clients, deterministic device integrity signals derived from attestations APIs, conversational transcripts flagged for QA sampling, hashed referral graphs to reward loops without naive PII rehydration unless legally compelled.
        </PolicyBlock>

        <PolicyBlock eyebrow="Purposes" heading="Why ingestion happens">
          Purposes encompass marketplace matching orchestration, trust & fraud deterrence overlays, SLA compliance analytics summarizing percentile breach windows without naming individuals in executive dashboards unless escalations warrant, personalization respecting explicit consent toggles, regulatory reporting packages.
        </PolicyBlock>

        <PolicyBlock eyebrow="Retention tiers" heading="Lifecycle controls">
          Immutable ledgers abide finance retention — engagement analytics compress after eighteen months absent legal holds — conversation snippets auto-expunge after ninety days unless you pin transcripts for audits — geolocation breadcrumbs decay after fulfillment plus six hours excluding dispute windows.
        </PolicyBlock>

        <PolicyBlock eyebrow="Transfers" heading="Cross-border relays">
          Transfers obey SCCs augmented with ASEAN adequacy overlays — admins label routing tags in configuration consoles aligning policy narrative with infra-as-code modules.
        </PolicyBlock>

        <PolicyBlock eyebrow="Choices" heading="Your levers">
          Users adjust marketing toggles instantly — export profile bundles programmatically soon — escalate deletion requests adjudicated respecting legitimate interest balancing tests — maintain DSAR ticketing integrated with concierge SLAs enumerated in administrator monitoring surfaces.
        </PolicyBlock>

        <PolicyBlock eyebrow="Contact" heading="Reach humans">
          Privacy office electronic mail derives from your workspace onboarding package — escalate regulatory inquiries referencing ticket correlation IDs surfaced inside admin monitoring fraud mockups bridging operational storytelling.
        </PolicyBlock>
      </article>
    </>
  )
}

function PolicyBlock({
  eyebrow,
  heading,
  children,
}: {
  eyebrow: string
  heading: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[28px] border bg-card px-8 py-6 shadow-inner">
      <p className="text-[11px] uppercase tracking-[0.42em] text-primary mb-2">{eyebrow}</p>
      <h2 className="text-foreground text-2xl font-semibold mb-3">{heading}</h2>
      <div>{children}</div>
    </section>
  )
}
