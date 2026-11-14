import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { CaseProvider, ProgressRail, type RailItem } from '../../components/patterns'
import { Dialog, ProgressBar, toast } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { relativeTime } from '../../lib/format'
import { AdvisorCard } from './AdvisorCard'
import { Wordmark } from '../../components/shell/Brand'
import type { SectionId } from '../../schema/onboarding'
import { useStore } from '../../store/caseStore'
import { useCaseByToken, usePublishPresence } from '../../store/hooks'
import { overallProgress, sectionState, sectionStats, unreadCount, visibleSections } from '../../store/selectors'
import type { ClientCase } from '../../store/types'
import { Done } from './Done'
import { FormSection } from './FormSection'
import { GoalsStep } from './GoalsStep'
import { IdScan } from './IdScan'
import { Intro } from './Intro'
import { NetWorthStep } from './NetWorthStep'
import { Inbox } from './Inbox'
import { CommentsDrawer } from './CommentsDrawer'
import { RequestsStep } from './RequestsStep'
import { ReviewStep } from './ReviewStep'
import { RiskStep } from './RiskStep'
import { Welcome } from './Welcome'

export type Step = 'welcome' | 'intro' | 'id' | SectionId | 'requests' | 'done'

/** Additional requests only exist once the Wealth Manager has asked for something; they sit right before Review. */
export const stepOrder = (c: ClientCase): Step[] => {
  const secs: Step[] = visibleSections(c).map((s) => s.id)
  if (c.requests.length) secs.splice(secs.indexOf('review'), 0, 'requests')
  return ['welcome', 'intro', 'id', ...secs, 'done']
}

const nonSection: Step[] = ['welcome', 'intro', 'id', 'requests', 'done']

/** Navigation helpers handed to each step. */
export type StepNav = { next: () => void; back: () => void; go: (s: Step) => void }

