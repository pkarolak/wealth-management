import { ArrowRight, IdCard, Sparkles } from 'lucide-react'
import { FieldRow } from '../../components/patterns'
import { toast } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { groupsFor, isFilled, isVisible, sectionById, type SectionId } from '../../schema/onboarding'
import { fieldError } from '../../schema/validation'
import { useStore } from '../../store/caseStore'
import { caseValues, draftsIn, mergedValues, sectionStats } from '../../store/selectors'
import type { ClientCase } from '../../store/types'
import type { StepNav } from './ClientApp'
import { StepFooter, StepHeader } from './StepChrome'

const span = { full: 'sm:col-span-6', half: 'sm:col-span-3', third: 'sm:col-span-2' }

/** Schema-driven section: groups of fields on a 6-column grid. */
export function FormSection({ c, sectionId, nav }: { c: ClientCase; sectionId: SectionId; nav: StepNav }) {
  const accept = useStore((s) => s.acceptSuggestion)
  const setProgress = useStore((s) => s.setSectionProgress)
  const values = caseValues(c)
  // Conditional fields follow the answer, or the pending draft when there's no answer yet.
  const merged = mergedValues(c)
  const stats = sectionStats(c, sectionId)
  const visibleFields = groupsFor(sectionId).flatMap((g) => g.fields.filter((f) => isVisible(f, merged)))
  const { fills: drafts, changes: changeIds } = draftsIn(c, sectionId)
  const changes = changeIds.length
  const invalid = visibleFields.filter((f) => fieldError(f, values[f.id])).length
  const remaining = visibleFields.filter((f) => f.required && !c.fields[f.id]?.deferred && (!isFilled(values[f.id]) || fieldError(f, values[f.id])) && !drafts.includes(f.id)).length
  const advisorFirst = useStore((s) => s.people[c.advisorId]?.name.split(' ')[0] ?? 'your Wealth Manager')

  const leave = () => {
    drafts.forEach((id) => accept(c.id, id, c.clientId))
    setProgress(c.id, sectionId, remaining === 0 && changes === 0 ? 'done' : 'progress', c.clientId)
    const left = remaining + invalid
    if (left > 0) toast(`${left} ${left === 1 ? 'answer' : 'answers'} left in ${sectionById[sectionId].short}`, { description: 'Come back anytime from the step list.' })
    nav.next()
  }

  const groupSource = (fs: typeof visibleFields) => {
    const s = fs.filter((f) => drafts.includes(f.id)).map((f) => c.fields[f.id]?.suggestion).find((x) => x?.by === 'ai')
    return s && (s.sourceLabel ? s.sourceLabel.replace(/^From /, 'Filled from ') : 'Filled in for you')
  }

  const hint =
    invalid > 0
      ? `${invalid === 1 ? 'One answer needs' : `${invalid} answers need`} a quick fix above.`
      : changes > 0
      ? `${advisorFirst} suggested ${changes === 1 ? 'a change' : `${changes} changes`} above. Approve or keep yours.`
      : remaining > 0
          ? `${remaining} required ${remaining === 1 ? 'answer' : 'answers'} left. You can come back to ${remaining === 1 ? 'it' : 'them'}.`
          : stats.total
            ? 'All required answers done.'
            : undefined

  return (
    <div>
      <StepHeader c={c} sectionId={sectionId} />

      {sectionId === 'about' && !c.idScanned && (
        <button type="button" onClick={() => nav.go('id')} className="mb-8 flex w-full items-center gap-3 rounded-[18px] bg-surface p-4 text-left shadow-soft transition-shadow hover:shadow-float">
          <IdCard className="size-5 shrink-0 text-ink-2" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[15px] text-ink">Fill this in from your driver’s license</span>
            <span className="text-[13px] text-ink-3">Take or choose a photo. You check everything before it’s saved.</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-ink-3" />
        </button>
      )}

      {drafts.length > 0 && (
        <p className="mb-8 flex items-center gap-2 text-[14px] text-ink-2">
          <Sparkles className="size-4 shrink-0 text-ai" />
          {drafts.length} {drafts.length === 1 ? 'answer' : 'answers'} filled in for you, outlined in blue. Change anything that’s off; Continue saves the rest.
        </p>
      )}

      <div className="flex flex-col gap-10">
        {groupsFor(sectionId).map((g) => {
          const visible = g.fields.filter((f) => isVisible(f, merged))
          if (!visible.length) return null
          return (
            <section key={g.group} className="flex flex-col gap-4">
              <h2 className="flex flex-wrap items-baseline gap-x-2 text-[15px] font-medium text-ink">
                {g.group}
                {groupSource(visible) && <span className="text-[13px] font-normal text-ai">· {groupSource(visible)}</span>}
              </h2>
              <div className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-6">
                {visible.map((f) => (
                  <div key={f.id} className={cn(span[f.width ?? 'full'])}>
                    <FieldRow def={f} />
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <StepFooter
        onBack={nav.back}
        hint={hint}
        onNext={leave}
      />
    </div>
  )
}
