import { ArrowRight, Download, Eye, Lock, Share2, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button, Checkbox, toast } from '../../components/primitives'
import { useStore } from '../../store/caseStore'
import type { ClientCase } from '../../store/types'
import type { StepNav } from './ClientApp'
import { StepHeader } from './StepChrome'

const docs = [
  { name: 'Privacy notice', hint: 'How we collect, use and protect your information' },
  { name: 'Form CRS', hint: 'Our services, fees and conflicts, in plain language' },
  { name: 'Form ADV Part 2A & 2B', hint: 'Our firm brochure, and a supplement about your Wealth Manager' },
]

function Point({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-muted text-ink-2">{icon}</span>
      <div className="flex flex-col gap-0.5 pt-0.5">
        <span className="text-[15px] text-ink">{title}</span>
        <span className="text-[14px] leading-snug text-ink-3">{children}</span>
      </div>
    </li>
  )
}

/** Explicit, informed agreement before anything personal is collected. Not the advisory agreement. */
export function Consent({ c, nav }: { c: ClientCase; nav: StepNav }) {
  const advisor = useStore((s) => s.people[c.advisorId])
  const giveConsent = useStore((s) => s.giveConsent)
  const first = advisor.name.split(' ')[0]
  const [agreed, setAgreed] = useState(!!c.consentAt)

  return (
    <div>
      <StepHeader eyebrow="Before you start" title="Your information, your say." description={`What you share here helps ${first} prepare for your first planning meeting. You’re not signing up for anything yet — your advisory agreement comes after you’ve met.`} />

      <div className="flex flex-col gap-6 rounded-[28px] bg-surface p-6">
        <ul className="grid gap-5 sm:grid-cols-2">
          <Point icon={<Eye className="size-4" />} title="Who sees it">
            {first} and Parker & Lane’s operations team. Never sold, never used for marketing.
          </Point>
          <Point icon={<Lock className="size-4" />} title="How it’s protected">
            Encrypted in transit and at rest. Your SSN is never shown in full.
          </Point>
          <Point icon={<Share2 className="size-4" />} title="Services we use">
            If you link an account or upload a statement, a secure provider reads it for us. You’ll see who before you connect.
          </Point>
          <Point icon={<Trash2 className="size-4" />} title="You stay in control">
            Skip anything, change answers any time, or ask {first} to delete it all if you decide not to go ahead.
          </Point>
        </ul>

        <div className="flex flex-col gap-1 border-t border-line pt-5">
          <span className="pb-1 text-[13px] text-ink-4">Sent with your invite — download them again here</span>
          {docs.map((d) => (
            <button
              key={d.name}
              type="button"
              onClick={() => toast(`${d.name} downloaded`, { tone: 'success' })}
              className="group -mx-2 flex items-center gap-3 rounded-[12px] px-2 py-2 text-left transition-colors hover:bg-muted/70"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[14px] text-ink">{d.name}</span>
                <span className="truncate text-[13px] text-ink-4">{d.hint}</span>
              </span>
              <Download className="size-4 text-ink-4 group-hover:text-ink" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <Checkbox checked={agreed} onChange={setAgreed} label={`I agree to share my information with Parker & Lane Wealth to prepare for my meeting with ${first}, and I’ve received the privacy notice, Form CRS and Form ADV Part 2.`} />
        <div className="flex items-center gap-3 border-t border-line pt-6">
          <Button variant="ghost" size="lg" onClick={nav.back}>
            Back
          </Button>
          <Button
            size="lg"
            className="ml-auto"
            disabled={!agreed}
            trailing={<ArrowRight className="size-4" />}
            onClick={() => {
              giveConsent(c.id)
              nav.next()
            }}
          >
            Agree and continue
          </Button>
        </div>
      </div>
    </div>
  )
}
