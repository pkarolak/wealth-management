import { Check } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { cn } from '../../lib/cn'

/** Breadcrumb plus a two-step indicator; a step is a link once it can be reached. */
export function NewClientSteps({ step, caseId, canAdvance = true }: { step: 1 | 2; caseId?: string; canAdvance?: boolean }) {
  const navigate = useNavigate()
  const steps = [
    { n: 1, label: 'Details', to: caseId ? `/wm/c/${caseId}/edit` : undefined },
    { n: 2, label: 'Invite', to: caseId && canAdvance ? `/wm/c/${caseId}/invite` : undefined },
  ] as const
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <span className="flex items-center gap-3">
        <Link to="/wm" className="hover:text-ink">
          Overview
        </Link>
        <span className="text-ink-4">/</span>
        <span>New client</span>
      </span>
      <ol className="flex items-center gap-2">
        {steps.map((s, i) => {
          const current = s.n === step
          const done = s.n < step
          const clickable = !current && !!s.to
          return (
            <li key={s.n} className="flex items-center gap-2">
              {i > 0 && <span className={cn('h-px w-6', done || current ? 'bg-ink-4' : 'bg-line-strong')} />}
              <button
                type="button"
                disabled={!clickable}
                onClick={() => s.to && navigate(s.to)}
                className={cn('inline-flex h-7 items-center gap-1.5 rounded-full pr-3 pl-1 text-[13px] transition-colors', current ? 'bg-surface text-ink shadow-soft' : 'text-ink-3', clickable && 'hover:bg-surface hover:text-ink')}
              >
                <span className={cn('flex size-5 items-center justify-center rounded-full text-[11px]', current ? 'bg-ink text-white' : done ? 'bg-success-soft text-success' : 'bg-muted text-ink-3')}>
                  {done ? <Check className="size-3" /> : s.n}
                </span>
                {s.label}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
