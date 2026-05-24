import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'

export function TermsPage() {
  return (
    <>
      <Badge variant="outline" className="mb-4 uppercase tracking-[0.4em] text-[11px]">
        Terms · May 2026
      </Badge>
      <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>

      <div className="space-y-10 max-w-none leading-relaxed text-muted-foreground">
        <Section title="Introduction">
          Welcome to ServiceHub. By accessing marketplace surfaces, conversational agents, dashboards, orchestration consoles, billing flows, loyalty tools, or ancillary APIs collectively (“Services”), you enter a binding arrangement with{' '}
          <strong className="text-foreground">ServiceHub Labs Pte. Ltd.</strong> and its subsidiaries (collectively “ServiceHub”, “we”, “our”). If you onboard on behalf of a company, you represent authority to bind that entity.
        </Section>

        <Section title="1. Roles & Accounts">
          ServiceHub distinguishes customers sourcing services, verified vendors provisioning labor and inventory, administrators governing trust & safety telemetry, automation agents acting with scoped tokens, auditors granted read-mostly overlays, observers monitoring synthetic fraud sentinels — each obtains credentials via invite or self-serve onboarding with jurisdiction-aware KYC stubs in this sandbox.
        </Section>

        <Section title="2. Marketplace Obligations">
          Vendor listings remain merchant-owned; nonetheless you warrant lawful conduct, truthful catalog metadata, calibrated pricing ladders, truthful certification badges — ServiceHub reserves the ability to degrade visibility, withhold payouts temporarily, escalate verification, annotate activity logs referencing policy breaches, annotate consumer disclosure banners.
        </Section>

        <Section title="3. Payments">
          Charges route through PSP partners mirrored in mock ledgers herein. Taxes, disbursement windows, escrow holds, surcharge transparency, tipping splits, philanthropic round-ups abide regional playbooks enumerated per tenant deployment — consult finance counsel before production extrapolation although sample math appears inside wallet statements for illustration.
        </Section>

        <Section title="4. Acceptable Automation">
          Autonomous quoting, SLA negotiation copilots, workforce dispatch transformers must remain human-reviewable toggles configurable under organization policy — ServiceHub may throttle automation throughput when telemetry suggests unfair leverage or degraded customer comprehension.
        </Section>

        <Section title="5. Limitation">
          Liability caps follow governing law stipulated during enterprise contracting; consumer tenants receive harmonized disclaimers aligning with ASEAN digital marketplace statutes — illustrative liability ceilings appear in Exhibit C of full PDF export (forthcoming tooling).
        </Section>

        <Section title="6. Modifications">
          We may revise these Terms with notice horizons tuned to regulatory guidance — substantive marketplace economics modifications afford comment windows when legally compelled.
        </Section>
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-foreground text-xl font-semibold mb-4">{title}</h2>
      <div className="text-base">{children}</div>
    </section>
  )
}
