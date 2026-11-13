import { ArrowLeft, Check, MessageCircle, Plus, Printer, Sparkles } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { GoalCard, NetWorthSummary } from '../../components/patterns'
import { Button } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { moneyCompact, uid } from '../../lib/format'
import { scoreRisk } from '../../schema/risk'
import { meetingBrief, type Topic, type TopicTag } from '../../services/ai'
import { useStore } from '../../store/caseStore'
import { useCase } from '../../store/hooks'
import { deferredLabels, netWorth, roughItems } from '../../store/selectors'
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
  const high = brief.topics.filter((t) => t.priority === 'high')
  const rest = brief.topics.filter((t) => t.priority !== 'high')

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
              <Fact label="Net worth" value={moneyCompact(totals.total)} />
              <Fact label="Liquid" value={moneyCompact(totals.liquid)} />
              <Fact label="Risk profile" value={risk?.label ?? 'Not answered'} muted={!risk} />
              <Fact label="Nearest goal" value={nearest ? `${nearest.title.split(' ').slice(0, 3).join(' ')} · ${nearest.targetYear}` : '—'} muted={!nearest} />
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[20px] font-medium text-ink">Worth discussing</h2>
              <span className="text-[13px] text-ink-4">{brief.topics.length} topics · add the ones you want to cover</span>
            </div>
            {high.map((t) => (
              <TopicCard key={t.id} t={t} on={onAgenda.has(t.id)} onToggle={() => toggleTopic(t)} />
            ))}
            {rest.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2">
                {rest.map((t) => (
                  <TopicCard key={t.id} t={t} compact on={onAgenda.has(t.id)} onToggle={() => toggleTopic(t)} />
                ))}
              </div>
            )}
            {!brief.topics.length && <p className="text-[14px] text-ink-4">Nothing stands out yet. The brief fills in as {c.firstName} answers.</p>}
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-[20px] font-medium text-ink">Snapshot</h2>
            <NetWorthSummary totals={totals} items={c.items} />
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
        <p className="flex min-w-0 flex-1 gap-2 rounded-[14px] bg-muted/70 px-3 py-2.5 text-[13px] leading-relaxed text-ink-2">
          <MessageCircle className="mt-[3px] size-3.5 shrink-0 text-ink-4" />
          <span>{t.ask}</span>
        </p>
        <Button size="md" variant={on ? 'ghost' : 'secondary'} leading={on ? <Check className="size-4" /> : <Plus className="size-4" />} onClick={onToggle}>
          {on ? 'On agenda' : 'Add to agenda'}
        </Button>
      </div>
    </article>
  )
}
