import { Check, GraduationCap, Heart, Home, Landmark, ShoppingBag, Sparkles, Sunset, Target, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { moneyCompact } from '../../lib/format'
import type { Goal, GoalKind } from '../../store/types'

export const goalMeta: Record<GoalKind, { icon: ReactNode; tint: string; label: string }> = {
  retirement: { icon: <Sunset className="size-4" />, tint: 'bg-progress-soft text-progress-ink', label: 'Retirement' },
  education: { icon: <GraduationCap className="size-4" />, tint: 'bg-waiting-soft text-waiting', label: 'Education' },
  home: { icon: <Home className="size-4" />, tint: 'bg-success-soft text-success', label: 'Home' },
  purchase: { icon: <ShoppingBag className="size-4" />, tint: 'bg-advisor-soft text-advisor', label: 'Big purchase' },
  legacy: { icon: <Landmark className="size-4" />, tint: 'bg-muted text-ink-2', label: 'Legacy' },
  giving: { icon: <Heart className="size-4" />, tint: 'bg-danger-soft text-danger', label: 'Giving' },
  other: { icon: <Target className="size-4" />, tint: 'bg-muted text-ink-2', label: 'Other' },
}

const priorityLabel = { high: 'Top priority', medium: 'Important', low: 'Nice to have' }

/** Goal tile in the style of the reference agent cards. 16px padding around a 10px icon tile → 26. */
export function GoalCard({ goal, onClick, onAccept, onRemove, className }: { goal: Goal; onClick?: () => void; onAccept?: () => void; onRemove?: () => void; className?: string }) {
  const m = goalMeta[goal.kind]
  const years = goal.targetYear ? goal.targetYear - new Date().getFullYear() : undefined
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex min-h-40 flex-col justify-between gap-4 rounded-[26px] p-4 text-left transition-colors',
        goal.draft ? 'border border-dashed border-ai/35 bg-ai-soft/35' : 'bg-muted hover:bg-sunken/70',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1 pt-1 pl-1">
          <span className="text-[19px] leading-tight text-ink">{goal.title}</span>
          <span className="text-[13px] text-ink-3">
            {goal.targetYear ? `${goal.targetYear}${years !== undefined && years > 0 ? ` · in ${years} years` : ''}` : 'No date yet'}
          </span>
        </div>
        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-control', m.tint)}>{m.icon}</span>
      </div>
      <div className="flex items-end justify-between gap-3 pl-1">
        <div className="flex flex-col gap-1">
          {goal.draft && (
            <span className="inline-flex items-center gap-1 text-[12px] text-ai">
              <Sparkles className="size-3" /> {goal.sourceLabel ?? 'Suggested'}
            </span>
          )}
          <span className="text-[13px] text-ink-3">
            {goal.amount ? <span className="tabular text-ink">{moneyCompact(goal.amount)}</span> : 'Amount to discuss'} · {priorityLabel[goal.priority]}
          </span>
        </div>
        {goal.draft && (onAccept || onRemove) && (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            {onRemove && (
              <button type="button" onClick={onRemove} className="flex size-8 items-center justify-center rounded-control text-ink-3 hover:bg-surface hover:text-ink" aria-label="Remove goal">
                <X className="size-4" />
              </button>
            )}
            {onAccept && (
              <button type="button" onClick={onAccept} className="inline-flex h-8 items-center gap-1 rounded-control bg-ink px-3 text-[13px] font-medium text-white" aria-label="Keep goal">
                <Check className="size-3.5" /> Keep
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
