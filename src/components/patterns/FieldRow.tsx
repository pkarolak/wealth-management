import { AnimatePresence, motion } from 'motion/react'
import { CalendarClock, Check, Undo2 } from 'lucide-react'
import { useRef, useState } from 'react'
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

const open = 'group-focus-within/field:opacity-100 group-has-[[data-state=open]]/field:opacity-100'
const reveal = {
  fade: `opacity-0 transition-opacity duration-200 ${open}`,
  collapse: `grid-rows-[0fr] opacity-0 ${open} group-focus-within/field:grid-rows-[1fr] group-has-[[data-state=open]]/field:grid-rows-[1fr]`,
}

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
  // Touch screens have no hover, so the ask button only shows on the field being edited. The delay lets a tap on it land before blur hides it.
  const [active, setActive] = useState(false)
  const blurTimer = useRef<number>(undefined)
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

  const outerLabel = hasOuterLabel(def)
  const borderless = outerLabel || def.type === 'checkbox'
  const ask = (
    <span
      className={cn(
        'transition-opacity duration-150',
        !hasThreads && (active ? 'pointer-coarse:inline' : 'pointer-coarse:hidden pointer-coarse:has-[[data-state=open]]:inline'),
        !hasThreads &&
          'pointer-events-none opacity-0 group-focus-within/field:pointer-events-auto group-focus-within/field:opacity-100 group-hover/field:pointer-events-auto group-hover/field:opacity-100 has-[[data-state=open]]:pointer-events-auto has-[[data-state=open]]:opacity-100',
      )}
    >
      <AskAdvisorButton anchor={{ sectionId: def.sectionId, fieldId: def.id }} title={def.label} floating />
    </span>
  )

  // Always visible: only what the client needs to act on or be reassured by.
  const status = pendingFill ? (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <SourceTag kind={s.by === 'advisor' ? 'advisor' : 'ai'} label={s.sourceLabel} />
      {s.confidence === 'low' && <span className="text-[12px] whitespace-nowrap text-progress-ink">Please double-check</span>}
      <button
        type="button"
        onClick={() => accept(caseId, def.id, viewerId)}
        className="relative before:absolute before:-inset-x-1 before:-inset-y-2.5 before:content-[''] -my-1 -ml-1 inline-flex h-6 items-center gap-1 rounded-full bg-surface pr-2.5 pl-2 text-[12px] whitespace-nowrap text-ink-2 shadow-soft ring-1 ring-line transition-colors ring-inset hover:text-ink hover:ring-line-strong"
      >
        <Check className="size-3.5" />
        Approve
      </button>
    </span>
  ) : null

  // Revealed on focus, or while one of the field's popovers is open.
  const provenance = !status && filled ? sourceKind(st.source) : undefined
  const why = def.why && !(filled && !status && provenance) ? def.why : undefined
  const help = (provenance || why || (def.explain && !outerLabel)) && (
    <span className="min-w-0 text-[12px] leading-[18px] text-ink-4">
      {provenance && <SourceTag kind={provenance} className="mr-2 align-[-1px]" />}
      {why && <span className="mr-2">{why}</span>}
      {def.explain && !outerLabel && <ExplainPopover term={def.explain} advisorFirst={advisorFirst} inline />}
    </span>
  )
  const actions = (
    <span className="flex shrink-0 items-center gap-0.5">
      {def.canDefer && !filled && !pendingFill && (
        <button type="button" onClick={() => defer(caseId, def.id, true, viewerId)} className="inline-flex h-7 items-center gap-1.5 rounded-control px-2 text-[12px] pointer-coarse:h-11 pointer-coarse:text-[13px] whitespace-nowrap text-ink-3 transition-colors hover:bg-muted hover:text-ink">
          <CalendarClock className="size-3.5" />
          Do it in the meeting
        </button>
      )}
    </span>
  )
  const hasActions = !!def.canDefer && !filled && !pendingFill
  const alwaysOpen = def.type === 'sensitive'
  const inline = !!status

  return (
    <div
      className="group/field relative flex flex-col gap-1"
      onFocusCapture={() => {
        window.clearTimeout(blurTimer.current)
        setActive(true)
        onFocus?.({ sectionId: def.sectionId, fieldId: def.id })
      }}
      onBlurCapture={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return
        blurTimer.current = window.setTimeout(() => setActive(false), 300)
      }}
    >
      <div className={cn('relative rounded-control transition-shadow', watching && 'ring-2 ring-advisor/30 ring-offset-2 ring-offset-canvas')}>
        <FieldControl
          def={def}
          value={value}
          onChange={(v) => setField(caseId, def.id, v, viewerId)}
          tone={tone}
          labelAside={
            borderless ? (
              <span className="-my-1 ml-0.5 inline-flex items-center gap-1.5">
                {outerLabel && def.explain && <ExplainPopover term={def.explain} advisorFirst={advisorFirst} />}
                {ask}
                <AnimatePresence>{watching && advisor && <PresenceLabel person={advisor} tone="pink" />}</AnimatePresence>
              </span>
            ) : undefined
          }
        />
        {!borderless && (
          <div className="absolute -top-3 right-3 z-10 flex items-center gap-1.5">
            <AnimatePresence>{watching && advisor && <PresenceLabel person={advisor} tone="pink" className="-my-0.5" />}</AnimatePresence>
            {ask}
          </div>
        )}
      </div>
      {inline && (
        <div className="flex min-h-7 items-center justify-between gap-3 pl-1">
          {status}
          {hasActions && <span className={cn(!alwaysOpen && reveal.fade)}>{actions}</span>}
        </div>
      )}
      {(help || (!inline && hasActions)) && (
        <div className={cn('grid transition-[grid-template-rows,opacity] duration-200 ease-out', alwaysOpen ? 'grid-rows-[1fr]' : reveal.collapse)}>
          <div className="flex min-h-0 items-start justify-between gap-3 overflow-hidden pl-1">
            <div className="py-1">{help}</div>
            {!inline && hasActions && actions}
          </div>
        </div>
      )}
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
