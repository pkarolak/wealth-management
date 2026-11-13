import { ArrowRight, BellRing, CalendarClock, Check, FileText, Hourglass, MessageCircle, PencilLine, Plus, Send } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { Avatar, Button, Card, CardHeader, toast } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { money, moneyCompact, relativeTime } from '../../lib/format'
import { useStore } from '../../store/caseStore'
import { useNow, usePresenceOf } from '../../store/hooks'
import { ADVISOR_ID, pipeline, pipelineCounts } from '../../store/seed'
import { cifProgress, pendingReview, realCases, sectionState, sectionStats, visibleSections } from '../../store/selectors'
import type { ClientCase, Stage } from '../../store/types'
import { color } from '../../tokens/tokens'
import { PageHeader } from './WMLayout'

const stageLabel: Record<Stage, string> = { invited: 'Link sent', in_progress: 'Filling in', submitted: 'Ready for meeting', onboarded: 'Onboarded' }

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

type Next = { who: 'you' | 'client' | 'meeting'; text: string }

/** Whose move it is, and what the move is. */
function nextStep(c: ClientCase): Next {
  const toReply = c.threads.filter((t) => !t.resolved && t.messages.at(-1)?.authorId === c.clientId).length
  if (toReply) return { who: 'you', text: `Reply to ${toReply} ${toReply === 1 ? 'question' : 'questions'}` }
  if (pendingReview(c).length) return { who: 'you', text: 'Recheck changed answers' }
  if (c.stage === 'submitted' && !c.agenda?.sharedAt) return { who: 'you', text: 'Share the meeting agenda' }
  const ready = visibleSections(c).filter((s) => s.kind !== 'review' && sectionState(c, s.id) === 'done' && !c.advisorReviewed[s.id]).length
  if (ready) return { who: 'you', text: `Review ${ready} ${ready === 1 ? 'section' : 'sections'}` }
  if (c.meeting && c.meeting.at > Date.now()) return { who: 'meeting', text: meetingLabel(c.meeting.at) }
  if (!c.openedAt) return { who: 'client', text: 'Hasn’t opened the link' }
  if (c.stage === 'submitted') return { who: 'client', text: 'Submitted · no meeting booked' }
  const left = visibleSections(c).filter((s) => sectionState(c, s.id) !== 'done').length
  return { who: 'client', text: `${left} ${left === 1 ? 'section' : 'sections'} left` }
}

const segmentClass = { reviewed: 'bg-ink', done: 'bg-ink-3', progress: 'bg-progress', idle: 'bg-line-strong' }

function Journey({ c }: { c: ClientCase }) {
  const secs = visibleSections(c)
  const states = secs.map((s) => (c.advisorReviewed[s.id] ? 'reviewed' : (sectionState(c, s.id) as 'done' | 'progress' | 'idle')))
  const acct = cifProgress(c).accounts
  const left = acct.total - acct.done
  return (
    <span className="flex w-full min-w-0 flex-col gap-2">
      <span className="flex w-full gap-[3px]">
        {secs.map((s, i) => (
          <span key={s.id} title={`${s.wmTitle} · ${states[i] === 'reviewed' ? 'reviewed' : states[i] === 'done' ? 'done' : states[i] === 'progress' ? 'in progress' : 'not started'}`} className={cn('h-1.5 flex-1 rounded-full', segmentClass[states[i]])} />
        ))}
      </span>
      <span className="text-[12px] text-ink-4">
        {stageLabel[c.stage]} · {left ? `${left} left to open accounts` : 'Ready to open accounts'}
      </span>
    </span>
  )
}

