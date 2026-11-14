import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, FileText, MessageCircle, PencilLine, Plus } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ActivityFeed, ThreadList } from '../../components/patterns'
import { Input, Segmented, StatusIcon, toast } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { relativeTime } from '../../lib/format'
import type { SectionId } from '../../schema/onboarding'
import { useStore } from '../../store/caseStore'
import { ADVISOR_ID } from '../../store/seed'
import { sectionState, sectionStats, visibleSections } from '../../store/selectors'
import type { ClientCase, Thread } from '../../store/types'

export const OPEN_SECTION = 'wm:open-section'

export const scrollToSection = (id: SectionId) => {
  window.dispatchEvent(new CustomEvent(OPEN_SECTION, { detail: id }))
  requestAnimationFrame(() => document.getElementById(`review-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

const awaitingReply = (c: ClientCase, t: Thread) => !t.resolved && t.messages[t.messages.length - 1]?.authorId === c.clientId

type Todo = { id: string; icon: ReactNode; text: ReactNode; meta?: string; action: string; onClick: () => void; tone?: 'advisor' | 'progress' | 'ai' | 'ink' }

const toneClass = { advisor: 'bg-advisor-soft text-advisor', progress: 'bg-progress-soft text-progress-ink', ai: 'bg-ai-soft text-ai', ink: 'bg-muted text-ink-2' }

/** What Emily should do next, in priority order, plus a one-line map of the sections. */
export function NeedsYou({ c, onOpenThread }: { c: ClientCase; onOpenThread: (id: string) => void }) {
  const navigate = useNavigate()
  const secs = visibleSections(c)
  const todos: Todo[] = []

  for (const t of c.threads.filter((t) => awaitingReply(c, t)))
    todos.push({
      id: `t-${t.id}`,
      icon: <MessageCircle className="size-4" />,
      tone: 'advisor',
      text: (
        <>
          {c.firstName} asked about <span className="font-medium">“{t.title}”</span>
        </>
      ),
      meta: relativeTime(t.messages[t.messages.length - 1].ts),
      action: 'Reply',
      onClick: () => onOpenThread(t.id),
    })
  for (const s of secs) {
    const st = sectionStats(c, s.id)
    if (st.needsReview > 0)
      todos.push({
        id: `nr-${s.id}`,
        icon: <PencilLine className="size-4" />,
        tone: 'progress',
        text: (
          <>
            {c.firstName} changed {st.needsReview === 1 ? 'an answer' : `${st.needsReview} answers`} in <span className="font-medium">{s.wmTitle}</span> after you confirmed
          </>
        ),
        action: 'Recheck',
        onClick: () => scrollToSection(s.id),
      })
  }
  for (const s of secs.filter((s) => s.kind !== 'review' && sectionState(c, s.id) === 'done' && !c.advisorReviewed[s.id]))
    todos.push({
      id: `rv-${s.id}`,
      icon: <Check className="size-4" />,
      tone: 'ink',
      text: (
        <>
          <span className="font-medium">{s.wmTitle}</span> is ready for your review
        </>
      ),
      action: 'Review',
      onClick: () => scrollToSection(s.id),
    })
  if (c.stage === 'submitted' && !c.agenda?.sharedAt)
    todos.unshift({
      id: 'brief',
      icon: <FileText className="size-4" />,
      tone: 'ai',
      text: (
        <>
          {c.firstName} submitted. <span className="font-medium">Prepare and share the agenda</span>
        </>
      ),
      action: 'Open brief',
      onClick: () => navigate(`/wm/c/${c.id}/brief`),
    })

  const waiting = secs.filter((s) => sectionState(c, s.id) !== 'done').map((s) => s.wmShort)

  return (
    <section className="flex flex-col gap-1 rounded-[26px] bg-surface p-2">
      <div className="flex items-baseline justify-between px-4 pt-3 pb-2">
        <h2 className="text-[17px] font-medium text-ink">Needs you</h2>
        <span className="text-[13px] text-ink-4">{todos.length ? `${todos.length} ${todos.length === 1 ? 'thing' : 'things'}` : 'All caught up'}</span>
      </div>

      {todos.length ? (
        <ul className="flex flex-col gap-0.5">
          <AnimatePresence initial={false}>
            {todos.map((t) => (
              <motion.li key={t.id} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
                <button type="button" onClick={t.onClick} className="group flex w-full items-center gap-3 rounded-[18px] p-2 pr-3 text-left transition-colors hover:bg-muted/70">
                  <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-[10px]', toneClass[t.tone ?? 'ink'])}>{t.icon}</span>
                  <span className="min-w-0 flex-1 truncate text-[14px] text-ink-2">{t.text}</span>
                  {t.meta && <span className="shrink-0 text-[12px] text-ink-4">{t.meta}</span>}
                  <span className="inline-flex shrink-0 items-center gap-1 text-[13px] text-ink-3 group-hover:text-ink">
                    {t.action} <ArrowRight className="size-3.5" />
                  </span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <p className="px-4 pb-2 text-[14px] text-ink-3">
          {waiting.length ? `Nothing to act on. Waiting on ${c.firstName} · ${waiting.length} ${waiting.length === 1 ? 'section' : 'sections'} left.` : 'Nothing to act on.'}
        </p>
      )}

    </section>
  )
}

const requestIdeas = ['Latest 401(k) statement', 'Most recent tax return', 'Copy of your trust documents', 'Employer stock plan statement']

/** One sticky panel for everything conversational, so nothing scrolls out of reach. */
export function SidePanel({ c, tab, onTab, openThread, onOpenThread }: { c: ClientCase; tab: string; onTab: (t: string) => void; openThread?: string; onOpenThread: (id?: string) => void }) {
  const people = useStore((s) => s.people)
  const openQs = c.threads.filter((t) => !t.resolved)
  const openReqs = c.requests.filter((r) => r.status === 'open').length

  return (
    <section className="flex max-h-[calc(100vh-48px)] flex-col rounded-[26px] bg-surface p-2">
      <div className="p-2">
        <Segmented
          className="w-full [&>button]:flex-1"
          value={tab}
          onChange={onTab}
          options={[
            { value: 'questions', label: `Comments${openQs.length ? ` · ${openQs.length}` : ''}` },
            { value: 'requests', label: `Requests${openReqs ? ` · ${openReqs}` : ''}` },
            { value: 'activity', label: 'Activity' },
          ]}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {tab === 'questions' && <Questions c={c} openThread={openThread} onOpenThread={onOpenThread} />}
        {tab === 'requests' && <Requests c={c} />}
        {tab === 'activity' && (
          <div className="px-2 pt-2">
            <ActivityFeed items={c.activity} people={people} limit={40} />
          </div>
        )}
      </div>
    </section>
  )
}

function Questions({ c, openThread, onOpenThread }: { c: ClientCase; openThread?: string; onOpenThread: (id?: string) => void }) {
  return <ThreadList c={c} viewerId={ADVISOR_ID} openThread={openThread} onOpenThread={onOpenThread} canResolve waitingLabel="needs reply" empty={`No open comments. ${c.firstName} can comment on any field.`} />
}

function Requests({ c }: { c: ClientCase }) {
  const addRequest = useStore((s) => s.addRequest)
  const [title, setTitle] = useState('')
  const open = useMemo(() => c.requests.filter((r) => r.status === 'open'), [c.requests])
  const done = c.requests.filter((r) => r.status === 'done')
  const send = (t: string) => {
    if (!t.trim()) return
    addRequest(c.id, { kind: 'document', title: t.trim(), sectionId: 'networth' }, c.advisorId)
    setTitle('')
    toast('Request sent', { description: `${c.firstName} sees it under Additional requests.` })
  }
  return (
    <div className="flex flex-col gap-3 pt-2">
      <Input
        placeholder={`Ask ${c.firstName} for a document or answer`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && send(title)}
        trailing={
          <button type="button" onClick={() => send(title)} disabled={!title.trim()} className="flex size-8 items-center justify-center rounded-control bg-ink text-white disabled:opacity-25" aria-label="Send request">
            <Plus className="size-4" />
          </button>
        }
      />
      <div className="flex flex-wrap gap-1.5">
        {requestIdeas
          .filter((r) => !c.requests.some((q) => q.title === r))
          .map((r) => (
            <button key={r} type="button" onClick={() => send(r)} className="rounded-full bg-muted px-2.5 py-1 text-[12px] text-ink-3 hover:text-ink">
              {r}
            </button>
          ))}
      </div>
      <div className="flex flex-col gap-1">
        {[...open, ...done].map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-[14px] px-3 py-2.5">
            <StatusIcon status={r.status === 'done' ? 'done' : 'waiting'} size={16} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className={cn('truncate text-[14px]', r.status === 'done' ? 'text-ink-3' : 'text-ink')}>{r.title}</span>
              {r.fulfilledNote && <span className="truncate text-[12px] text-ink-4">{r.fulfilledNote}</span>}
            </span>
            <span className="shrink-0 text-[12px] text-ink-4">{relativeTime(r.fulfilledAt ?? r.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
