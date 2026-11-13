import { ArrowRight, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { Avatar, Badge, Button, Card, CardHeader, CountDot, ProgressBar, StatusIcon } from '../../components/primitives'
import { money, moneyCompact, relativeTime } from '../../lib/format'
import { useStore } from '../../store/caseStore'
import { useNow } from '../../store/hooks'
import { ADVISOR_ID, pipeline, pipelineCounts } from '../../store/seed'
import { overallProgress, pendingReview, realCases, unreadCount } from '../../store/selectors'
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

export function Overview() {
  useNow(15_000)
  const cases = useStore((s) => s.cases)
  const emily = useStore((s) => s.people[ADVISOR_ID])
  const live = useMemo(() => realCases(cases), [cases])

  const attention = live.flatMap((c) => {
    const items: { id: string; text: string; caseId: string; status: 'attention' | 'waiting' | 'done' }[] = []
    const u = unreadCount(c, ADVISOR_ID)
    if (u) items.push({ id: `${c.id}-u`, text: `${c.firstName} asked ${u} question${u > 1 ? 's' : ''}`, caseId: c.id, status: 'attention' })
    const r = pendingReview(c).length
    if (r) items.push({ id: `${c.id}-r`, text: `${c.firstName} changed ${r} confirmed answer${r > 1 ? 's' : ''}`, caseId: c.id, status: 'attention' })
    if (c.stage === 'submitted') items.push({ id: `${c.id}-s`, text: `${c.firstName}’s meeting brief is ready`, caseId: c.id, status: 'done' })
    if (c.stage === 'invited') items.push({ id: `${c.id}-i`, text: `Waiting for ${c.firstName} to open the link`, caseId: c.id, status: 'waiting' })
    return items
  })

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
        <Card padding="lg" inner={10}>
          <CardHeader title="Needs your attention" subtitle={attention.length ? undefined : 'You’re all caught up.'} />
          <div className="flex flex-col gap-1">
            {attention.map((a) => (
              <Link key={a.id} to={`/wm/c/${a.caseId}`} className="flex items-center gap-3 rounded-control px-2 py-2.5 text-[14px] text-ink-2 hover:bg-muted">
                <StatusIcon status={a.status} />
                <span className="flex-1">{a.text}</span>
                <ArrowRight className="size-4 text-ink-4" />
              </Link>
            ))}
          </div>
        </Card>

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
