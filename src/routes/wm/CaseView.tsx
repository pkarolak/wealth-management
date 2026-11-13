import { ArrowUpRight, Check, ChevronDown, ClipboardList, Copy, FileText, Shield, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { AccountTile, CaseProvider, GoalCard, NetWorthSummary, PresenceStatus } from '../../components/patterns'
import { Badge, Button, Card, ProgressBar, StatusIcon, toast } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { relativeTime } from '../../lib/format'
import { fieldsFor, isVisible, type SectionDef, type SectionId } from '../../schema/onboarding'
import { riskQuestions, scoreRisk } from '../../schema/risk'
import { useStore } from '../../store/caseStore'
import { useCase, usePublishPresence } from '../../store/hooks'
import { ADVISOR_ID } from '../../store/seed'
import { caseValues, cifProgress, netWorth, sectionState, sectionStats, visibleSections } from '../../store/selectors'
import type { ClientCase } from '../../store/types'
import { NeedsYou, OPEN_SECTION, scrollToSection, SidePanel } from './CaseFocus'
import { ReviewRow } from './ReviewRow'
import { PageHeader } from './WMLayout'

export function CaseView() {
  const { caseId } = useParams()
  const c = useCase(caseId)
  const people = useStore((s) => s.people)
  const navigate = useNavigate()
  const [hover, setHover] = useState<{ sectionId?: SectionId; fieldId?: string }>({})
  const [params] = useSearchParams()
  const [tab, setTab] = useState('questions')
  const [openThread, setOpenThread] = useState<string | undefined>(params.get('thread') ?? undefined)
  useEffect(() => {
    const section = params.get('section') as SectionId | null
    if (section) setTimeout(() => scrollToSection(section), 150)
  }, [params])
  usePublishPresence(c ? { personId: ADVISOR_ID, view: 'advisor', caseId: c.id, ...hover } : undefined)
  if (!c) return <Navigate to="/wm" replace />

  const client = people[c.clientId]
  const cif = cifProgress(c)
  const submitted = c.stage === 'submitted'
  const secs = visibleSections(c)
  const link = `${window.location.origin}/c/${c.token}`

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
              <Button variant="secondary" leading={<FileText className="size-4" />} onClick={() => navigate(`/wm/c/${c.id}/brief`)}>
                Meeting brief
              </Button>
              <Button variant={submitted ? 'primary' : 'secondary'} leading={<ClipboardList className="size-4" />} onClick={() => navigate(`/wm/c/${c.id}/cif`)}>
                CIF
              </Button>
            </>
          }
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <PresenceStatus person={client} caseId={c.id} />
            <span className="text-[13px] text-ink-3">{c.invitedAt ? `Link sent ${relativeTime(c.invitedAt)}` : 'Link not sent yet'}</span>
            <Meter label="To open accounts" {...cif.accounts} />
            <Meter label="For planning" {...cif.planning} />
            {c.stage === 'submitted' && <Badge tone="success">Submitted {c.submittedAt && relativeTime(c.submittedAt)}</Badge>}
            <Compliance c={c} />
          </div>
        </PageHeader>

        <div className="grid items-start gap-4 px-10 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex min-w-0 flex-col gap-4">
            <NeedsYou
              c={c}
              onOpenThread={(id) => {
                setTab('questions')
                setOpenThread(id)
              }}
            />
            {secs.map((s) => (
              <SectionReview key={s.id} c={c} s={s} onHover={(fieldId) => setHover(fieldId ? { sectionId: s.id, fieldId } : {})} />
            ))}
          </div>
          <aside className="xl:sticky xl:top-6">
            <SidePanel c={c} tab={tab} onTab={setTab} openThread={openThread} onOpenThread={setOpenThread} />
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
  const [open, setOpen] = useState((state === 'done' && !reviewed) || state === 'progress' || stats.needsReview > 0)
  useEffect(() => {
    const onOpen = (e: Event) => (e as CustomEvent<SectionId>).detail === s.id && setOpen(true)
    window.addEventListener(OPEN_SECTION, onOpen)
    return () => window.removeEventListener(OPEN_SECTION, onOpen)
  }, [s.id])
  const values = caseValues(c)
  const defs = fieldsFor(s.id).filter((f) => isVisible(f, values))

  return (
    <Card id={`review-${s.id}`} padding="sm" inner={10} className="scroll-mt-6">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-3 pt-2 pb-2 text-left">
        <StatusIcon status={reviewed ? 'done' : state === 'idle' ? 'idle' : state === 'progress' ? 'progress' : 'waiting'} />
        <span className="flex-1 text-[16px] font-medium text-ink">{s.wmTitle}</span>
        {stats.needsReview > 0 && <Badge tone="progress">{stats.needsReview} changed</Badge>}
        {stats.suggestions > 0 && (
          <Badge tone="ai" icon={<Sparkles className="size-3" />}>
            {stats.suggestions} {stats.suggestions === 1 ? 'draft' : 'drafts'} pending
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
          {s.kind === 'review' && <p className="px-3 pb-2 text-[14px] text-ink-3">{c.signature ? `Confirmed by ${c.signature} on ${new Date(c.submittedAt ?? Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.` : `${c.firstName} hasn’t confirmed yet.`}</p>}
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

const day = (ts: number) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

/** When the client agreed to share their information, for the file. */
function Compliance({ c }: { c: ClientCase }) {
  const items = [{ label: 'Consent given', at: c.consentAt, missing: 'No consent yet' }]
  return (
    <span className="flex items-center gap-4 text-[13px]">
      {items.map((i) => (
        <span key={i.label} title={i.at ? new Date(i.at).toLocaleString('en-US') : undefined} className={cn('inline-flex items-center gap-1.5', i.at ? 'text-ink-3' : 'text-ink-4')}>
          {i.at ? <ShieldCheck className="size-3.5 text-success" /> : <Shield className="size-3.5" />}
          {i.at ? `${i.label} · ${day(i.at)}` : i.missing}
        </span>
      ))}
    </span>
  )
}

export function Meter({ label, done, total }: { label: string; done: number; total: number }) {
  return (
    <span className="flex items-center gap-2.5 text-[13px] text-ink-3" title={`${done} of ${total}`}>
      {label}
      <span className="w-20">
        <ProgressBar value={total ? (done / total) * 100 : 0} />
      </span>
      <span className="tabular text-ink-2">
        {done}/{total}
      </span>
    </span>
  )
}
