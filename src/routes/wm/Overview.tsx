import { ArrowRight, BellRing, CalendarClock, Check, FileText, MessageCircle, PencilLine, Plus, Send } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { Avatar, Badge, Button, Card, CardHeader, CountDot, ProgressBar, toast } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { money, moneyCompact, relativeTime } from '../../lib/format'
import { useStore } from '../../store/caseStore'
import { useNow } from '../../store/hooks'
import { ADVISOR_ID, pipeline, pipelineCounts } from '../../store/seed'
import { overallProgress, pendingReview, realCases, sectionState, sectionStats, unreadCount, visibleSections } from '../../store/selectors'
import type { ClientCase, Stage } from '../../store/types'
import { color } from '../../tokens/tokens'
import { PageHeader } from './WMLayout'

const stageLabel: Record<Stage, string> = { invited: 'Link sent', in_progress: 'Filling in', submitted: 'Ready for meeting', onboarded: 'Onboarded' }
const stageTone = { invited: 'waiting', in_progress: 'progress', submitted: 'success', onboarded: 'neutral' } as const

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

/** Pipeline bars from the reference: each stage a solid bar with the count bottom-right. */
function PipelineBars({ live }: { live: number }) {
  const rows = [
    { label: 'Prospecting', value: pipelineCounts.Prospecting, bg: color.ink, fg: '#fff' },
    { label: 'Info gathering', value: pipelineCounts['Info gathering'] + live, bg: color.taupe700, fg: color.ink },
    { label: 'Proposals', value: pipelineCounts.Proposals, bg: color.taupe500, fg: color.ink },
    { label: 'Onboarded', value: pipelineCounts.Onboarded, bg: '#E3DED7', fg: color.ink },
  ]
  const max = Math.max(...rows.map((r) => r.value))
  return (
    <div className="flex flex-col gap-1">
      {rows.map((r) => (
        <div key={r.label} className="flex h-[52px] flex-col justify-between rounded-[6px] px-2 py-1.5 transition-[width] duration-700" style={{ width: `${(r.value / max) * 100}%`, background: r.bg, color: r.fg }}>
          <span className="text-[12px] opacity-90">{r.label}</span>
          <span className="tabular self-end text-[28px] leading-none">{r.value}</span>
        </div>
      ))}
    </div>
  )
}

function CaseRow({ c }: { c: ClientCase }) {
  const navigate = useNavigate()
  const p = overallProgress(c)
  const unread = unreadCount(c, ADVISOR_ID)
  const review = pendingReview(c).length
  const last = c.activity[0]
  return (
    <button type="button" onClick={() => navigate(`/wm/c/${c.id}`)} className="grid w-full grid-cols-[1fr_auto] items-center gap-4 rounded-[16px] p-3 text-left transition-colors hover:bg-muted md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
      <span className="flex min-w-0 items-center gap-3">
        <Avatar name={`${c.firstName} ${c.lastName}`} size="lg" />
        <span className="flex min-w-0 flex-col">
          <span className="flex items-center gap-2 text-[15px] text-ink">
            {c.firstName} {c.lastName}
            <CountDot count={unread + review} />
          </span>
          <span className="truncate text-[13px] text-ink-3">{last ? `${last.text} · ${relativeTime(last.ts)}` : 'Just created'}</span>
        </span>
      </span>
      <span className="hidden flex-col gap-1.5 md:flex">
        <span className="flex justify-between text-[12px] text-ink-4">
          <span>
            {p.done} of {p.sections} sections
          </span>
          <span>{Math.round(p.ratio * 100)}%</span>
        </span>
        <ProgressBar value={p.ratio * 100} />
      </span>
      <Badge tone={stageTone[c.stage]}>{stageLabel[c.stage]}</Badge>
    </button>
  )
}

type Todo = { id: string; c: ClientCase; icon: ReactNode; tone: keyof typeof toneClass; title: ReactNode; detail?: string; meta?: string; action: string; to?: string; onClick?: () => void }

