import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { CaseProvider, ProgressRail, type RailItem } from '../../components/patterns'
import { Avatar, toast } from '../../components/primitives'
import { AdvisorCard } from './AdvisorCard'
import { Wordmark } from '../../components/shell/Brand'
import type { SectionId } from '../../schema/onboarding'
import { useStore } from '../../store/caseStore'
import { useCaseByToken, usePublishPresence } from '../../store/hooks'
import { sectionState, sectionStats, unreadCount, visibleSections } from '../../store/selectors'
import type { ClientCase } from '../../store/types'
import { Done } from './Done'
import { FormSection } from './FormSection'
import { GoalsStep } from './GoalsStep'
import { IdScan } from './IdScan'
import { Intro } from './Intro'
import { NetWorthStep } from './NetWorthStep'
import { Inbox } from './Inbox'
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
  const people = useStore((s) => s.people)
  const [params, setParams] = useSearchParams()
  const [focus, setFocus] = useState<{ sectionId?: SectionId; fieldId?: string }>({})

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
  const railItems: RailItem[] = visibleSections(c).map((s) => {
    const st = sectionState(c, s.id)
    const stats = sectionStats(c, s.id)
    const meta = stats.suggestions ? <span className="text-ai">{stats.suggestions} to check</span> : st === 'done' ? undefined : `${s.minutes} min`
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
    <CaseProvider caseId={c.id} viewerId={c.clientId} mode="client" onFocus={setFocus}>
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
            <Wordmark />
            <span className="ml-auto hidden items-center gap-1.5 text-[13px] text-ink-4 sm:inline-flex">
              <Check className="size-3.5" /> Saved
            </span>
            <span className="inline-flex items-center gap-2 rounded-full p-0.5 pr-3 text-[13px] text-ink-2">
              <Avatar name={`${c.firstName} ${c.lastName}`} src={people[c.clientId]?.avatar} size="sm" />
              {c.firstName}
            </span>
          </div>
        </header>

        <div className={inSections ? 'mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[240px_minmax(0,1fr)]' : 'mx-auto max-w-3xl px-6 py-12'}>
          {inSections && (
            <aside className="hidden lg:block">
              <div className="sticky top-24 flex flex-col gap-4">
                <ProgressRail
                  active={sectionId ?? (step === 'requests' ? 'requests' : undefined)}
                  onSelect={(id) => go(id as Step)}
                  items={railItems}
                />
                {unreadCount(c, c.clientId) > 0 && <p className="px-3 text-[12px] text-advisor">{advisor.name.split(' ')[0]} replied to you</p>}
                <AdvisorCard c={c} sectionId={sectionId} />
              </div>
            </aside>
          )}
          <main className="min-w-0">
            {inSections && <Inbox c={c} />}
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
