import { ArrowRight, Download, EyeOff, Lock, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Button, Checkbox, toast } from '../../components/primitives'
import { useStore } from '../../store/caseStore'
import type { ClientCase } from '../../store/types'
import type { StepNav } from './ClientApp'
import { StepHeader } from './StepChrome'

const docs = ['Privacy notice', 'Form CRS', 'Form ADV Part 2A & 2B']

/** Explicit, informed agreement before anything personal is collected. Not the advisory agreement. */
export function Consent({ c, nav }: { c: ClientCase; nav: StepNav }) {
  const advisor = useStore((s) => s.people[c.advisorId])
  const giveConsent = useStore((s) => s.giveConsent)
  const first = advisor.name.split(' ')[0]
  const [agreed, setAgreed] = useState(!!c.consentAt)

  return (
    <div>
      <StepHeader eyebrow="Before you start" title="How we use your information" description={`${first} uses what you share to prepare for your first meeting. This isn’t an agreement to work together; that comes later, if you decide to go ahead.`} />

      <div className="flex flex-col gap-5 rounded-[28px] bg-surface p-6">
        <ul className="grid gap-5 sm:grid-cols-3">
          {[
            { icon: EyeOff, text: `Only ${first} and our operations team see it. We never sell it.` },
            { icon: Lock, text: 'It’s encrypted, and linked accounts are read-only.' },
            { icon: SlidersHorizontal, text: 'You can skip any question, or ask us to delete everything.' },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex flex-col gap-3">
              <span className="flex size-9 items-center justify-center rounded-[11px] bg-muted text-ink-2">
                <Icon className="size-4" />
              </span>
              <span className="text-[14px] leading-snug text-ink-2">{text}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col border-t border-line pt-4">
          <span className="pb-1 text-[13px] text-ink-4">Documents we’ll ask you to sign</span>
          {docs.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toast(`${d} downloaded`, { tone: 'success' })}
              className="group -mx-2 flex items-center gap-3 rounded-[12px] px-2 py-2 text-left text-[14px] text-ink transition-colors hover:bg-muted/70"
            >
              <span className="flex-1">{d}</span>
              <Download className="size-4 text-ink-4 group-hover:text-ink" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <Checkbox checked={agreed} onChange={setAgreed} label="I agree to share my information with Parker & Lane Wealth and have received the documents above." />
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