const toneClass = { advisor: 'bg-advisor-soft text-advisor', progress: 'bg-progress-soft text-progress-ink', ai: 'bg-ai-soft text-ai', ink: 'bg-muted text-ink-2', waiting: 'bg-waiting-soft text-waiting' }

const meetingLabel = (at: number) =>
  `${new Date(at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}, ${new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`

function collectTodos(cases: ClientCase[]) {
  const mine: Todo[] = []
  const waiting: Todo[] = []
  for (const c of cases) {
    const base = `/wm/c/${c.id}`
    for (const t of c.threads.filter((t) => !t.resolved && t.messages.at(-1)?.authorId === c.clientId)) {
      const last = t.messages[t.messages.length - 1]
      mine.push({ id: `t-${t.id}`, c, icon: <MessageCircle className="size-4" />, tone: 'advisor', title: <>Reply to {c.firstName} on <span className="font-medium">{t.title}</span></>, detail: `“${last.body}”`, meta: relativeTime(last.ts), action: 'Reply', to: `${base}?thread=${t.id}` })
    }
    const changed = pendingReview(c).length
    if (changed) {
      const sec = visibleSections(c).find((s) => sectionStats(c, s.id).needsReview > 0)
      mine.push({ id: `nr-${c.id}`, c, icon: <PencilLine className="size-4" />, tone: 'progress', title: <>{c.firstName} changed {changed === 1 ? 'an answer' : `${changed} answers`} you confirmed</>, detail: sec?.wmTitle, action: 'Recheck', to: `${base}${sec ? `?section=${sec.id}` : ''}` })
    }
    const ready = visibleSections(c).filter((s) => s.kind !== 'review' && sectionState(c, s.id) === 'done' && !c.advisorReviewed[s.id])
    if (ready.length)
      mine.push({ id: `rv-${c.id}`, c, icon: <Check className="size-4" />, tone: 'ink', title: <>Review {c.firstName}’s {ready.length === 1 ? 'section' : `${ready.length} sections`}</>, detail: ready.map((s) => s.wmShort).join(', '), action: 'Review', to: `${base}?section=${ready[0].id}` })
    if (c.stage === 'submitted' && !c.agenda?.sharedAt)
      mine.unshift({ id: `b-${c.id}`, c, icon: <FileText className="size-4" />, tone: 'ai', title: <>{c.firstName} signed — <span className="font-medium">share the agenda</span></>, detail: c.meeting ? `Meeting ${meetingLabel(c.meeting.at)}` : 'No meeting booked yet', action: 'Open brief', to: `${base}/brief` })
    else if (c.meeting && c.meeting.at > Date.now())
      mine.push({ id: `m-${c.id}`, c, icon: <CalendarClock className="size-4" />, tone: 'ink', title: <>Meeting with {c.firstName}</>, detail: `${meetingLabel(c.meeting.at)} · ${c.meeting.mode === 'video' ? 'Video call' : 'At the office'}`, action: 'Brief', to: `${base}/brief` })

    for (const r of c.requests.filter((r) => r.status === 'open'))
      waiting.push({ id: `r-${r.id}`, c, icon: <BellRing className="size-4" />, tone: 'waiting', title: <>{r.title}</>, detail: `Asked ${c.firstName} ${relativeTime(r.createdAt)}`, action: 'Nudge', onClick: () => toast(`Reminder sent to ${c.firstName}`, { description: r.title, tone: 'success' }) })
    if (c.stage === 'invited')
      waiting.push({ id: `i-${c.id}`, c, icon: <Send className="size-4" />, tone: 'waiting', title: <>{c.firstName} hasn’t opened the link</>, detail: c.invitedAt ? `Sent ${relativeTime(c.invitedAt)}` : undefined, action: 'Resend', onClick: () => toast(`Link resent to ${c.firstName}`, { tone: 'success' }) })
  }
  return { mine, waiting }
}