export function ClientApp() {
  const { token } = useParams()
  const c = useCaseByToken(token)
  const markOpened = useStore((s) => s.markOpened)
  const markRead = useStore((s) => s.markRead)
  const people = useStore((s) => s.people)
  const [params, setParams] = useSearchParams()
  const [focus, setFocus] = useState<{ sectionId?: SectionId; fieldId?: string }>({})
  const [sheet, setSheet] = useState(false)
  const [talk, setTalk] = useState<{ open: boolean; thread?: string }>({ open: false })
  const [spotlight, setSpotlight] = useState<{ fieldId: string; at: number }>()

  const step = (params.get('step') as Step) || (c?.stage === 'submitted' ? 'done' : 'welcome')
  const sectionId = (nonSection.includes(step) ? undefined : step) as SectionId | undefined
  const openRequests = c?.requests.filter((r) => r.status === 'open').length ?? 0
  const [seenOpen, setSeenOpen] = useState(openRequests)

  usePublishPresence(c ? { personId: c.clientId, view: 'client', caseId: c.id, sectionId: focus.sectionId ?? sectionId, fieldId: focus.fieldId } : undefined)
  useEffect(() => {
    if (c) markOpened(c.id)
  }, [c?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setFocus({})
    window.scrollTo({ top: 0 })
  }, [step])
  useEffect(() => {
    if (openRequests > seenOpen && step !== 'requests' && c) {
      const first = useStore.getState().people[c.advisorId]?.name.split(' ')[0]
      toast(`${first} added a request`, { description: 'Find it under Additional requests.' })
    }
    setSeenOpen(openRequests)
  }, [openRequests]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!c) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <Wordmark />
        <p className="mt-6 text-[16px] text-ink-2">This link isn’t active.</p>
        <p className="text-[14px] text-ink-3">Ask your Wealth Manager for a new one, or reset the demo from the home page.</p>
      </div>
    )
  }

  const order = stepOrder(c)
  const idx = Math.max(0, order.indexOf(step))
  const go = (s: Step) => setParams({ step: s })
  const nav: StepNav = { go, next: () => go(order[Math.min(order.length - 1, idx + 1)]), back: () => go(order[Math.max(0, idx - 1)]) }
  const advisor = people[c.advisorId]
  const inSections = !!sectionId || step === 'requests'
  const openThreads = c.threads.filter((t) => !t.resolved).length
  const unread = unreadCount(c, c.clientId)
  const railItems: RailItem[] = visibleSections(c).map((s) => {
    const st = sectionState(c, s.id)
    const stats = sectionStats(c, s.id)
    const meta = stats.suggestions ? <span className="text-ai">{stats.suggestions} {s.id === 'networth' ? 'to add' : 'to check'}</span> : st === 'done' ? undefined : `${s.minutes} min`
    return { id: s.id, title: s.short, state: st === 'done' ? 'done' : st === 'progress' ? 'progress' : 'idle', meta, optional: s.optional }
  })
  if (c.requests.length) {
    railItems.splice(railItems.findIndex((r) => r.id === 'review'), 0, {
      id: 'requests',
      title: 'Additional requests',
      state: openRequests ? 'progress' : 'done',
      count: openRequests || undefined,
    })
  }

  const visible = visibleSections(c)
  const lastSaved = Math.max(0, ...Object.values(c.fields).filter((f) => f.updatedBy === c.clientId).map((f) => f.updatedAt ?? 0), ...c.items.map((i) => i.updatedAt ?? 0))
  const activeRail = sectionId ?? (step === 'requests' ? 'requests' : undefined)
  const rail = (onPick?: () => void) => (
    <ProgressRail
      active={activeRail}
      onSelect={(id) => {
        go(id as Step)
        onPick?.()
      }}
      items={railItems}
    />
  )

  const view = (() => {
    switch (step) {
      case 'welcome':
        return <Welcome c={c} nav={nav} />
      case 'intro':
        return <Intro c={c} nav={nav} />
      case 'id':
        return <IdScan c={c} nav={nav} />
      case 'goals':
        return <GoalsStep c={c} nav={nav} />
      case 'networth':
        return <NetWorthStep c={c} nav={nav} />
      case 'risk':
        return <RiskStep c={c} nav={nav} />
      case 'requests':
        return <RequestsStep c={c} nav={nav} />
      case 'review':
        return <ReviewStep c={c} nav={nav} />
      case 'done':
        return <Done c={c} />
      default:
        return <FormSection c={c} sectionId={step as SectionId} nav={nav} />
    }
  })()

  return (
    <CaseProvider caseId={c.id} viewerId={c.clientId} mode="client" onFocus={setFocus} spotlight={spotlight}>
      <div className="min-h-screen">
        <a href="#main" className="sr-only rounded-control bg-ink px-4 py-2 text-[14px] text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50">
          Skip to form
        </a>
        <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
            <Wordmark />
            <span className="ml-auto text-[13px] text-ink-3">
              {c.firstName} {c.lastName}
            </span>
            {lastSaved > 0 && (
              <span className="hidden items-center gap-1.5 text-[13px] text-ink-3 sm:inline-flex">
                <Check className="size-3.5" /> Saved {relativeTime(lastSaved)}
              </span>
            )}
            {step !== 'welcome' && (
              <button
                type="button"
                onClick={() => setTalk({ open: true })}
                aria-label={`Comments, ${openThreads} open${unread ? `, ${unread} new` : ''}`}
                className="relative inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-ink-2 ring-1 ring-line transition-colors ring-inset hover:bg-surface hover:text-ink hover:ring-line-strong"
              >
                <MessageCircle className="size-4" />
                <span className="hidden sm:inline">Comments</span>
                {openThreads > 0 && (
                  <span className={cn('tabular flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[12px] font-medium', unread ? 'bg-advisor text-white' : 'bg-muted text-ink-2')}>{openThreads}</span>
                )}
              </button>
            )}
          </div>
          {inSections && (
            <button type="button" onClick={() => setSheet(true)} className="flex h-12 w-full items-center gap-3 border-t border-line/70 px-6 text-left text-[13px] text-ink-2 lg:hidden">
              <span className="shrink-0">
                {sectionId ? `${visible.findIndex((s) => s.id === sectionId) + 1} of ${visible.length}` : 'Requests'} · {railItems.find((r) => r.id === activeRail)?.title}
              </span>
              <ProgressBar value={overallProgress(c).ratio * 100} />
              <span className="inline-flex shrink-0 items-center gap-1 text-ink">
                All steps
                {(unreadCount(c, c.clientId) > 0 || openRequests > 0) && <span className="size-1.5 rounded-full bg-advisor" />}
                <ChevronDown className="size-4" />
              </span>
            </button>
          )}
        </header>
        <Dialog open={sheet} onOpenChange={setSheet} title="Your progress" description="Jump to any step. Everything you’ve entered is saved.">
          <div className="flex flex-col gap-4">
            <AdvisorCard c={c} sectionId={sectionId} className="order-first border-t-0 border-b pt-0 pb-4" />
            {rail(() => setSheet(false))}
          </div>
        </Dialog>
        <CommentsDrawer c={c} sectionId={sectionId} open={talk.open} onOpenChange={(open) => setTalk((t) => ({ ...t, open }))} openThread={talk.thread} onOpenThread={(thread) => setTalk({ open: true, thread })}
          onPick={(t) => {
            const target = t.anchor.sectionId as Step
            if (order.includes(target) && target !== step) go(target)
            // Field comments open next to their field; step-level ones stay readable here.
            if (!t.anchor.fieldId) return false
            setTalk({ open: false })
            setSpotlight({ fieldId: t.anchor.fieldId, at: Date.now() })
            return true
          }}
        />

        <div className={inSections ? 'mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[240px_minmax(0,1fr)]' : 'mx-auto max-w-3xl px-6 py-12'}>
          {inSections && (
            <aside className="hidden lg:block">
              <div className="sticky top-24 flex h-[calc(100vh-8.5rem)] flex-col gap-4">
                <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
                  {rail()}
                  {unreadCount(c, c.clientId) > 0 && (
                    <button type="button" onClick={() => setTalk({ open: true })} className="self-start px-3 text-[12px] text-advisor hover:underline">
                      {advisor.name.split(' ')[0]} replied to you
                    </button>
                  )}
                </div>
                <AdvisorCard c={c} sectionId={sectionId} className="mt-auto" />
              </div>
            </aside>
          )}
          <main id="main" tabIndex={-1} className="min-w-0 outline-none">
            {inSections && <Inbox
                c={c}
                onOpen={(thread) => {
                  markRead(c.id, c.clientId, [thread])
                  setTalk({ open: true, thread })
                }}
              />}
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                {view}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </CaseProvider>
  )
}