function CaseRow({ c }: { c: ClientCase }) {
  const navigate = useNavigate()
  const here = usePresenceOf(c.clientId, c.id)
  const fromClient = c.activity.find((a) => a.actorId === c.clientId)
  const next = nextStep(c)
  return (
    <button
      type="button"
      onClick={() => navigate(`/wm/c/${c.id}`)}
      className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 rounded-[18px] p-3 text-left transition-colors hover:bg-muted/60 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.2fr)_220px]"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="relative">
          <Avatar name={`${c.firstName} ${c.lastName}`} size="lg" />
          {here && <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-success ring-2 ring-surface" />}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[15px] text-ink">
            {c.firstName} {c.lastName}
          </span>
          <span className="truncate text-[12px] text-ink-4">{here ? <span className="text-success">Filling in now</span> : c.email}</span>
        </span>
      </span>

      <span className="hidden md:block">
        <Journey c={c} />
      </span>

      <span className="hidden min-w-0 flex-col md:flex">
        {fromClient ? (
          <>
            <span className="truncate text-[13px] text-ink-2">{fromClient.text}</span>
            <span className="text-[12px] text-ink-4">{relativeTime(fromClient.ts)}</span>
          </>
        ) : (
          <span className="text-[13px] text-ink-4">{c.invitedAt ? `Link sent ${relativeTime(c.invitedAt)}` : 'Link not sent yet'}</span>
        )}
      </span>

      <span className="flex min-w-0 items-center justify-end gap-2.5">
        <span className="flex min-w-0 flex-col items-end">
          <span className={cn('text-[12px]', next.who === 'you' ? 'text-advisor' : 'text-ink-4')}>{next.who === 'you' ? 'Your move' : next.who === 'meeting' ? 'Meeting' : `Waiting on ${c.firstName}`}</span>
          <span className={cn('truncate text-[13px]', next.who === 'you' ? 'text-ink' : 'text-ink-2')}>{next.text}</span>
        </span>
        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full transition-colors', next.who === 'you' ? 'bg-advisor-soft text-advisor' : next.who === 'meeting' ? 'bg-success-soft text-success' : 'bg-muted text-ink-3')}>
          {next.who === 'you' ? <ArrowRight className="size-4" /> : next.who === 'meeting' ? <CalendarClock className="size-4" /> : <Hourglass className="size-4" />}
        </span>
      </span>
    </button>
  )
}

/** Clients in onboarding, newest activity first, with a one-line count of whose move it is. */
function Onboarding({ cases }: { cases: ClientCase[] }) {
  const sorted = [...cases].sort((a, b) => (b.activity[0]?.ts ?? b.createdAt) - (a.activity[0]?.ts ?? a.createdAt))
  const yours = cases.filter((c) => nextStep(c).who === 'you').length
  return (
    <Card padding="sm" inner={18} className="lg:col-span-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-3 pt-2 pb-2">
        <h3 className="text-[15px] font-medium text-ink">Onboarding</h3>
        {cases.length > 0 && (
          <span className="text-[13px] text-ink-4">
            {cases.length} active{yours > 0 && <span className="text-advisor"> · {yours} waiting on you</span>}
          </span>
        )}
      </div>
      <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.2fr)_220px] gap-x-6 px-3 pb-1 text-[11px] tracking-wide text-ink-4 uppercase md:grid">
        <span>Client</span>
        <span>Progress</span>
        <span>Latest from client</span>
        <span className="text-right">Next step</span>
      </div>
      {sorted.map((c) => (
        <CaseRow key={c.id} c={c} />
      ))}
      {!cases.length && (
        <Link to="/wm/new" className="m-1 flex h-24 items-center justify-center gap-2 rounded-[16px] border border-dashed border-line-strong text-[14px] text-ink-3 hover:border-ink-4 hover:text-ink">
          <Plus className="size-4" /> New client
        </Link>
      )}
    </Card>
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
      mine.unshift({ id: `b-${c.id}`, c, icon: <FileText className="size-4" />, tone: 'ai', title: <>{c.firstName} submitted — <span className="font-medium">share the agenda</span></>, detail: c.meeting ? `Meeting ${meetingLabel(c.meeting.at)}` : 'No meeting booked yet', action: 'Open brief', to: `${base}/brief` })
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

        <Onboarding cases={live} />

        <Card padding="sm" inner={16} className="lg:col-span-2">
          <div className="px-3 pt-2 pb-3 text-[15px] font-medium text-ink">Households</div>
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