function TodoRow({ t }: { t: Todo }) {
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => (t.to ? navigate(t.to) : t.onClick?.())} className="group flex w-full items-center gap-3 rounded-[18px] p-2 pr-3 text-left transition-colors hover:bg-muted/70">
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-[11px]', toneClass[t.tone])}>{t.icon}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[14px] text-ink">{t.title}</span>
        {t.detail && <span className="truncate text-[13px] text-ink-3">{t.detail}</span>}
      </span>
      {t.meta && <span className="shrink-0 text-[12px] text-ink-4">{t.meta}</span>}
      <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[13px] text-ink-3 ring-1 ring-line transition-colors ring-inset group-hover:bg-surface group-hover:text-ink group-hover:ring-line-strong">
        {t.action}
        {t.to && <ArrowRight className="size-3.5" />}
      </span>
    </button>
  )
}

/** Specific next steps across clients, each one click from where it gets done. */
function Attention({ cases }: { cases: ClientCase[] }) {
  const { mine, waiting } = collectTodos(cases)
  return (
    <Card padding="sm" inner={18} className="flex max-h-[420px] flex-col">
      <div className="flex items-baseline justify-between px-3 pt-2 pb-2">
        <h3 className="text-[15px] font-medium text-ink">Needs your attention</h3>
        <span className="text-[13px] text-ink-4">{mine.length ? `${mine.length} to do` : 'All caught up'}</span>
      </div>
      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        {mine.length ? (
          mine.map((t) => <TodoRow key={t.id} t={t} />)
        ) : (
          <p className="px-3 pb-3 text-[14px] text-ink-3">Nothing needs you right now.</p>
        )}
        {waiting.length > 0 && (
          <>
            <div className="px-3 pt-4 pb-1 text-[12px] text-ink-4">Waiting on clients</div>
            {waiting.map((t) => <TodoRow key={t.id} t={t} />)}
          </>
        )}
      </div>
    </Card>
  )
}

export function Overview() {
  useNow(15_000)
  const cases = useStore((s) => s.cases)
  const emily = useStore((s) => s.people[ADVISOR_ID])
  const live = useMemo(() => realCases(cases), [cases])

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        title={`${greeting()}, ${emily.name.split(' ')[0]}`}
        actions={
          <Link to="/wm/new">
            <Button size="lg" leading={<Plus className="size-4" />}>
              New client
            </Button>
          </Link>
        }
      />
      <div className="grid gap-4 px-10 lg:grid-cols-[1.5fr_1fr]">
        <Card padding="lg" inner={6}>
          <CardHeader title="Client pipeline by stage" />
          <PipelineBars live={live.length} />
        </Card>
        <Attention cases={live} />

        <Card padding="sm" inner={16} className="lg:col-span-2">
          <div className="flex items-center justify-between px-3 pt-2 pb-3">
            <h3 className="text-[15px] font-medium text-ink">Onboarding</h3>
            <span className="text-[13px] text-ink-4">{live.length ? `${live.length} active` : 'Add a client to send them a link'}</span>
          </div>
          {live.map((c) => (
            <CaseRow key={c.id} c={c} />
          ))}
          {!live.length && (
            <Link to="/wm/new" className="m-1 flex h-24 items-center justify-center gap-2 rounded-[16px] border border-dashed border-line-strong text-[14px] text-ink-3 hover:border-ink-4 hover:text-ink">
              <Plus className="size-4" /> New client
            </Link>
          )}
        </Card>

        <Card padding="sm" inner={16} className="lg:col-span-2">
          <div className="px-3 pt-2 pb-3 text-[15px] font-medium text-ink">Book of business</div>
          <div className="flex flex-col">
            {pipeline.map((p) => (
              <div key={p.id} className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-[16px] p-3 md:grid-cols-[minmax(0,1.4fr)_140px_120px_100px]">
                <span className="flex items-center gap-3">
                  <Avatar name={p.name} size="lg" />
                  <span className="text-[15px] text-ink">{p.name}</span>
                </span>
                <span className="hidden text-[13px] text-ink-3 md:block">{p.stage}</span>
                <span className="tabular hidden text-[14px] text-ink md:block" title={money(p.aum)}>
                  {moneyCompact(p.aum)}
                </span>
                <span className="text-right text-[13px] text-ink-4">{p.updated}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
