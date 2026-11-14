import { ArrowLeft, ArrowRight, Check, ChevronRight, Plus, Printer } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { GoalCard, NetWorthSummary } from '../../components/patterns'
import { Button, toast } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { moneyCompact, uid } from '../../lib/format'
import { scoreRisk } from '../../schema/risk'
import { meetingBrief, type Topic } from '../../services/ai'
import { useStore } from '../../store/caseStore'
import { useCase } from '../../store/hooks'
import { cifProgress, deferredLabels, netWorth, roughItems } from '../../store/selectors'
import type { AgendaItem } from '../../store/types'
import { AgendaEditor } from './AgendaEditor'
import { PageHeader } from './WMLayout'

export function MeetingBrief() {
  const { caseId } = useParams()
  const c = useCase(caseId)
  const setAgenda = useStore((s) => s.setAgenda)
  const addRequest = useStore((s) => s.addRequest)
  const navigate = useNavigate()
  const [openTopic, setOpenTopic] = useState<string | null>(null)
  if (!c) return <Navigate to="/wm" replace />
  const totals = netWorth(c)
  const risk = scoreRisk(c.risk)
  const brief = meetingBrief(c, totals, deferredLabels(c), roughItems(c), risk ?? undefined)
  const agenda: AgendaItem[] = c.agenda?.items ?? brief.suggestedAgenda.map((a) => ({ id: uid('ag'), ...a }))
  const onAgenda = new Set(agenda.map((a) => a.topicId).filter(Boolean))
  const toggleTopic = (t: Topic) =>
    setAgenda(c.id, onAgenda.has(t.id) ? agenda.filter((a) => a.topicId !== t.id) : [...agenda, { id: uid('ag'), title: t.title, minutes: t.minutes, topicId: t.id }])
  const nearest = [...c.goals].filter((g) => g.targetYear).sort((a, b) => (a.targetYear ?? 0) - (b.targetYear ?? 0))[0]
  const before = brief.topics.filter((t) => t.tag !== 'Planning')
  const during = brief.topics.filter((t) => t.tag === 'Planning')
  const acct = cifProgress(c).accounts
  const acctLeft = acct.total - acct.done
  const rough = roughItems(c).length > 0
  const hasBalances = c.items.some((i) => i.value !== undefined)

  return (
    <div className="pb-20">
      <PageHeader
        eyebrow={
          <button type="button" onClick={() => navigate(`/wm/c/${c.id}`)} className="inline-flex items-center gap-1.5 hover:text-ink">
            <ArrowLeft className="size-3.5" /> {c.firstName} {c.lastName}
          </button>
        }
        title="Meeting brief"
        actions={
          <Button variant="secondary" leading={<Printer className="size-4" />} onClick={() => window.print()}>
            Print
          </Button>
        }
      />

      <div className="grid gap-6 px-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-10">
          <section className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] bg-line sm:grid-cols-4">
            <Fact label={rough ? 'Known net worth' : 'Net worth'} value={hasBalances ? moneyCompact(totals.total) : '—'} muted={!hasBalances} />
            <Fact label="Liquid" value={hasBalances ? moneyCompact(totals.liquid) : '—'} muted={!hasBalances} />
            <Fact label="Risk profile" value={risk?.label ?? 'Not answered'} muted={!risk} />
            <Fact label="Nearest goal" value={nearest ? `${nearest.title.split(' ').slice(0, 3).join(' ')} · ${nearest.targetYear}` : '—'} muted={!nearest} />
          </section>
          {brief.headline && <p className="-mt-6 text-[14px] text-ink-3">{brief.headline}</p>}

          {(before.length > 0 || acctLeft > 0) && (
            <section className="flex flex-col gap-3">
              <SectionHead title="Before the meeting" count={before.length + (acctLeft > 0 ? 1 : 0)} />
              <div className="flex flex-col divide-y divide-line rounded-[22px] bg-surface px-5">
                {acctLeft > 0 && (
                  <Row title={`${acctLeft} ${acctLeft === 1 ? 'answer' : 'answers'} left to open accounts`} meta={shortList(acct.open.map((r) => r.def.label))} action="Open CIF" onClick={() => navigate(`/wm/c/${c.id}/cif`)} />
                )}
                {before.map((t) => (
                  <Row
                    key={t.id}
                    title={t.title}
                    meta={t.why}
                    action={t.tag === 'Open question' ? 'Reply' : t.tag === 'To verify' ? 'Ask for statements' : `Remind ${c.firstName}`}
                    onClick={() => {
                      if (t.tag === 'Open question') return navigate(`/wm/c/${c.id}?thread=${t.id.replace('thread-', '')}`)
                      addRequest(c.id, { kind: t.tag === 'To verify' ? 'document' : 'answer', title: t.title, detail: t.why, sectionId: t.tag === 'To verify' ? 'networth' : undefined }, c.advisorId)
                      toast('Request sent', { description: `${c.firstName} sees it in the form and by email.`, tone: 'success' })
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <SectionHead title="In the meeting" count={during.length} />
            {during.length > 0 ? (
              <div className="flex flex-col divide-y divide-line rounded-[22px] bg-surface px-5">
                {during.map((t) => (
                  <TopicRow key={t.id} t={t} open={openTopic === t.id} onOpen={() => setOpenTopic(openTopic === t.id ? null : t.id)} on={onAgenda.has(t.id)} onToggle={() => toggleTopic(t)} />
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-ink-4">Nothing yet. Topics appear as {c.firstName} adds goals and accounts.</p>
            )}
          </section>

          {(hasBalances || c.goals.length > 0) && (
          <section className="flex flex-col gap-3">
            <SectionHead title="Where the money is" />
            {hasBalances && <NetWorthSummary totals={totals} items={c.items} breakdownOnly />}
            {c.goals.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-3">
                {c.goals.map((g) => (
                  <GoalCard key={g.id} goal={g} />
                ))}
              </div>
            )}
          </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <AgendaEditor c={c} items={agenda} onChange={(items) => setAgenda(c.id, items)} />
        </aside>
      </div>
    </div>
  )
}

function shortList(labels: string[]) {
  const short = labels.filter((l) => l.length <= 32)
  const shown = short.slice(0, 3)
  const rest = labels.length - shown.length
  return shown.join(', ') + (rest > 0 ? `${shown.length ? ' and ' : ''}${rest} more` : '')
}

function SectionHead({ title, count }: { title: string; count?: number }) {
  return (
    <h2 className="flex items-baseline gap-2 text-[17px] font-medium text-ink">
      {title}
      {count !== undefined && count > 0 && <span className="text-[14px] font-normal text-ink-4 tabular">{count}</span>}
    </h2>
  )
}

function Fact({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 bg-surface px-5 py-4">
      <span className="text-[12px] text-ink-3">{label}</span>
      <span className={cn('display truncate text-[22px] leading-tight', muted ? 'text-ink-4' : 'text-ink')}>{value}</span>
    </div>
  )
}

function TopicRow({ t, open, onOpen, on, onToggle }: { t: Topic; open: boolean; onOpen: () => void; on: boolean; onToggle: () => void }) {
  return (
    <div className="py-3.5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onOpen} aria-expanded={open} className="group flex min-w-0 flex-1 items-center gap-3 text-left">
          <ChevronRight className={cn('size-4 shrink-0 text-ink-4 transition-transform group-hover:text-ink-2', open && 'rotate-90')} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[15px] text-ink">{t.title}</span>
            <span className="truncate text-[13px] text-ink-3">{t.why}</span>
          </span>
        </button>
        <span className="shrink-0 text-[13px] text-ink-4 tabular">{t.minutes} min</span>
        <Button size="sm" variant={on ? 'ghost' : 'secondary'} leading={on ? <Check className="size-3.5" /> : <Plus className="size-3.5" />} onClick={onToggle} className="w-[104px]">
          {on ? 'On agenda' : 'Add'}
        </Button>
      </div>
      {open && (
        <dl className="mt-3 ml-7 grid grid-cols-[48px_1fr] gap-x-3 gap-y-2 text-[13px] leading-relaxed">
          <dt className="text-ink-4">Ask</dt>
          <dd className="text-ink-2">“{t.ask}”</dd>
          {t.note && (
            <>
              <dt className="text-ink-4">Note</dt>
              <dd className="text-ink-3">{t.note}</dd>
            </>
          )}
        </dl>
      )}
    </div>
  )
}

function Row({ title, meta, action, onClick }: { title: string; meta: string; action: string; onClick: () => void }) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[15px] text-ink">{title}</span>
        <span className="truncate text-[13px] text-ink-3">{meta}</span>
      </div>
      <Button size="sm" variant="secondary" trailing={<ArrowRight className="size-3.5" />} onClick={onClick}>
        {action}
      </Button>
    </div>
  )
}
