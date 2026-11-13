import { AlertCircle, CalendarClock, FileUp, PenLine } from 'lucide-react'
import { useState } from 'react'
import { Button, Checkbox, Input, StatusIcon } from '../../components/primitives'
import { money } from '../../lib/format'
import { withBullets } from '../../lib/masked'
import { displayValue, fieldsFor, isFilled, isVisible, summaryLabel, type SectionDef } from '../../schema/onboarding'
import { scoreRisk } from '../../schema/risk'
import { useStore } from '../../store/caseStore'
import { caseValues, deferredLabels, netWorth, sectionState, sectionStats, visibleSections } from '../../store/selectors'
import type { ClientCase } from '../../store/types'
import type { Step, StepNav } from './ClientApp'
import { StepHeader } from './StepChrome'

const MAX_ROWS = 6

function Rows({ rows, more }: { rows: [string, string][]; more?: number }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
      {rows.map(([label, value]) => (
        <div key={label} className="flex min-w-0 flex-col gap-0.5">
          <dt className="truncate text-[12px] text-ink-4">{label}</dt>
          <dd className="truncate text-[14px] text-ink-2">{withBullets(value)}</dd>
        </div>
      ))}
      {more !== undefined && more > 0 && (
        <div className="flex flex-col justify-end">
          <span className="text-[13px] text-ink-4">+{more} more</span>
        </div>
      )}
    </dl>
  )
}

function Summary({ c, s }: { c: ClientCase; s: SectionDef }) {
  const values = caseValues(c)
  const empty = (text: string) => <span className="text-[14px] text-ink-4">{text}</span>
  if (s.kind === 'goals') {
    const goals = c.goals.filter((g) => !g.draft)
    if (!goals.length) return empty('No goals yet')
    return <Rows rows={goals.slice(0, MAX_ROWS).map((g) => [g.title, [g.amount ? money(g.amount) : null, g.targetYear].filter(Boolean).join(' · ') || '—'] as [string, string])} more={goals.length - MAX_ROWS} />
  }
  if (s.kind === 'networth') {
    const t = netWorth(c)
    if (!c.items.length) return empty('Nothing added yet')
    return <Rows rows={[['Net worth', money(t.total)], ['Assets', money(t.assets)], ['Debts', money(t.liabilities)]]} />
  }
  if (s.kind === 'risk') {
    const r = scoreRisk(c.risk)
    return r ? <Rows rows={[['Your profile', r.label]]} /> : empty('Not answered yet')
  }
  const filled = fieldsFor(s.id).filter((f) => isVisible(f, values) && isFilled(values[f.id]) && f.type !== 'checkbox')
  if (!filled.length) return empty(s.optional ? 'Skipped — optional' : 'Nothing answered yet')
  return (
    <Rows
      rows={filled.slice(0, MAX_ROWS).map((f) => [summaryLabel(f), displayValue(f, values[f.id])] as [string, string])}
      more={filled.length - MAX_ROWS}
    />
  )
}

