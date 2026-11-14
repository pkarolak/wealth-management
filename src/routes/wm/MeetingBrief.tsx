import { ArrowLeft, ArrowRight, Check, ClipboardList, MessageCircle, Plus, Printer, Sparkles } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { GoalCard, NetWorthSummary } from '../../components/patterns'
import { Button, toast } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { moneyCompact, uid } from '../../lib/format'
import { scoreRisk } from '../../schema/risk'
import { meetingBrief, type Topic, type TopicTag } from '../../services/ai'
import { useStore } from '../../store/caseStore'
import { useCase } from '../../store/hooks'
import { cifProgress, deferredLabels, netWorth, roughItems } from '../../store/selectors'
import type { AgendaItem } from '../../store/types'
import { AgendaEditor } from './AgendaEditor'
import { PageHeader } from './WMLayout'

const tagTone: Record<TopicTag, string> = {
  Planning: 'bg-ink text-white',
  'Open question': 'bg-advisor-soft text-advisor',
  'To collect': 'bg-progress-soft text-progress-ink',
  'To verify': 'bg-ai-soft text-ai',
}

export function MeetingBrief() {
  const { caseId } = useParams()
  const c = useCase(caseId)
  const setAgenda = useStore((s) => s.setAgenda)
  const addRequest = useStore((s) => s.addRequest)
  const navigate = useNavigate()
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
          <section className="flex flex-col gap-6 rounded-[26px] bg-surface p-6">
            <span className="inline-flex items-center gap-1.5 text-[13px] text-ai">
              <Sparkles className="size-3.5" /> Drafted from {c.firstName}’s answers, documents and questions
            </span>
            <p className="display max-w-3xl text-[30px] leading-[1.15] text-ink">{brief.headline}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Fact label={rough ? 'Known net worth' : 'Net worth'} value={hasBalances ? moneyCompact(totals.total) : 'Waiting on accounts'} muted={!hasBalances} />
              <Fact label="Liquid" value={hasBalances ? moneyCompact(totals.liquid) : '—'} muted={!hasBalances} />
              <Fact label="Risk profile" value={risk?.label ?? 'Not answered'} muted={!risk} />
              <Fact label="Nearest goal" value={nearest ? `${nearest.title.split(' ').slice(0, 3).join(' ')} · ${nearest.targetYear}` : '—'} muted={!nearest} />
            </div>
          </section>

          {(before.length > 0 || acctLeft > 0) && (
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-[20px] font-medium text-ink">Before the meeting</h2>
                <span className="text-[14px] text-ink-3">Close these first, so the meeting can be about strategy.</span>
              </div>
              <div className="flex flex-col divide-y divide-line rounded-[22px] bg-surface px-5">
                {acctLeft > 0 && (
                  <BeforeRow tag="To collect" title={`${acctLeft} ${acctLeft === 1 ? 'answer' : 'answers'} still needed to open accounts`} why={acct.open.slice(0, 4).map((r) => r.def.label).join(', ') + (acct.open.length > 4 ? '…' : '')} action="Open CIF" icon={<ClipboardList className="size-4" />} onClick={() => navigate(`/wm/c/${c.id}/cif`)} />
                )}
                {before.map((t) => (
                  <BeforeRow
                    key={t.id}
                    tag={t.tag}
                    title={t.title}
                    why={t.why}
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

          <section className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[20px] font-medium text-ink">In the meeting</h2>
              <span className="text-[13px] text-ink-4">{during.length} strategy {during.length === 1 ? 'topic' : 'topics'} · add the ones you want to cover</span>
            </div>
            {during.map((t) => (
              <TopicCard key={t.id} t={t} compact={t.priority !== 'high'} on={onAgenda.has(t.id)} onToggle={() => toggleTopic(t)} />
            ))}
            {!during.length && <p className="text-[14px] text-ink-4">Nothing stands out yet. Strategy topics appear as {c.firstName} adds goals and accounts.</p>}
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-[20px] font-medium text-ink">Where the money is</h2>
            <NetWorthSummary totals={totals} items={c.items} breakdownOnly />
            {c.goals.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-3">
                {c.goals.map((g) => (
                  <GoalCard key={g.id} goal={g} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <AgendaEditor c={c} items={agenda} onChange={(items) => setAgenda(c.id, items)} />
        </aside>
      </div>
    </div>
  )
}

function Fact({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[14px] bg-muted/60 px-3.5 py-3">
      <span className="text-[12px] text-ink-3">{label}</span>
      <span className={cn('truncate text-[16px]', muted ? 'text-ink-4' : 'text-ink')}>{value}</span>
    </div>
  )
}

function TopicCard({ t, on, onToggle, compact }: { t: Topic; on: boolean; onToggle: () => void; compact?: boolean }) {
  return (
    <article className={cn('flex flex-col gap-4 rounded-[22px] bg-surface p-5', !compact && 'shadow-soft')}>
      <div className="flex items-center gap-2">
        <span className={cn('rounded-full px-2.5 py-1 text-[11px] leading-none', tagTone[t.tag])}>{t.tag}</span>
        {t.priority === 'high' && <span className="text-[12px] text-ink-3">High impact</span>}
        <span className="ml-auto text-[12px] text-ink-4 tabular">~{t.minutes} min</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className={cn('text-ink', compact ? 'text-[16px]' : 'text-[19px]')}>{t.title}</h3>
        <p className="text-[14px] leading-relaxed text-ink-3">{t.why}</p>
      </div>
      <div className={cn('mt-auto flex gap-3', compact ? 'flex-col items-stretch [&>button]:self-end' : 'flex-wrap items-end')}>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="flex gap-2 rounded-[14px] bg-muted/70 px-3 py-2.5 text-[13px] leading-relaxed text-ink-2">
            <MessageCircle className="mt-[3px] size-3.5 shrink-0 text-ink-3" />
            <span>“{t.ask}”</span>
          </p>
          {t.note && <p className="px-1 text-[12px] leading-relaxed text-ink-3">Note: {t.note}</p>}
        </div>
        <Button size="md" variant={on ? 'ghost' : 'secondary'} leading={on ? <Check className="size-4" /> : <Plus className="size-4" />} onClick={onToggle}>
          {on ? 'On agenda' : 'Add to agenda'}
        </Button>
      </div>
    </article>
  )
}

function BeforeRow({ tag, title, why, action, icon, onClick }: { tag: TopicTag; title: string; why: string; action: string; icon?: React.ReactNode; onClick: () => void }) {
  return (
    <div className="flex items-center gap-4 py-4">
      <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] leading-none', tagTone[tag])}>{tag}</span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[15px] text-ink">{title}</span>
        <span className="truncate text-[13px] text-ink-3">{why}</span>
      </div>
      <Button size="md" variant="secondary" leading={icon} trailing={icon ? undefined : <ArrowRight className="size-4" />} onClick={onClick}>
        {action}
      </Button>
    </div>
  )
}
