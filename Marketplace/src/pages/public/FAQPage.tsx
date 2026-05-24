import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'

type FaqEntry = {
  question: string
  answer: string
}

const FAQ_ITEMS: FaqEntry[] = [
  {
    question: 'Is ServiceHub a managed marketplace?',
    answer:
      'Yes — we unify discovery, SLA enforcement, escrow, payouts, loyalty, compliance hooks, plus AI copilots to triage outages. Providers stay independent while consumers keep a coherent cart.',
  },
  {
    question: 'How dynamic is pricing?',
    answer:
      'Vendors propose packages scoped to duration plus materials variance. Consumers see transparent fare caps; surge overlays require explicit acknowledgement before booking.',
  },
  {
    question: 'What payment rails are mocked here?',
    answer:
      'This workspace simulates Stripe-style cards, wallets, grabs, refunds, clawbacks — perfect for tabletop exercises.',
  },
  {
    question: 'Do you onboard enterprise procurement teams?',
    answer:
      'Invite-only workspaces support PO lines, SSO, granular RBAC — reach out via your alliances lead when your tenant graduates from demos.',
  },
  {
    question: 'How do cancellations affect loyalty?',
    answer:
      'Customer-initiated late cancels degrade reputation chips; compassionate waivers annotate your wallet trail for auditors.',
  },
]

export function FAQPage() {
  const [open, setOpen] = useState<string | null>(FAQ_ITEMS[0].question)

  return (
    <>
      <div className="mb-10 flex flex-wrap items-start justify-between gap-6 border-b pb-10">
        <div>
          <Badge className="mb-3">FAQ</Badge>
          <h1 className="text-4xl font-bold mb-4">Straight answers · zero fluff.</h1>
          <p className="text-muted-foreground max-w-xl text-lg leading-relaxed">
            We grouped the FAQs product, GTM, and operations teams replay during executive dry-runs — accordion states persist only in-session here.
          </p>
        </div>
      </div>

      <div className="divide-y rounded-3xl border bg-card px-6 py-4 shadow-xl">
        {FAQ_ITEMS.map((faq) => {
          const expanded = open === faq.question
          return (
            <div key={faq.question} className="py-5">
              <Button
                type="button"
                variant="ghost"
                className="flex w-full items-center gap-4 justify-between whitespace-normal px-0 text-left hover:bg-transparent h-auto py-3"
                onClick={() => setOpen(expanded ? null : faq.question)}
              >
                <span className="text-xl font-semibold leading-snug pr-10">{faq.question}</span>
                <ChevronDown
                  className={cn('mt-2 h-6 w-6 shrink-0 text-primary transition-transform', expanded && '-rotate-180')}
                />
              </Button>
              <div className={cn('grid overflow-hidden transition-all duration-300', expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                <div className="overflow-hidden px-4 text-muted-foreground text-base leading-relaxed border-l border-primary/30">
                  {faq.answer}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <footer className="mt-14 flex flex-wrap items-center gap-6 border-t pt-10 text-sm text-muted-foreground">
        <span>Prefer human voice?</span>
        <Button variant="outline" size="lg" className="rounded-full" disabled>
          Book concierge briefing (soon)
        </Button>
      </footer>
    </>
  )
}
