import { AlertCircle, CalendarClock, PenLine } from 'lucide-react'
import { useState } from 'react'
import { Button, Checkbox, Input, StatusIcon } from '../../components/primitives'
import { money } from '../../lib/format'
import { displayValue, fieldsFor, isFilled, isVisible, type SectionDef } from '../../schema/onboarding'
import { scoreRisk } from '../../schema/risk'
import { useStore } from '../../store/caseStore'
import { caseValues, deferredLabels, netWorth, sectionState, sectionStats, visibleSections } from '../../store/selectors'
import type { ClientCase } from '../../store/types'
import type { Step, StepNav } from './ClientApp'
import { StepHeader } from './StepChrome'

function Summary({ c, s }: { c: ClientCase; s: SectionDef }) {
  const values = caseValues(c)
  if (s.kind === 'goals') return <span>{c.goals.map((g) => g.title).join(' · ') || 'No goals yet'}</span>
  if (s.kind === 'networth') {
    const t = netWorth(c)
    return <span>Net worth {money(t.total)} · {c.items.length} items</span>
  }
  if (s.kind === 'risk') return <span>{scoreRisk(c.risk)?.label ?? 'Not answered'}</span>
  const rows = fieldsFor(s.id)
    .filter((f) => isVisible(f, values) && isFilled(values[f.id]) && f.type !== 'checkbox')
    .slice(0, 6)
  if (!rows.length) return <span className="text-ink-4">Nothing answered yet</span>
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
      {rows.map((f) => (
        <div key={f.id} className="flex min-w-0 gap-2">
          <dt className="shrink-0 text-ink-4">{f.label}</dt>
          <dd className="truncate text-ink-2">{displayValue(f, values[f.id])}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ReviewStep({ c, nav }: { c: ClientCase; nav: StepNav }) {
  const submit = useStore((s) => s.submit)
  const advisor = useStore((s) => s.people[c.advisorId])
  const [sig, setSig] = useState(c.signature ?? '')
  const [accurate, setAccurate] = useState(!!c.signature)
  const [docs, setDocs] = useState(!!c.signature)
  const secs = visibleSections(c).filter((s) => s.kind !== 'review')
  const deferred = deferredLabels(c)
  const pending = secs.reduce((a, s) => a + sectionStats(c, s.id).suggestions, 0)
  const missing = secs.reduce((a, s) => {
    const st = sectionStats(c, s.id)
    return a + (st.required - st.requiredFilled)
  }, 0)
  const first = advisor.name.split(' ')[0]

  return (
    <div>
      <StepHeader c={c} sectionId="review" />

      {(pending > 0 || missing > 0) && (
        <div className="mb-6 flex items-start gap-3 rounded-[18px] bg-progress-soft p-4 text-[14px] text-ink-2">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-progress-ink" />
          <span>
            {pending > 0 && `${pending} drafted answers still need your OK. `}
            {missing > 0 && `${missing} required answers are empty. `}
            You can still sign; {first} will go through them with you.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {secs.map((s) => (
          <div key={s.id} className="flex gap-4 rounded-[22px] bg-surface p-5">
            <StatusIcon status={sectionState(c, s.id) === 'done' ? 'done' : sectionState(c, s.id) === 'progress' ? 'progress' : 'idle'} />
            <div className="flex min-w-0 flex-1 flex-col gap-2 text-[14px]">
              <span className="text-[15px] font-medium text-ink">{s.title}</span>
              <Summary c={c} s={s} />
            </div>
            <button type="button" onClick={() => nav.go(s.id as Step)} className="inline-flex h-8 items-center gap-1.5 self-start rounded-control px-2.5 text-[13px] text-ink-3 hover:bg-muted hover:text-ink">
              <PenLine className="size-3.5" /> Edit
            </button>
          </div>
        ))}
      </div>

      {deferred.length > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-[18px] border border-dashed border-line-strong p-4 text-[14px] text-ink-3">
          <CalendarClock className="mt-0.5 size-4 shrink-0" />
          <span>
            For the meeting with {first}: <span className="text-ink-2">{deferred.join(', ')}</span>
          </span>
        </div>
      )}

      <section className="mt-10 flex flex-col gap-4 border-t border-line pt-8">
        <h2 className="text-[17px] text-ink">Sign</h2>
        <Checkbox checked={accurate} onChange={setAccurate} label="The information I’ve provided is accurate to the best of my knowledge." />
        <Checkbox checked={docs} onChange={setDocs} label="I’ve received the firm’s Form CRS and Form ADV Part 2." description="Sent with your invite. You can download them again anytime." />
        <Input label="Type your full legal name" value={sig} onChange={(e) => setSig(e.target.value)} className="max-w-md" />
        {sig && <span className="font-serif text-[30px] text-ink italic">{sig}</span>}
        <div className="mt-4 flex items-center gap-3">
          <Button variant="ghost" size="lg" onClick={nav.back}>
            Back
          </Button>
          <Button
            size="lg"
            className="ml-auto"
            disabled={!sig.trim() || !accurate || !docs}
            onClick={() => {
              submit(c.id, sig.trim())
              nav.go('done')
            }}
          >
            Sign and send to {first}
          </Button>
        </div>
      </section>
    </div>
  )
}