export function ReviewStep({ c, nav }: { c: ClientCase; nav: StepNav }) {
  const submit = useStore((s) => s.submit)
  const advisor = useStore((s) => s.people[c.advisorId])
  const [sig, setSig] = useState(c.signature ?? '')
  const legalName = [c.fields.firstName?.value ?? c.firstName, c.fields.lastName?.value ?? c.lastName].join(' ')
  const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').split(/\s+/).filter(Boolean)
  const typed = norm(sig)
  const nameOk = typed.length > 1 && typed[0] === norm(String(c.fields.firstName?.value ?? c.firstName))[0] && typed.at(-1) === norm(String(c.fields.lastName?.value ?? c.lastName)).at(-1)
  const [accurate, setAccurate] = useState(!!c.signature)
  const secs = visibleSections(c).filter((s) => s.kind !== 'review')
  const deferred = deferredLabels(c)
  const pending = secs.reduce((a, s) => a + sectionStats(c, s.id).suggestions, 0)
  const missing = secs.reduce((a, s) => {
    const st = sectionStats(c, s.id)
    return a + (st.required - st.requiredFilled)
  }, 0)
  const first = advisor.name.split(' ')[0]
  const openRequests = c.requests.filter((r) => r.status === 'open').length

  return (
    <div>
      <StepHeader c={c} sectionId="review" />

      {openRequests > 0 && (
        <button
          type="button"
          onClick={() => nav.go('requests')}
          className="mb-2 flex w-full items-center gap-3 rounded-[18px] bg-advisor-soft/70 p-4 text-left text-[14px] text-ink-2 transition-colors hover:bg-advisor-soft"
        >
          <FileUp className="size-4 shrink-0 text-advisor" />
          <span className="flex-1">
            {first} is waiting on {openRequests} {openRequests === 1 ? 'request' : 'requests'}.
          </span>
          <span className="text-[13px] text-advisor">Open</span>
        </button>
      )}

      {(pending > 0 || missing > 0) && (
        <div className="mb-6 flex items-start gap-3 rounded-[18px] bg-progress-soft p-4 text-[14px] text-ink-2">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-progress-ink" />
          <span>
            {[pending > 0 && `${pending} ${pending === 1 ? 'answer' : 'answers'} to check`, missing > 0 && `${missing} missing`].filter(Boolean).join(', ')}. You can still send — {first} will go through them with you.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {secs.map((s) => {
          const st = sectionStats(c, s.id)
          const state = sectionState(c, s.id)
          const open = [
            st.suggestions > 0 && `${st.suggestions} to check`,
            st.required - st.requiredFilled > 0 && `${st.required - st.requiredFilled} missing`,
          ].filter(Boolean)
          return (
            <div key={s.id} className="flex flex-col gap-4 rounded-[22px] bg-surface p-2 pb-5">
              <div className="flex h-10 items-center gap-3 pl-3">
                <StatusIcon status={state === 'done' ? 'done' : state === 'progress' ? 'progress' : 'idle'} />
                <span className="min-w-0 truncate text-[15px] font-medium text-ink">{s.title}</span>
                {open.length > 0 && <span className="text-[13px] whitespace-nowrap text-progress-ink">{open.join(' · ')}</span>}
                <button
                  type="button"
                  onClick={() => nav.go(s.id as Step)}
                  className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-[14px] px-3 text-[13px] text-ink-3 transition-colors hover:bg-muted hover:text-ink"
                >
                  <PenLine className="size-3.5" /> Edit
                </button>
              </div>
              <div className="pr-3 pl-11">
                <Summary c={c} s={s} />
              </div>
            </div>
          )
        })}
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
        <div className="flex flex-col gap-1">
          <h2 className="text-[17px] text-ink">Confirm and send</h2>
          <p className="text-[14px] text-ink-3">{first} and her team use this to open your accounts and prepare your plan. You can still change answers after sending.</p>
        </div>
        <Checkbox checked={accurate} onChange={setAccurate} label="The information I’ve provided is accurate to the best of my knowledge." />
        <div className="flex max-w-md flex-col gap-1.5">
          <Input label="Type your full name to confirm" value={sig} tone={sig.trim() && !nameOk ? 'error' : 'default'} onChange={(e) => setSig(e.target.value)} />
          {sig.trim().split(/\s+/).length > 1 && !nameOk && <span className="pl-1 text-[13px] text-danger">Use the name on your account: {legalName}.</span>}
        </div>
        {sig && <span className="font-serif text-[30px] text-ink italic">{sig}</span>}
        <div className="mt-4 flex items-center gap-3">
          <Button variant="ghost" size="lg" onClick={nav.back}>
            Back
          </Button>
          <Button
            size="lg"
            className="ml-auto"
            disabled={!nameOk || !accurate}
            onClick={() => {
              submit(c.id, sig.trim())
              nav.go('done')
            }}
          >
            Confirm and send to {first}
          </Button>
        </div>
      </section>
    </div>
  )
}
