import { AnimatePresence, motion } from 'motion/react'
import { CalendarClock, Check, Undo2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { displayValue, isFilled, type FieldDef } from '../../schema/onboarding'
import { useStore } from '../../store/caseStore'
import { usePresenceOf } from '../../store/hooks'
import { threadsFor } from '../../store/selectors'
import type { FieldSource } from '../../store/types'
import { Button, type FieldTone } from '../primitives'
import { useCurrentCase } from './CaseContext'
import { AskAdvisorButton } from './Comments'
import { ExplainPopover } from './ExplainPopover'
import { FieldControl, hasOuterLabel } from './FieldControl'
import { PresenceLabel } from './Presence'
import { SourceTag, type SourceKind } from './SourceTag'
import { SuggestionDiff } from './SuggestionDiff'

const sourceKind = (s?: FieldSource): SourceKind | undefined => (s === 'client' || !s ? undefined : s)

/**
 * One schema field on the client side, with every collaboration state:
 * empty, AI-suggested, advisor-suggested, confirmed, needs review and deferred to the meeting.
 */
export function FieldRow({ def }: { def: FieldDef }) {
  const { c, caseId, viewerId, onFocus } = useCurrentCase()
  const people = useStore((s) => s.people)
  const setField = useStore((s) => s.setField)
  const accept = useStore((s) => s.acceptSuggestion)
  const reject = useStore((s) => s.rejectSuggestion)
  const defer = useStore((s) => s.deferField)
  const advisor = c ? people[c.advisorId] : undefined
  const advisorHere = usePresenceOf(c?.advisorId, caseId)
  if (!c) return null

  const st = c.fields[def.id] ?? {}
  const s = st.suggestion
  const filled = isFilled(st.value)
  const pendingFill = s && !filled
  const pendingChange = s && filled
  const watching = advisorHere?.fieldId === def.id
  const advisorFirst = advisor?.name.split(' ')[0] ?? 'your Wealth Manager'
  const hasThreads = threadsFor(c, { sectionId: def.sectionId, fieldId: def.id }).length > 0

  const tone: FieldTone = pendingFill ? (s.by === 'ai' ? 'ai' : 'advisor') : st.status === 'needs_review' ? 'warning' : 'default'
  const value = pendingFill ? s.value : st.value

  if (st.deferred) {
    return (
      <div className="flex items-center gap-3 rounded-[14px] border border-dashed border-line-strong bg-muted/60 p-1 pl-4">
        <CalendarClock className="size-4 shrink-0 text-ink-3" />
        <div className="flex min-w-0 flex-1 flex-col py-2">
          <span className="text-[14px] text-ink">{def.label}</span>
          <span className="text-[12px] text-ink-3">{advisorFirst} will collect this with you in the meeting.</span>
        </div>
        <Button size="sm" variant="ghost" leading={<Undo2 className="size-3.5" />} onClick={() => defer(caseId, def.id, false, viewerId)}>
          Answer now
        </Button>
      </div>
    )
  }

  const actions = (
    <span className="flex shrink-0 items-center gap-0.5">
      {def.canDefer && !filled && !pendingFill && (
        <button type="button" onClick={() => defer(caseId, def.id, true, viewerId)} className="inline-flex h-7 items-center gap-1.5 rounded-control px-2 text-[13px] whitespace-nowrap text-ink-3 transition-colors hover:bg-muted hover:text-ink">
          <CalendarClock className="size-3.5" />
          Do it in the meeting
        </button>
      )}
      <AskAdvisorButton
        anchor={{ sectionId: def.sectionId, fieldId: def.id }}
        title={def.label}
        compact
        className={cn(!hasThreads && 'opacity-0 group-focus-within/field:opacity-100 group-hover/field:opacity-100 data-[state=open]:opacity-100')}
      />
    </span>
  )

  const outerLabel = hasOuterLabel(def)
  const explain = def.explain ? <ExplainPopover term={def.explain} advisorFirst={advisorFirst} label={outerLabel ? undefined : 'Why we ask'} /> : null

  const meta = (() => {
    if (pendingFill)
      return (
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <SourceTag kind={s.by === 'advisor' ? 'advisor' : 'ai'} label={s.sourceLabel} />
          {s.confidence === 'low' && <span className="text-[12px] whitespace-nowrap text-progress-ink">Please double-check</span>}
          <button type="button" onClick={() => accept(caseId, def.id, viewerId)} className="inline-flex items-center gap-1 text-[12px] font-medium whitespace-nowrap text-ink hover:underline">
            <Check className="size-3.5" />
            Looks right
          </button>
        </span>
      )
    if (st.status === 'needs_review') return <span className="text-[12px] text-progress-ink">Changed · {advisorFirst} will recheck it</span>
    if (st.status === 'confirmed') return <SourceTag kind="confirmed" label={`Confirmed by ${advisorFirst}`} />
    const kind = filled ? sourceKind(st.source) : undefined
    if (kind) return <SourceTag kind={kind} />
    if (def.why) return <span className="text-[12px] leading-snug text-ink-4">{def.why}</span>
    return null
  })()

  return (
    <div className="group/field relative flex flex-col gap-1.5" onFocusCapture={() => onFocus?.({ sectionId: def.sectionId, fieldId: def.id })}>
      <div className={cn('relative rounded-control transition-shadow', watching && 'ring-2 ring-advisor/30 ring-offset-2 ring-offset-canvas')}>
        <FieldControl def={def} value={value} onChange={(v) => setField(caseId, def.id, v, viewerId)} tone={tone} labelAside={hasOuterLabel(def) ? explain : undefined} />
        <AnimatePresence>{watching && advisor && <PresenceLabel person={advisor} tone="pink" className="absolute -top-3.5 right-3 z-10" />}</AnimatePresence>
      </div>
      <div className="flex min-h-7 items-center justify-between gap-3 pl-1">
        <div className="flex min-w-0 items-center gap-2">
          {meta}
          {!hasOuterLabel(def) && explain}
        </div>
        {actions}
      </div>
      <AnimatePresence initial={false}>
        {pendingChange && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <SuggestionDiff
              by={s.by}
              authorName={people[s.authorId]?.name}
              authorAvatar={people[s.authorId]?.avatar}
              sourceLabel={s.sourceLabel}
              from={displayValue(def, st.value)}
              to={displayValue(def, s.value)}
              note={s.note}
              onAccept={() => accept(caseId, def.id, viewerId)}
              onReject={() => reject(caseId, def.id, viewerId)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
