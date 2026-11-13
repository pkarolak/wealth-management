import { Check, Sparkles } from 'lucide-react'
import { FieldRow } from '../../components/patterns'
import { Button } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { groupsFor, isVisible, type SectionId } from '../../schema/onboarding'
import { useStore } from '../../store/caseStore'
import { caseValues, sectionStats } from '../../store/selectors'
import type { ClientCase } from '../../store/types'
import type { StepNav } from './ClientApp'
import { StepFooter, StepHeader } from './StepChrome'

const span = { full: 'sm:col-span-6', half: 'sm:col-span-3', third: 'sm:col-span-2' }

/** Schema-driven section: groups of fields on a 6-column grid. */
export function FormSection({ c, sectionId, nav }: { c: ClientCase; sectionId: SectionId; nav: StepNav }) {
  const acceptAll = useStore((s) => s.acceptAllSuggestions)
  const setProgress = useStore((s) => s.setSectionProgress)
  const values = caseValues(c)
  // Conditional fields follow the answer, or the pending draft when there's no answer yet.
  const merged = { ...values, ...Object.fromEntries(Object.entries(c.fields).filter(([k, f]) => f.suggestion && values[k] === undefined).map(([k, f]) => [k, f.suggestion?.value])) }
  const stats = sectionStats(c, sectionId)
  const remaining = stats.required - stats.requiredFilled

  return (
    <div>
      <StepHeader c={c} sectionId={sectionId} />

      {stats.suggestions > 0 && (
        <div className="mb-8 flex items-center gap-3 rounded-[18px] bg-ai-soft p-2 pl-4">
          <Sparkles className="size-4 shrink-0 text-ai" />
          <span className="flex-1 text-[14px] text-ink-2">
            We drafted <span className="font-medium">{stats.suggestions}</span> answers from what you shared. Check them, then accept.
          </span>
          <Button size="md" variant="secondary" leading={<Check className="size-4" />} onClick={() => acceptAll(c.id, sectionId, c.clientId)}>
            Accept all
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-10">
        {groupsFor(sectionId).map((g) => {
          const visible = g.fields.filter((f) => isVisible(f, merged))
          if (!visible.length) return null
          return (
            <section key={g.group} className="flex flex-col gap-4">
              <h2 className="text-[15px] font-medium text-ink">{g.group}</h2>
              <div className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-6">
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
        hint={remaining > 0 ? `${remaining} required ${remaining === 1 ? 'answer' : 'answers'} left. You can come back to ${remaining === 1 ? 'it' : 'them'}.` : stats.total ? 'All required answers done.' : undefined}
        onNext={() => {
          setProgress(c.id, sectionId, remaining === 0 && stats.suggestions === 0 ? 'done' : 'progress', c.clientId)
          nav.next()
        }}
      />
    </div>
  )
}
