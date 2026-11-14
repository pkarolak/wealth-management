import { GraduationCap, Heart, Home, Landmark, ShoppingBag, Sparkles, Sunset, Target, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { moneyCompact } from '../../lib/format'
import type { Goal, GoalKind } from '../../store/types'
import { Tooltip } from '../primitives'

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

function IconAction({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip content={label}>
      <button type="button" onClick={onClick} aria-label={label} className="flex size-9 items-center justify-center rounded-control bg-surface text-ink-2 shadow-soft transition-colors hover:text-ink">
        {children}
      </button>
    </Tooltip>
  )
}

const estimateNote: Record<GoalKind, string> = {
  retirement: 'About 25 times the yearly spending you mentioned, in today’s dollars. Emily will refine it with you.',
  education: 'Four years at a public in-state university today, grown for tuition inflation.',
  home: 'A typical down payment for the price range you mentioned.',
  purchase: 'The figure you mentioned in your intro.',
  legacy: 'The figure you mentioned in your intro.',
  giving: 'The figure you mentioned in your intro.',
  other: 'The figure you mentioned in your intro.',
}

/** Goal tile. 16px padding around a 10px icon tile → 26. Drafts: tinted, with actions on hover in place of the icon. */
export function GoalCard({ goal, onClick, onAccept, onRemove, className }: { goal: Goal; onClick?: () => void; onAccept?: () => void; onRemove?: () => void; className?: string }) {
  const m = goalMeta[goal.kind]
  const years = goal.targetYear ? goal.targetYear - new Date().getFullYear() : undefined
  const actions = goal.draft && (onAccept || onRemove)
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex min-h-40 flex-col justify-between gap-4 rounded-[26px] p-4 text-left transition-colors',
        'bg-muted hover:bg-sunken/70',
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
        <div className="relative shrink-0">
          <span className={cn('relative flex size-9 items-center justify-center rounded-control transition-opacity', m.tint, actions && 'group-focus-within:opacity-0 group-hover:opacity-0')}>
            {m.icon}
            {goal.draft && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-surface text-ai shadow-soft">
                <Sparkles className="size-2.5" />
              </span>
            )}
          </span>
          {actions && (
            <div className="absolute top-0 right-0 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
              {onRemove && (
                <IconAction label="Remove" onClick={onRemove}>
                  <X className="size-4" />
                </IconAction>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-0.5 pl-1">
        <span className="flex items-baseline gap-2">
          <span className="tabular text-[17px] text-ink">{goal.amount ? moneyCompact(goal.amount) : 'Amount to discuss'}</span>
          {goal.draft && goal.amount && (
            <Tooltip content={estimateNote[goal.kind]}>
              <button type="button" onClick={(e) => e.stopPropagation()} className="relative text-[12px] text-ai underline decoration-ai/40 underline-offset-[3px] before:absolute before:-inset-3">
                How we estimated this
              </button>
            </Tooltip>
          )}
        </span>
        <span className="text-[13px] whitespace-nowrap text-ink-3">{goal.draft ? (goal.sourceLabel ?? 'Suggested') : priorityLabel[goal.priority]}</span>
      </div>
    </div>
  )
}
