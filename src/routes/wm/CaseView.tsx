import { ArrowUpRight, Check, ChevronDown, Copy, FileText, Plus, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { AccountTile, ActivityFeed, CaseProvider, CommentThread, GoalCard, KanbanColumn, NetWorthSummary, PresenceStatus, type KanbanCardData } from '../../components/patterns'
import { Badge, Button, Card, CardHeader, Input, ProgressBar, Segmented, StatusIcon, toast } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { relativeTime } from '../../lib/format'
import { fieldsFor, isVisible, type SectionDef, type SectionId } from '../../schema/onboarding'
import { riskQuestions, scoreRisk } from '../../schema/risk'
import { useStore } from '../../store/caseStore'
import { useCase, usePublishPresence } from '../../store/hooks'
import { ADVISOR_ID } from '../../store/seed'
import { caseValues, netWorth, overallProgress, sectionState, sectionStats, visibleSections } from '../../store/selectors'
import type { ClientCase } from '../../store/types'
import { ReviewRow } from './ReviewRow'
import { PageHeader } from './WMLayout'

export function CaseView() {
  const { caseId } = useParams()
  const c = useCase(caseId)
  const people = useStore((s) => s.people)
  const navigate = useNavigate()
  const [hover, setHover] = useState<{ sectionId?: SectionId; fieldId?: string }>({})
  usePublishPresence(c ? { personId: ADVISOR_ID, view: 'advisor', caseId: c.id, ...hover } : undefined)
  if (!c) return <Navigate to="/wm" replace />

  const client = people[c.clientId]
  const p = overallProgress(c)
  const secs = visibleSections(c)
  const link = `${window.location.origin}/c/${c.token}`

  const kanban = (state: 'idle' | 'progress' | 'done'): KanbanCardData[] =>
    secs
      .filter((s) => sectionState(c, s.id) === state)
      .map((s) => {
        const st = sectionStats(c, s.id)
        return {
          id: s.id,
          title: s.title,
          status: state === 'idle' ? 'waiting' : state === 'progress' ? 'progress' : 'done',
          meta: state === 'done' ? (c.advisorReviewed[s.id] ? 'Reviewed' : 'Ready for your review') : state === 'progress' ? (s.kind === 'networth' ? `${c.items.length} accounts and debts` : s.kind === 'goals' ? `${c.goals.length} goals` : `${st.filled} of ${st.total} answered`) : `${s.minutes} min`,
          onClick: () => document.getElementById(`review-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        }
      })

  return (
    <CaseProvider caseId={c.id} viewerId={ADVISOR_ID} mode="advisor">
      <div className="pb-20">
        <PageHeader
          eyebrow={
            <span className="flex items-center gap-3">
              <button type="button" onClick={() => navigate('/wm')} className="hover:text-ink">
                Overview
              </button>
              <span className="text-ink-4">/</span>
              <span>Onboarding</span>
            </span>
          }
          title={`${c.firstName} ${c.lastName}`}
          actions={
            <>
              <Button
                variant="secondary"
                leading={<Copy className="size-4" />}
                onClick={() => {
                  navigator.clipboard?.writeText(link)
                  toast('Link copied', { description: link })
                }}
              >
                Copy link
              </Button>
              <Button variant="secondary" trailing={<ArrowUpRight className="size-4" />} onClick={() => window.open(`/c/${c.token}`, 'client')}>
                Open as {c.firstName}
              </Button>
              <Button leading={<FileText className="size-4" />} onClick={() => navigate(`/wm/c/${c.id}/brief`)}>
                Meeting brief
              </Button>
            </>
          }
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <PresenceStatus person={client} caseId={c.id} />
            <span className="text-[13px] text-ink-3">{c.invitedAt ? `Link sent ${relativeTime(c.invitedAt)}` : 'Link not sent yet'}</span>
            <span className="flex w-56 items-center gap-3 text-[13px] text-ink-3">
              <ProgressBar value={p.ratio * 100} />
              <span className="tabular shrink-0">{Math.round(p.ratio * 100)}%</span>
            </span>
            {c.stage === 'submitted' && <Badge tone="success">Signed {c.submittedAt && relativeTime(c.submittedAt)}</Badge>}
          </div>
        </PageHeader>

        <div className="grid items-start gap-4 px-10 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-4">
            <Card tone="muted" padding="md" inner={16} className="grid gap-3 sm:grid-cols-3">
              <KanbanColumn title={`Waiting on ${c.firstName}`} cards={kanban('idle')} />
              <KanbanColumn title="In progress" cards={kanban('progress')} />
              <KanbanColumn title="Done" cards={kanban('done')} />
            </Card>
            {secs.map((s) => (
              <SectionReview key={s.id} c={c} s={s} onHover={(fieldId) => setHover(fieldId ? { sectionId: s.id, fieldId } : {})} />
            ))}
          </div>
          <aside className="flex flex-col gap-4 xl:sticky xl:top-6">
            <ThreadsPanel c={c} />
            <RequestsPanel c={c} />
            <Card padding="lg" inner={10}>
              <CardHeader title="Activity" />
              <ActivityFeed items={c.activity} people={people} limit={12} />
            </Card>
          </aside>
        </div>
      </div>
    </CaseProvider>
  )
}

function SectionReview({ c, s, onHover }: { c: ClientCase; s: SectionDef; onHover: (fieldId?: string) => void }) {
  const confirmSection = useStore((st) => st.confirmSection)
  const markReviewed = useStore((st) => st.markSectionReviewed)
  const state = sectionState(c, s.id)
  const stats = sectionStats(c, s.id)
  const reviewed = !!c.advisorReviewed[s.id]
  const [open, setOpen] = useState(state !== 'idle')
  const values = caseValues(c)
  const defs = fieldsFor(s.id).filter((f) => isVisible(f, values))

  return (
    <Card id={`review-${s.id}`} padding="sm" inner={10} className="scroll-mt-6">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-3 pt-2 pb-2 text-left">
        <StatusIcon status={reviewed ? 'done' : state === 'idle' ? 'idle' : state === 'progress' ? 'progress' : 'waiting'} />
        <span className="flex-1 text-[16px] font-medium text-ink">{s.title}</span>
        {stats.needsReview > 0 && <Badge tone="progress">{stats.needsReview} changed</Badge>}
        {stats.suggestions > 0 && (
          <Badge tone="ai" icon={<Sparkles className="size-3" />}>
            {stats.suggestions} drafts pending
          </Badge>
        )}
        <span className="tabular text-[13px] text-ink-4">
          {stats.filled}/{stats.total}
        </span>
        <ChevronDown className={cn('size-4 text-ink-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="flex flex-col gap-1 pt-1">
          {s.kind === 'form' && defs.map((d) => <ReviewRow key={d.id} c={c} def={d} onHover={onHover} />)}
          {s.kind === 'goals' && <GoalsReview c={c} />}
          {s.kind === 'networth' && <NetWorthReview c={c} />}
          {s.kind === 'risk' && (
            <>
              <RiskReview c={c} />
              {defs.map((d) => (
                <ReviewRow key={d.id} c={c} def={d} onHover={onHover} />
              ))}
            </>
          )}
          {s.kind === 'review' && <p className="px-3 pb-2 text-[14px] text-ink-3">{c.signature ? `Signed as “${c.signature}”.` : `${c.firstName} hasn’t signed yet.`}</p>}
          {s.kind !== 'review' && (
            <div className="flex justify-end gap-2 px-1 pt-2 pb-1">
              {reviewed ? (
                <Button size="sm" variant="ghost" onClick={() => markReviewed(c.id, s.id, false)}>
                  Reopen
                </Button>
              ) : (
                <Button size="sm" variant="soft" leading={<Check className="size-3.5" />} disabled={state === 'idle'} onClick={() => confirmSection(c.id, s.id, defs.map((d) => d.id), c.advisorId)}>
                  Mark section reviewed
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function GoalsReview({ c }: { c: ClientCase }) {
  if (!c.goals.length) return <p className="px-3 pb-2 text-[14px] text-ink-4">No goals yet.</p>
  return (
    <div className="grid gap-2 px-1 sm:grid-cols-3">
      {c.goals.map((g) => (
        <GoalCard key={g.id} goal={g} />
      ))}
    </div>
  )
}

function NetWorthReview({ c }: { c: ClientCase }) {
  const totals = netWorth(c)
  const drafts = c.items.filter((i) => i.draft).length
  return (
    <div className="grid gap-3 px-1 lg:grid-cols-[1fr_1fr]">
      <NetWorthSummary totals={totals} items={c.items} pending={drafts} className="bg-muted/60 p-5" />
      <div className="flex flex-col gap-1">
        {c.items.map((i) => (
          <AccountTile key={i.id} item={i} />
        ))}
        {!c.items.length && <p className="px-3 text-[14px] text-ink-4">Nothing added yet.</p>}
      </div>
    </div>
  )
}

function RiskReview({ c }: { c: ClientCase }) {
  const score = scoreRisk(c.risk)
  if (!score) return <p className="px-3 pb-2 text-[14px] text-ink-4">Not started.</p>
  return (
    <div className="mx-1 mb-1 flex flex-col gap-3 rounded-[16px] bg-muted/60 p-4">
      <div className="flex items-baseline justify-between">
        <span className="display text-[26px] text-ink">{score.label}</span>
        <span className="text-[13px] text-ink-3">
          {score.answered} of {riskQuestions.length} answered{c.riskConfirmed && ' · confirmed by client'}
        </span>
      </div>
      <span className="text-[14px] text-ink-3">
        Objective: {score.objective}. {score.description}
      </span>
    </div>
  )
}

function ThreadsPanel({ c }: { c: ClientCase }) {
  const [filter, setFilter] = useState('open')
  const threads = c.threads.filter((t) => (filter === 'open' ? !t.resolved : t.resolved))
  return (
    <Card padding="lg" inner={18}>
      <CardHeader
        title="Questions"
        action={
          <Segmented
            size="sm"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'open', label: `Open ${c.threads.filter((t) => !t.resolved).length}` },
              { value: 'resolved', label: 'Resolved' },
            ]}
          />
        }
      />
      <div className="flex flex-col gap-6">
        {threads.map((t) => (
          <CommentThread key={t.id} thread={t} />
        ))}
        {!threads.length && <p className="text-[14px] text-ink-4">{filter === 'open' ? `No open questions. ${c.firstName} can ask on any field.` : 'Nothing resolved yet.'}</p>}
      </div>
    </Card>
  )
}

const requestIdeas = ['Latest 401(k) statement', 'Most recent tax return', 'Copy of your trust documents', 'Employer stock plan statement']

function RequestsPanel({ c }: { c: ClientCase }) {
  const addRequest = useStore((s) => s.addRequest)
  const [title, setTitle] = useState('')
  const open = useMemo(() => c.requests.filter((r) => r.status === 'open'), [c.requests])
  const done = c.requests.filter((r) => r.status === 'done')
  const send = (t: string) => {
    if (!t.trim()) return
    addRequest(c.id, { kind: 'document', title: t.trim(), sectionId: 'networth' }, c.advisorId)
    setTitle('')
    toast('Request sent', { description: `${c.firstName} will see it at the top of the form.` })
  }
  return (
    <Card padding="lg" inner={10}>
      <CardHeader title="Requests" subtitle={`Ask ${c.firstName} for a document or answer`} />
      <div className="flex flex-col gap-2">
        {[...open, ...done].map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-control bg-muted/60 px-3 py-2.5">
            <StatusIcon status={r.status === 'done' ? 'done' : 'waiting'} size={16} />
            <span className={cn('flex-1 text-[14px]', r.status === 'done' ? 'text-ink-3 line-through' : 'text-ink')}>{r.title}</span>
            <span className="text-[12px] text-ink-4">{relativeTime(r.fulfilledAt ?? r.createdAt)}</span>
          </div>
        ))}
        <Input
          placeholder="e.g. Latest 401(k) statement"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(title)}
          trailing={
            <button type="button" onClick={() => send(title)} disabled={!title.trim()} className="flex size-8 items-center justify-center rounded-control bg-ink text-white disabled:opacity-25" aria-label="Send request">
              <Plus className="size-4" />
            </button>
          }
        />
        {!c.requests.length && (
          <div className="flex flex-wrap gap-1.5">
            {requestIdeas.map((r) => (
              <button key={r} type="button" onClick={() => send(r)} className="rounded-full bg-muted px-2.5 py-1 text-[12px] text-ink-3 hover:text-ink">
                {r}
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
