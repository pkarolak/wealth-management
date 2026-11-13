import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../../components/primitives'
import { sectionById, type SectionId } from '../../schema/onboarding'
import type { ClientCase } from '../../store/types'
import { visibleSections } from '../../store/selectors'

export function StepHeader({ c, sectionId, title, description, eyebrow, aside }: { c?: ClientCase; sectionId?: SectionId; title?: ReactNode; description?: ReactNode; eyebrow?: ReactNode; aside?: ReactNode }) {
  const s = sectionId ? sectionById[sectionId] : undefined
  const secs = c ? visibleSections(c) : []
  const n = s ? secs.findIndex((x) => x.id === s.id) + 1 : 0
  return (
    <div className="mb-8 flex flex-col gap-3">
      <span className="text-[13px] text-ink-3">{eyebrow ?? (s ? `Step ${n} of ${secs.length} · about ${s.minutes} min${s.optional ? ' · optional' : ''}` : null)}</span>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="display text-[40px] text-ink sm:text-[48px]">{title ?? s?.title}</h1>
        {aside}
      </div>
      {(description ?? s?.description) && <p className="max-w-xl text-[16px] leading-relaxed text-ink-3">{description ?? s?.description}</p>}
    </div>
  )
}

export function StepFooter({ onBack, onNext, nextLabel = 'Continue', nextDisabled, hint, extra }: { onBack?: () => void; onNext: () => void; nextLabel?: string; nextDisabled?: boolean; hint?: ReactNode; extra?: ReactNode }) {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
      {onBack && (
        <Button variant="ghost" size="lg" leading={<ArrowLeft className="size-4" />} onClick={onBack}>
          Back
        </Button>
      )}
      {hint && <span className="text-[13px] text-ink-4">{hint}</span>}
      <div className="ml-auto flex items-center gap-2">
        {extra}
        <Button size="lg" trailing={<ArrowRight className="size-4" />} disabled={nextDisabled} onClick={onNext}>
          {nextLabel}
        </Button>
      </div>
    </div>
  )
}
